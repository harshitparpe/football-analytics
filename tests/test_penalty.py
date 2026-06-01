"""
tests/test_penalty.py
---------------------
Tests for the OOP penalty shootout engine.
These are pure unit tests — no DB, no Flask app context needed.
"""

import pytest
from api.services.penalty_service import (
    Shooter, Keeper, PenaltyEngine, PenaltyOutcome,
    ShotDirection, ShotHeight, DiveTendency,
)


# ── Fixtures ──────────────────────────────────────────────────────────────────

@pytest.fixture
def elite_shooter():
    return Shooter(player_id=1, name='Test Striker',
                   penalty_skill=0.92, style='technical')

@pytest.fixture
def elite_keeper():
    return Keeper(player_id=2, name='Test Keeper',
                  save_skill=0.90, dive_tendency='center')

@pytest.fixture
def poor_shooter():
    return Shooter(player_id=3, name='Poor Shooter',
                   penalty_skill=0.10, style='power')

@pytest.fixture
def engine(elite_shooter, elite_keeper):
    return PenaltyEngine(elite_shooter, elite_keeper)


# ── Shooter tests ─────────────────────────────────────────────────────────────

def test_shooter_skill_clamped():
    """penalty_skill must be clamped to [0.1, 0.99]."""
    s_high = Shooter(1, 'A', penalty_skill=1.5)
    s_low  = Shooter(2, 'B', penalty_skill=-0.5)
    assert s_high.penalty_skill == 0.99
    assert s_low.penalty_skill  == 0.10


def test_shooter_direction_returns_valid_enum(elite_shooter):
    for _ in range(20):
        direction = elite_shooter.choose_direction()
        assert isinstance(direction, ShotDirection)
        assert direction in list(ShotDirection)


def test_score_probability_in_range(elite_shooter):
    """Score probability must always be between 0.05 and 0.97."""
    for direction in ShotDirection:
        for height in ShotHeight:
            prob = elite_shooter.score_probability(direction, height)
            assert 0.05 <= prob <= 0.97, (
                f"score_prob={prob} out of range for "
                f"dir={direction} height={height}"
            )


def test_poor_shooter_lower_prob_than_elite():
    """Elite shooter must have higher average score probability."""
    elite = Shooter(1, 'Elite', penalty_skill=0.92)
    poor  = Shooter(2, 'Poor',  penalty_skill=0.20)

    # Average over 50 samples to smooth randomness
    elite_probs = [
        elite.score_probability(ShotDirection.RIGHT, ShotHeight.LOW)
        for _ in range(50)
    ]
    poor_probs = [
        poor.score_probability(ShotDirection.RIGHT, ShotHeight.LOW)
        for _ in range(50)
    ]
    assert np.mean(elite_probs) > np.mean(poor_probs)


# ── Keeper tests ──────────────────────────────────────────────────────────────

def test_keeper_skill_clamped():
    k_high = Keeper(1, 'A', save_skill=2.0)
    k_low  = Keeper(2, 'B', save_skill=-1.0)
    assert k_high.save_skill == 0.99
    assert k_low.save_skill  == 0.10


def test_keeper_correct_guess_higher_save_prob(elite_keeper):
    """
    Save probability must be higher when keeper dives the correct direction.
    This validates the core mechanic of the penalty model.
    """
    correct_dir = ShotDirection.LEFT
    wrong_dir   = ShotDirection.RIGHT
    height      = ShotHeight.LOW

    save_correct = elite_keeper.save_probability(
        correct_dir, height, correct_dir   # shot and dive match
    )
    save_wrong = elite_keeper.save_probability(
        correct_dir, height, wrong_dir     # dives wrong way
    )
    assert save_correct > save_wrong, (
        f"Correct dive ({save_correct:.3f}) should beat wrong dive ({save_wrong:.3f})"
    )


# ── PenaltyOutcome tests ──────────────────────────────────────────────────────

def test_outcome_is_immutable(engine):
    """PenaltyOutcome is a frozen dataclass — must raise on attribute assignment."""
    outcome = engine.simulate()
    with pytest.raises(Exception):   # FrozenInstanceError
        outcome.scored = not outcome.scored


def test_outcome_has_required_fields(engine):
    outcome = engine.simulate()
    required = {'scored', 'shot_direction', 'shot_height', 'keeper_dived',
                'score_prob', 'save_prob', 'reason', 'shooter_name', 'keeper_name'}
    for field in required:
        assert hasattr(outcome, field), f"PenaltyOutcome missing field: {field}"


def test_outcome_directions_are_valid(engine):
    valid_dirs    = {d.value for d in ShotDirection}
    valid_heights = {h.value for h in ShotHeight}
    for _ in range(20):
        outcome = engine.simulate()
        assert outcome.shot_direction in valid_dirs
        assert outcome.shot_height    in valid_heights
        assert outcome.keeper_dived   in valid_dirs


def test_outcome_probabilities_in_range(engine):
    for _ in range(20):
        outcome = engine.simulate()
        assert 0.0 < outcome.score_prob <= 1.0
        assert 0.0 < outcome.save_prob  <= 1.0


# ── PenaltyEngine distribution test ──────────────────────────────────────────

def test_elite_shooter_scores_more_than_poor(elite_keeper):
    """
    Over 100 kicks, an elite shooter must score significantly more than a poor one.
    Probabilistic test — uses a generous threshold to avoid flakiness.
    """
    import random
    random.seed(42)   # deterministic for CI

    elite = Shooter(1, 'Elite', penalty_skill=0.92)
    poor  = Shooter(2, 'Poor',  penalty_skill=0.15)

    elite_goals = sum(
        PenaltyEngine(elite, elite_keeper).simulate().scored
        for _ in range(100)
    )
    poor_goals = sum(
        PenaltyEngine(poor, elite_keeper).simulate().scored
        for _ in range(100)
    )

    assert elite_goals > poor_goals, (
        f"Elite scored {elite_goals}, Poor scored {poor_goals} — "
        f"model not differentiating skill correctly"
    )


def test_shootout_returns_correct_kick_count(engine):
    for n in [3, 5, 10]:
        result = engine.simulate_shootout(n_kicks=n)
        assert result['kicks'] == n
        assert len(result['kicks_detail']) == n
        assert result['scored'] + result['missed'] == n


# missing import needed for test_poor_shooter_lower_prob_than_elite
import numpy as np