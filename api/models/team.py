from api.extensions import db


class Team(db.Model):
    __tablename__ = 'teams'

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False, unique=True)
    country = db.Column(db.String(100), nullable=False)
    confederation = db.Column(db.String(10), nullable=False)   # UEFA, CONMEBOL, etc.
    fifa_ranking = db.Column(db.Integer)
    world_cups_played = db.Column(db.Integer, default=0)

    # Relationships
    players = db.relationship('Player', back_populates='team',
                              cascade='all, delete-orphan', lazy='select')
    home_matches = db.relationship(
        'Match',
        foreign_keys='Match.team_a_id',
        back_populates='team_a',
        lazy='dynamic'
    )

    away_matches = db.relationship(
        'Match',
        foreign_keys='Match.team_b_id',
        back_populates='team_b',
        lazy='dynamic'
    )

    def total_matches(self):
        return self.home_matches.count() + self.away_matches.count()

    def win_count(self):
        home_w = self.home_matches.filter_by(winner=self.name).count()
        away_w = self.away_matches.filter_by(winner=self.name).count()
        return home_w + away_w

    def win_percentage(self):
        total = self.total_matches()
        if total == 0:
            return 0.0
        return round((self.win_count() / total) * 100, 2)

    def __repr__(self):
        return f'<Team {self.name} ({self.confederation})>'