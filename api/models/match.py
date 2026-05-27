from api.extensions import db
from datetime import date


class Match(db.Model):
    __tablename__ = 'matches'

    id = db.Column(db.Integer, primary_key=True)
    team_a_id = db.Column(db.Integer, db.ForeignKey('teams.id'), nullable=False)
    team_b_id = db.Column(db.Integer, db.ForeignKey('teams.id'), nullable=False)
    stage = db.Column(db.String(50))          # Group Stage, QF, SF, Final, etc.
    group_name = db.Column(db.String(5))      # A, B, C … only for group stage
    venue = db.Column(db.String(150))
    match_date = db.Column(db.Date)
    score_a = db.Column(db.Integer)           # None = match not yet played
    score_b = db.Column(db.Integer)
    winner = db.Column(db.String(100))        # team name or 'Draw'
    year = db.Column(db.Integer)              # World Cup year (1930–2022)

    # Relationships
    team_a = db.relationship(
        'Team',
        foreign_keys=[team_a_id],
        back_populates='home_matches'
    )

    team_b = db.relationship(
        'Team',
        foreign_keys=[team_b_id],
        back_populates='away_matches'
    )

    stats = db.relationship(
        'MatchStat',
        back_populates='match',
        cascade='all, delete-orphan'
    )

    prediction = db.relationship(
        'Prediction',
        back_populates='match',
        uselist=False
    )

    @property
    def total_goals(self):
        if self.score_a is None or self.score_b is None:
            return None
        return self.score_a + self.score_b

    @property
    def was_draw(self):
        return self.winner == 'Draw'

    def __repr__(self):
        return (f'<Match {self.team_a_id} vs {self.team_b_id} '
                f'| {self.score_a}-{self.score_b} | {self.year}>')