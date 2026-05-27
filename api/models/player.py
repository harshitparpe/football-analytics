from api.extensions import db


class Player(db.Model):
    __tablename__ = 'players'

    id = db.Column(db.Integer, primary_key=True)
    team_id = db.Column(db.Integer, db.ForeignKey('teams.id'), nullable=False)
    name = db.Column(db.String(150), nullable=False)
    position = db.Column(db.String(30), nullable=False)   # GK, DEF, MID, FWD
    age = db.Column(db.Integer)
    goals = db.Column(db.Integer, default=0)
    appearances = db.Column(db.Integer, default=0)

    # Penalty simulator attributes (0.0 – 1.0 float scores)
    penalty_skill = db.Column(db.Float, default=0.5)      # shooter accuracy
    save_skill = db.Column(db.Float, default=0.5)         # keeper save probability

    # Relationship
    team = db.relationship('Team', back_populates='players')

    @property
    def goals_per_game(self):
        if self.appearances == 0:
            return 0.0
        return round(self.goals / self.appearances, 2)

    def __repr__(self):
        return f'<Player {self.name} | {self.position} | {self.team_id}>'