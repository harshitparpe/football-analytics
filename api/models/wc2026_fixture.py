"""
api/models/wc2026_fixture.py
------------------------------
Stores the WC 2026 fixture template, predictions, and actual results.

Design: a single table holds group-stage AND knockout fixtures.
- stage='group': group_name set (A-L), round=null
- stage='round_of_32' / 'round_of_16' / 'quarterfinal' / 'semifinal' /
  'third_place' / 'final': group_name=null, round set

match_number is a global sequence (1-104 for 72 group + 32 knockout matches)
used for ordering and for knockout bracket linking (next_match_number).
"""

from api.extensions import db


class WC2026Fixture(db.Model):
    __tablename__ = 'wc2026_fixtures'

    id = db.Column(db.Integer, primary_key=True)
    match_number = db.Column(db.Integer, nullable=False, unique=True)

    stage      = db.Column(db.String(20), nullable=False)   # group, round_of_32, ...
    group_name = db.Column(db.String(5))                    # A-L for group stage
    round_name = db.Column(db.String(50))                    # display label

    # Team slots — nullable because knockout slots are filled by
    # "Winner of Match X" until that match resolves
    team_a_name = db.Column(db.String(100))
    team_b_name = db.Column(db.String(100))
    team_a_id   = db.Column(db.Integer, db.ForeignKey('teams.id'), nullable=True)
    team_b_id   = db.Column(db.Integer, db.ForeignKey('teams.id'), nullable=True)

    # For knockout: which prior matches feed into this one
    feeds_from_a = db.Column(db.Integer)   # match_number of source match for team_a
    feeds_from_b = db.Column(db.Integer)   # match_number of source match for team_b

    # ML prediction (auto-filled when both teams are known)
    pred_team_a_prob = db.Column(db.Float)
    pred_draw_prob   = db.Column(db.Float)
    pred_team_b_prob = db.Column(db.Float)
    predicted_winner = db.Column(db.String(100))

    # Actual result (filled in manually as tournament progresses)
    actual_score_a = db.Column(db.Integer)
    actual_score_b = db.Column(db.Integer)
    actual_winner  = db.Column(db.String(100))   # team name or 'Draw'
    is_played      = db.Column(db.Boolean, default=False)

    venue = db.Column(db.String(150))
    match_date = db.Column(db.Date)

    @property
    def prediction_correct(self):
        """Returns True/False/None (None = not yet played or no prediction)."""
        if not self.is_played or not self.predicted_winner:
            return None
        return self.predicted_winner == self.actual_winner

    def __repr__(self):
        return f'<WC2026Fixture #{self.match_number} {self.team_a_name} vs {self.team_b_name}>'