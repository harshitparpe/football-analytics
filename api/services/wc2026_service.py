"""
api/services/wc2026_service.py
---------------------------------
Business logic for the WC2026 fixture tracker:
- Bulk fetch fixtures grouped by stage
- Record actual results and auto-advance knockout bracket
- Recompute group standings from played group matches
"""

from api.extensions import db
from api.models import WC2026Fixture, Team
from api.services.prediction_service import PredictionService


class WC2026Service:

    STAGE_ORDER = ['group', 'round_of_32', 'round_of_16',
                    'quarterfinal', 'semifinal', 'third_place', 'final']

    @staticmethod
    def get_all_fixtures():
        """Returns all fixtures grouped by stage, ordered by match_number."""
        fixtures = WC2026Fixture.query.order_by(WC2026Fixture.match_number).all()

        by_stage = {}
        for f in fixtures:
            by_stage.setdefault(f.stage, []).append(f)

        return by_stage

    @staticmethod
    def get_group_standings():
        """
        Compute standings (P/W/D/L/Pts) per group from played group fixtures.
        Returns dict[group_letter] -> list of {team, played, won, drawn, lost, points, gf, ga}
        """
        groups = {}
        fixtures = WC2026Fixture.query.filter_by(stage='group').all()

        for f in fixtures:
            for team in [f.team_a_name, f.team_b_name]:
                groups.setdefault(f.group_name, {}).setdefault(team, {
                    'team': team, 'played': 0, 'won': 0, 'drawn': 0,
                    'lost': 0, 'gf': 0, 'ga': 0, 'points': 0
                })

            if not f.is_played:
                continue

            a, b = f.team_a_name, f.team_b_name
            groups[f.group_name][a]['played'] += 1
            groups[f.group_name][b]['played'] += 1
            groups[f.group_name][a]['gf'] += f.actual_score_a
            groups[f.group_name][a]['ga'] += f.actual_score_b
            groups[f.group_name][b]['gf'] += f.actual_score_b
            groups[f.group_name][b]['ga'] += f.actual_score_a

            if f.actual_winner == 'Draw':
                groups[f.group_name][a]['drawn'] += 1
                groups[f.group_name][b]['drawn'] += 1
                groups[f.group_name][a]['points'] += 1
                groups[f.group_name][b]['points'] += 1
            elif f.actual_winner == a:
                groups[f.group_name][a]['won'] += 1
                groups[f.group_name][a]['points'] += 3
                groups[f.group_name][b]['lost'] += 1
            else:
                groups[f.group_name][b]['won'] += 1
                groups[f.group_name][b]['points'] += 3
                groups[f.group_name][a]['lost'] += 1

        result = {}
        for group_letter, teams in groups.items():
            standings = sorted(
                teams.values(),
                key=lambda t: (t['points'], t['gf'] - t['ga'], t['gf']),
                reverse=True
            )
            result[group_letter] = standings

        return result

    @staticmethod
    def record_result(match_number: int, score_a: int, score_b: int) -> dict:
        """
        Record the actual result of a fixture. Determines winner,
        sets is_played=True. Does NOT auto-advance knockout slots
        (kept simple — manual bracket editing for knockout rounds).
        """
        fixture = WC2026Fixture.query.filter_by(match_number=match_number).first()
        if not fixture:
            raise ValueError(f'Fixture #{match_number} not found')

        fixture.actual_score_a = score_a
        fixture.actual_score_b = score_b
        fixture.is_played = True

        if score_a > score_b:
            fixture.actual_winner = fixture.team_a_name
        elif score_b > score_a:
            fixture.actual_winner = fixture.team_b_name
        else:
            fixture.actual_winner = 'Draw'

        db.session.commit()

        return {
            'match_number': fixture.match_number,
            'actual_winner': fixture.actual_winner,
            'predicted_winner': fixture.predicted_winner,
            'prediction_correct': fixture.prediction_correct,
        }

    @staticmethod
    def update_knockout_teams(match_number: int, team_a_name: str = None,
                              team_b_name: str = None) -> dict:
        """
        Manually set team names for a knockout fixture once group standings
        or earlier knockout results determine who advances.
        """
        fixture = WC2026Fixture.query.filter_by(match_number=match_number).first()
        if not fixture:
            raise ValueError(f'Fixture #{match_number} not found')

        if team_a_name:
            fixture.team_a_name = team_a_name
            team = Team.query.filter_by(name=team_a_name).first()
            fixture.team_a_id = team.id if team else None
        if team_b_name:
            fixture.team_b_name = team_b_name
            team = Team.query.filter_by(name=team_b_name).first()
            fixture.team_b_id = team.id if team else None

        # Re-run prediction if both teams now known
        if fixture.team_a_id and fixture.team_b_id:
            try:
                pred = PredictionService.predict_match(fixture.team_a_id, fixture.team_b_id)
                fixture.pred_team_a_prob = pred['team_a']['win_prob']
                fixture.pred_draw_prob   = pred['draw']['prob']
                fixture.pred_team_b_prob = pred['team_b']['win_prob']
                fixture.predicted_winner = pred['favourite']
            except Exception:
                pass

        db.session.commit()
        return {'match_number': fixture.match_number, 'updated': True}

    @staticmethod
    def get_accuracy_summary() -> dict:
        """Returns overall prediction accuracy stats for played matches."""
        played = WC2026Fixture.query.filter_by(is_played=True).all()
        with_pred = [f for f in played if f.predicted_winner]

        if not with_pred:
            return {'played': len(played), 'predicted': 0, 'correct': 0, 'accuracy': None}

        correct = sum(1 for f in with_pred if f.prediction_correct)

        return {
            'played': len(played),
            'predicted': len(with_pred),
            'correct': correct,
            'accuracy': round(correct / len(with_pred), 3) if with_pred else None,
        }