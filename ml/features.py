"""
ml/features.py
--------------
Feature engineering for match outcome prediction.

FeatureEngine is a class (not loose functions) so the feature set is
self-documenting and easy to extend.

Key design: exclude_match_id prevents data leakage during training —
each match's features are computed WITHOUT including that match itself.
"""

import numpy as np
from sqlalchemy import text


class FeatureEngine:

    FEATURE_COLS = [
        'team_a_win_pct',
        'team_b_win_pct',
        'team_a_goals_per_match',
        'team_b_goals_per_match',
        'team_a_goals_against',
        'team_b_goals_against',
        'team_a_wc_experience',
        'team_b_wc_experience',
        'team_a_avg_xg',
        'team_b_avg_xg',
    ]

    def __init__(self, session):
        self.session = session
        self._team_stats_cache = {}

    # ── private ───────────────────────────────────────────────────────────────

    def _get_team_stats(self, team_id: int,
                        exclude_match_id: int = None) -> dict:
        """
        Compute per-team aggregate stats.
        exclude_match_id: exclude this match so training features
        don't leak the result being predicted (data leakage fix).
        """
        cache_key = (team_id, exclude_match_id)
        if cache_key in self._team_stats_cache:
            return self._team_stats_cache[cache_key]

        excl        = "AND m.id != :exclude_id" if exclude_match_id else ""
        excl_params = {'exclude_id': exclude_match_id} if exclude_match_id else {}

        sql = text(f"""
            WITH all_matches AS (
                SELECT
                    score_a AS gf,
                    score_b AS ga,
                    CASE WHEN winner = t.name THEN 1 ELSE 0 END AS won
                FROM matches m
                JOIN teams t ON t.id = :team_id
                WHERE team_a_id = :team_id
                  AND score_a IS NOT NULL
                  {excl}

                UNION ALL

                SELECT
                    score_b AS gf,
                    score_a AS ga,
                    CASE WHEN winner = t.name THEN 1 ELSE 0 END AS won
                FROM matches m
                JOIN teams t ON t.id = :team_id
                WHERE team_b_id = :team_id
                  AND score_b IS NOT NULL
                  {excl}
            )
            SELECT
                COUNT(*)                               AS played,
                ROUND(AVG(won)::numeric, 4)            AS win_pct,
                ROUND(AVG(gf)::numeric, 4)             AS goals_for_avg,
                ROUND(AVG(ga)::numeric, 4)             AS goals_against_avg
            FROM all_matches
        """)

        params = {'team_id': team_id, **excl_params}
        row    = self.session.execute(sql, params).fetchone()

        xg_excl = "AND ms.match_id != :exclude_id" if exclude_match_id else ""
        xg_sql  = text(f"""
            SELECT ROUND(AVG(ms.xg)::numeric, 4) AS avg_xg
            FROM match_stats ms
            WHERE ms.team_id = :team_id
            {xg_excl}
        """)
        xg_row = self.session.execute(xg_sql, params).fetchone()

        from api.models import Team
        team = self.session.get(Team, team_id)

        stats = {
            'win_pct':           float(row.win_pct           or 0),
            'goals_for_avg':     float(row.goals_for_avg     or 0),
            'goals_against_avg': float(row.goals_against_avg or 0),
            'wc_experience':     int(team.world_cups_played   or 0),
            'avg_xg':            float(xg_row.avg_xg          or 0),
        }

        self._team_stats_cache[cache_key] = stats
        return stats

    def _row_to_features(self, team_a_id: int, team_b_id: int,
                         exclude_match_id: int = None) -> list:
        """Build a single 10-element feature vector."""
        a = self._get_team_stats(team_a_id, exclude_match_id)
        b = self._get_team_stats(team_b_id, exclude_match_id)
        return [
            a['win_pct'],
            b['win_pct'],
            a['goals_for_avg'],
            b['goals_for_avg'],
            a['goals_against_avg'],
            b['goals_against_avg'],
            a['wc_experience'],
            b['wc_experience'],
            a['avg_xg'],
            b['avg_xg'],
        ]

    # ── public ────────────────────────────────────────────────────────────────

    def build_training_data(self):
        """
        Build X (features) and y (labels) from all completed matches.

        Label encoding:
            0 = team_a wins
            1 = draw
            2 = team_b wins
        """
        from api.models import Match, Team

        # Load all team names once — avoids N+1 queries in the loop
        team_name_map = {
            t.id: t.name
            for t in self.session.query(Team).all()
        }

        matches = self.session.query(Match).filter(
            Match.score_a.isnot(None),
            Match.score_b.isnot(None),
            Match.winner.isnot(None),
        ).all()

        rows, labels = [], []
        skipped = 0

        print(f'  Building features for {len(matches)} matches...')

        for m in matches:
            try:
                features = self._row_to_features(
                    m.team_a_id,
                    m.team_b_id,
                    exclude_match_id=m.id,   # prevent data leakage
                )
            except Exception:
                skipped += 1
                continue

            team_a_name  = team_name_map.get(m.team_a_id, '').strip()
            winner_clean = m.winner.strip()

            if winner_clean == 'Draw':
                label = 1
            elif winner_clean == team_a_name:
                label = 0
            else:
                label = 2

            rows.append(features)
            labels.append(label)

        if skipped:
            print(f'  Skipped: {skipped} matches (missing team stats)')

        X = np.array(rows, dtype=float)
        y = np.array(labels, dtype=int)
        print(f'  ✓ Feature matrix: {X.shape}  |  Labels: {y.shape}')
        return X, y

    def build_single_prediction(self, team_a_id: int,
                                team_b_id: int) -> np.ndarray:
        """
        Build feature vector for a live prediction.
        No exclude_match_id — use ALL historical data for live predictions.
        Returns shape (1, 10).
        """
        features = self._row_to_features(team_a_id, team_b_id)
        return np.array([features], dtype=float)