"""
api/services/stats_service.py
------------------------------
Analytical queries using SQLAlchemy ORM + raw SQL where aggregations
are cleaner that way. Both approaches on your resume = stronger signal.
"""

from sqlalchemy import text, func, case
from api.extensions import db
from api.models import Team, Match, MatchStat


class StatsService:
    """
    Service layer: all heavy DB reads live here, not in routes.
    Routes stay thin (parse request → call service → return JSON).
    This is the Service pattern — an OOP design interviewers ask about.
    """

    # ── Query 1: Win / Draw / Loss record for a team ─────────────────────────
    @staticmethod
    def get_team_record(team_id: int) -> dict:
        """
        Uses SQLAlchemy ORM aggregation with case() expressions.
        Combines home and away matches into a single summary.
        """
        team = Team.query.get_or_404(team_id)

        home_stats = db.session.query(
            func.count().label('played'),
            func.sum(case((Match.winner == team.name, 1), else_=0)).label('wins'),
            func.sum(case((Match.winner == 'Draw',    1), else_=0)).label('draws'),
            func.sum(case(((Match.winner != team.name) &
                           (Match.winner != 'Draw'),  1), else_=0)).label('losses'),
            func.sum(Match.score_a).label('gf'),
            func.sum(Match.score_b).label('ga'),
        ).filter(Match.team_a_id == team_id,
                 Match.score_a.isnot(None)).one()

        away_stats = db.session.query(
            func.count().label('played'),
            func.sum(case((Match.winner == team.name, 1), else_=0)).label('wins'),
            func.sum(case((Match.winner == 'Draw',    1), else_=0)).label('draws'),
            func.sum(case(((Match.winner != team.name) &
                           (Match.winner != 'Draw'),  1), else_=0)).label('losses'),
            func.sum(Match.score_b).label('gf'),
            func.sum(Match.score_a).label('ga'),
        ).filter(Match.team_b_id == team_id,
                 Match.score_b.isnot(None)).one()

        played = (home_stats.played or 0) + (away_stats.played or 0)
        wins   = (home_stats.wins   or 0) + (away_stats.wins   or 0)
        draws  = (home_stats.draws  or 0) + (away_stats.draws  or 0)
        losses = (home_stats.losses or 0) + (away_stats.losses or 0)
        gf     = (home_stats.gf     or 0) + (away_stats.gf     or 0)
        ga     = (home_stats.ga     or 0) + (away_stats.ga     or 0)

        return {
            'team_id':        team_id,
            'team_name':      team.name,
            'confederation':  team.confederation,
            'played':         played,
            'wins':           wins,
            'draws':          draws,
            'losses':         losses,
            'goals_for':      gf,
            'goals_against':  ga,
            'goal_difference':gf - ga,
            'win_percentage': round((wins / played * 100), 2) if played else 0.0,
            'points':         (wins * 3) + draws,
        }

    # ── Query 2: Head-to-head between two teams ───────────────────────────────
    @staticmethod
    def get_head_to_head(team_a_id: int, team_b_id: int) -> dict:
        """
        Finds all historical matches between two teams regardless of
        which was 'home' or 'away' in the CSV.
        Classic interview question: how do you query a symmetric relationship?
        """
        team_a = Team.query.get_or_404(team_a_id)
        team_b = Team.query.get_or_404(team_b_id)

        matches = Match.query.filter(
            db.or_(
                db.and_(Match.team_a_id == team_a_id,
                        Match.team_b_id == team_b_id),
                db.and_(Match.team_a_id == team_b_id,
                        Match.team_b_id == team_a_id),
            ),
            Match.score_a.isnot(None)
        ).order_by(Match.year.desc()).all()

        a_wins  = sum(1 for m in matches if m.winner == team_a.name)
        b_wins  = sum(1 for m in matches if m.winner == team_b.name)
        draws   = sum(1 for m in matches if m.winner == 'Draw')

        return {
            'team_a':    team_a.name,
            'team_b':    team_b.name,
            'played':    len(matches),
            'team_a_wins': a_wins,
            'team_b_wins': b_wins,
            'draws':     draws,
            'matches': [
                {
                    'year':    m.year,
                    'stage':   m.stage,
                    'score':   f'{m.score_a}–{m.score_b}',
                    'winner':  m.winner,
                }
                for m in matches[:10]   # last 10 meetings
            ]
        }

    # ── Query 3: Tournament averages — goal & xG stats ───────────────────────
    @staticmethod
    def get_tournament_averages(year: int = None) -> dict:
        """
        Aggregates match_stats across all (or a single year's) matches.
        Uses raw SQL via db.session.execute() for readability on complex
        multi-table aggregations — a technique worth mentioning in interviews.
        """
        year_filter = "AND m.year = :year" if year else ""

        sql = text(f"""
            SELECT
                COUNT(DISTINCT m.id)            AS total_matches,
                ROUND(AVG(ms.possession_pct)::numeric, 1) AS avg_possession,
                ROUND(AVG(ms.shots)::numeric, 1)          AS avg_shots,
                ROUND(AVG(ms.shots_on_target)::numeric, 1)AS avg_shots_on_target,
                ROUND(AVG(ms.xg)::numeric, 2)             AS avg_xg,
                ROUND(AVG(ms.fouls)::numeric, 1)          AS avg_fouls,
                ROUND(
                        (
                            SUM(m.score_a + m.score_b)::numeric /
                            NULLIF(COUNT(DISTINCT m.id), 0)
                        ),
                        2
                    ) AS avg_goals_per_match  
            FROM matches m
            JOIN match_stats ms ON ms.match_id = m.id
            WHERE m.score_a IS NOT NULL
            {year_filter}
        """)

        params = {'year': year} if year else {}
        row = db.session.execute(sql, params).fetchone()

        return {
            'year':                year or 'all',
            'total_matches':       row.total_matches,
            'avg_possession':      row.avg_possession,
            'avg_shots':           row.avg_shots,
            'avg_shots_on_target': row.avg_shots_on_target,
            'avg_xg':              row.avg_xg,
            'avg_fouls':           row.avg_fouls,
            'avg_goals_per_match': row.avg_goals_per_match,
        }