from api.extensions import db
from datetime import datetime, timezone


class Prediction(db.Model):
    __tablename__ = 'predictions'

    id = db.Column(db.Integer, primary_key=True)
    match_id = db.Column(db.Integer, db.ForeignKey('matches.id'),
                         nullable=True, unique=False)    # ← nullable, not unique
    prob_team_a = db.Column(db.Float, nullable=False)
    prob_team_b = db.Column(db.Float, nullable=False)
    prob_draw = db.Column(db.Float, nullable=False)
    model_version = db.Column(db.String(20), default='v1.0')
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    # Relationship
    match = db.relationship('Match', back_populates='prediction')

    @property
    def favourite(self):
        probs = {
            'team_a': self.prob_team_a,
            'draw':   self.prob_draw,
            'team_b': self.prob_team_b,
        }
        return max(probs, key=probs.get)

    def __repr__(self):
        return (f'<Prediction match={self.match_id} '
                f'A={self.prob_team_a:.2f} B={self.prob_team_b:.2f}>')