from api.extensions import db


class MatchStat(db.Model):
    __tablename__ = 'match_stats'

    id = db.Column(db.Integer, primary_key=True)

    match_id = db.Column(
        db.Integer,
        db.ForeignKey('matches.id'),
        nullable=False
    )

    team_id = db.Column(
        db.Integer,
        db.ForeignKey('teams.id'),
        nullable=False
    )

    possession_pct = db.Column(db.Float)
    shots = db.Column(db.Integer, default=0)
    shots_on_target = db.Column(db.Integer, default=0)
    xg = db.Column(db.Float, default=0.0)
    corners = db.Column(db.Integer, default=0)
    fouls = db.Column(db.Integer, default=0)

    # Relationships
    match = db.relationship(
        'Match',
        back_populates='stats'
    )

    team = db.relationship('Team')

    @property
    def shot_accuracy(self):
        if self.shots == 0:
            return 0.0
        return round((self.shots_on_target / self.shots) * 100, 2)

    def __repr__(self):
        return f'<MatchStat match={self.match_id} team={self.team_id}>'