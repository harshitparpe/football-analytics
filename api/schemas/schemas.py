"""
api/schemas/schemas.py
-----------------------
Marshmallow schemas for serialization (ORM → JSON) and
deserialization/validation (JSON → Python dict).

Pattern used: one schema per model, with a nested variant for
embedded relationships (e.g. PlayerSchema inside TeamDetailSchema).
"""

from marshmallow import Schema, fields, validate, ValidationError


# ── Team ─────────────────────────────────────────────────────────────────────

class TeamSchema(Schema):
    """Lightweight — used in list endpoints and nested inside other schemas."""
    id            = fields.Int(dump_only=True)
    name          = fields.Str(required=True)
    country       = fields.Str(required=True)
    confederation = fields.Str(required=True)
    fifa_ranking  = fields.Int(allow_none=True)
    world_cups_played = fields.Int()


class TeamDetailSchema(TeamSchema):
    """Full detail — used in GET /teams/<id>. Embeds computed stats."""
    win_percentage = fields.Method('get_win_pct')
    total_matches  = fields.Method('get_total_matches')

    def get_win_pct(self, obj):
        return obj.win_percentage()

    def get_total_matches(self, obj):
        return obj.total_matches()


# ── Player ────────────────────────────────────────────────────────────────────

class PlayerSchema(Schema):
    id            = fields.Int(dump_only=True)
    team_id       = fields.Int(dump_only=True)
    name          = fields.Str(required=True)
    position      = fields.Str(validate=validate.OneOf(['GK','DEF','MID','FWD']))
    age           = fields.Int(allow_none=True)
    goals         = fields.Int()
    appearances   = fields.Int()
    penalty_skill = fields.Float()
    save_skill    = fields.Float()
    goals_per_game = fields.Float(dump_only=True)

    # Nested team name only (avoid full recursion)
    team_name     = fields.Method('get_team_name')

    def get_team_name(self, obj):
        return obj.team.name if obj.team else None


# ── Match ─────────────────────────────────────────────────────────────────────

class MatchSchema(Schema):
    id          = fields.Int(dump_only=True)
    team_a_id   = fields.Int()
    team_b_id   = fields.Int()
    team_a_name = fields.Method('get_team_a')
    team_b_name = fields.Method('get_team_b')
    stage       = fields.Str()
    group_name  = fields.Str(allow_none=True)
    venue       = fields.Str(allow_none=True)
    match_date  = fields.Date(allow_none=True)
    score_a     = fields.Int(allow_none=True)
    score_b     = fields.Int(allow_none=True)
    winner      = fields.Str(allow_none=True)
    year        = fields.Int()
    total_goals = fields.Int(dump_only=True, allow_none=True)

    def get_team_a(self, obj):
        return obj.team_a.name if obj.team_a else None

    def get_team_b(self, obj):
        return obj.team_b.name if obj.team_b else None


# ── MatchStat ─────────────────────────────────────────────────────────────────

class MatchStatSchema(Schema):
    id              = fields.Int(dump_only=True)
    match_id        = fields.Int()
    team_id         = fields.Int()
    possession_pct  = fields.Float()
    shots           = fields.Int()
    shots_on_target = fields.Int()
    xg              = fields.Float()
    corners         = fields.Int()
    fouls           = fields.Int()
    shot_accuracy   = fields.Float(dump_only=True)


# ── Prediction ────────────────────────────────────────────────────────────────

class PredictionSchema(Schema):
    id           = fields.Int(dump_only=True)
    match_id     = fields.Int(allow_none=True)
    prob_team_a  = fields.Float()
    prob_team_b  = fields.Float()
    prob_draw    = fields.Float()
    model_version = fields.Str()
    created_at   = fields.DateTime(dump_only=True)
    favourite    = fields.Str(dump_only=True)


# ── Request validation schemas ────────────────────────────────────────────────

class PredictRequestSchema(Schema):
    """Validates POST /api/predict body."""
    team_a_id = fields.Int(required=True)
    team_b_id = fields.Int(required=True)

    def validate_different_teams(self, data, **kwargs):
        if data.get('team_a_id') == data.get('team_b_id'):
            raise ValidationError('team_a_id and team_b_id must be different.')
        return data


class PenaltyRequestSchema(Schema):
    """Validates POST /api/penalty/simulate body."""
    shooter_id = fields.Int(required=True)
    keeper_id  = fields.Int(required=True)


# ── Instantiate for import convenience ───────────────────────────────────────

team_schema         = TeamSchema()
teams_schema        = TeamSchema(many=True)
team_detail_schema  = TeamDetailSchema()

player_schema       = PlayerSchema()
players_schema      = PlayerSchema(many=True)

match_schema        = MatchSchema()
matches_schema      = MatchSchema(many=True)

match_stat_schema   = MatchStatSchema()

prediction_schema   = PredictionSchema()

predict_req_schema  = PredictRequestSchema()
penalty_req_schema  = PenaltyRequestSchema()