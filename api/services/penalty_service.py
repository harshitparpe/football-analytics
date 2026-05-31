"""
api/services/penalty_service.py
--------------------------------
Penalty shootout simulation using an OOP class hierarchy.

Design principles used (name these in interviews):
  - Single Responsibility: Shooter handles shot logic, Keeper handles save logic,
    PenaltyEngine orchestrates — none does the other's job.
  - Open/Closed: add new shot types or pressure modifiers by extending,
    not modifying existing classes.
  - Immutable result: PenaltyOutcome is a dataclass — no state mutation after creation.

Probability model:
  base_score_prob  = shooter.penalty_skill
  base_save_prob   = keeper.save_skill * KEEPER_REACH_FACTOR[direction_match]
  outcome_prob     = base_score_prob * (1 - adjusted_save_prob)
  + pressure and style modifiers applied on top
"""

import random
from dataclasses import dataclass, field
from enum import Enum
from typing import Optional


# ── Enums ─────────────────────────────────────────────────────────────────────

class ShotDirection(Enum):
    LEFT   = 'left'
    CENTER = 'center'
    RIGHT  = 'right'

class ShotHeight(Enum):
    LOW  = 'low'
    HIGH = 'high'

class DiveTendency(Enum):
    """Keeper's preferred dive direction — affects reach probability."""
    LEFT   = 'left'
    CENTER = 'center'
    RIGHT  = 'right'


# ── Data classes ──────────────────────────────────────────────────────────────

@dataclass(frozen=True)
class PenaltyOutcome:
    """
    Immutable result of a single penalty attempt.
    frozen=True means no attribute can be changed after creation —
    results are facts, not mutable state.
    """
    scored:          bool
    shot_direction:  str
    shot_height:     str
    keeper_dived:    str
    score_prob:      float   # probability shooter scored (for UI display)
    save_prob:       float   # probability keeper saved
    reason:          str     # human-readable explanation for UI
    shooter_name:    str
    keeper_name:     str
    shooter_skill:   float
    keeper_skill:    float


# ── Shooter class ─────────────────────────────────────────────────────────────

class Shooter:
    """
    Models a penalty taker.
    penalty_skill (0.0–1.0): derived from historical goals/appearances.
    style: 'power' favours corners, 'technical' favours placement accuracy.
    """

    STYLE_OPTIONS = ['power', 'technical', 'composure']

    def __init__(self, player_id: int, name: str,
                 penalty_skill: float, style: Optional[str] = None):
        self.player_id     = player_id
        self.name          = name
        self.penalty_skill = max(0.1, min(0.99, penalty_skill))
        self.style         = style or random.choice(self.STYLE_OPTIONS)

    def choose_direction(self) -> ShotDirection:
        """
        Shooter picks a direction weighted by skill and style.
        High-skill shooters go to corners more often (harder for keeper).
        """
        if self.style == 'power':
            # Power shooters go left/right more, rarely center
            weights = [0.45, 0.10, 0.45]
        elif self.style == 'technical':
            # Technical shooters spread evenly
            weights = [0.38, 0.24, 0.38]
        else:
            # Composure style — slightly favour their stronger side
            weights = [0.42, 0.16, 0.42]

        return random.choices(
            [ShotDirection.LEFT, ShotDirection.CENTER, ShotDirection.RIGHT],
            weights=weights
        )[0]

    def choose_height(self) -> ShotHeight:
        """High shots are harder to save but risk going over the bar."""
        # Skilled shooters go high more confidently
        high_prob = 0.3 + (self.penalty_skill * 0.25)
        return ShotHeight.HIGH if random.random() < high_prob else ShotHeight.LOW

    def score_probability(self, direction: ShotDirection,
                          height: ShotHeight) -> float:
        """
        Base probability of scoring given shot placement.
        High + corner = hardest to save → higher base prob.
        """
        base = self.penalty_skill

        # Corner bonus
        if direction in (ShotDirection.LEFT, ShotDirection.RIGHT):
            base *= 1.08
        # Height bonus
        if height == ShotHeight.HIGH:
            base *= 1.05

        # Slight random pressure effect (±5%)
        pressure = random.uniform(-0.05, 0.05)
        return max(0.05, min(0.97, base + pressure))


# ── Keeper class ──────────────────────────────────────────────────────────────

class Keeper:
    """
    Models a goalkeeper.
    save_skill (0.0–1.0): derived from appearances in ETL.
    dive_tendency: keeper's preferred dive direction — if they guess right,
    save probability increases significantly.
    """

    def __init__(self, player_id: int, name: str,
                 save_skill: float, dive_tendency: Optional[str] = None):
        self.player_id     = player_id
        self.name          = name
        self.save_skill    = max(0.1, min(0.99, save_skill))
        self.dive_tendency = DiveTendency(
            dive_tendency or random.choice(['left', 'center', 'right'])
        )

    def choose_dive(self) -> ShotDirection:
        """
        Keeper commits to a direction before the shot.
        Weighted toward their tendency but with uncertainty.
        """
        tendency_map = {
            DiveTendency.LEFT:   [0.55, 0.10, 0.35],
            DiveTendency.CENTER: [0.25, 0.50, 0.25],
            DiveTendency.RIGHT:  [0.35, 0.10, 0.55],
        }
        weights = tendency_map[self.dive_tendency]
        return random.choices(
            [ShotDirection.LEFT, ShotDirection.CENTER, ShotDirection.RIGHT],
            weights=weights
        )[0]

    def save_probability(self, shot_dir: ShotDirection,
                         shot_height: ShotHeight,
                         dive_dir: ShotDirection) -> float:
        """
        Save probability depends on:
          - Base save_skill
          - Whether keeper guessed the direction correctly
          - Shot height (high shots harder to reach)
        """
        base = self.save_skill * 0.35   # keepers save ~35% even with skill

        direction_match = (shot_dir == dive_dir)

        if direction_match:
            # Correct guess — big boost
            base *= 2.8
        else:
            # Wrong direction — keeper can only save if shot is central
            if shot_dir == ShotDirection.CENTER:
                base *= 1.4
            else:
                base *= 0.4   # dived wrong way, very hard to save

        # High shots are harder to reach
        if shot_height == ShotHeight.HIGH:
            base *= 0.75

        # Noise — penalty taking is never fully deterministic
        noise = random.uniform(-0.04, 0.04)
        return max(0.01, min(0.92, base + noise))


# ── PenaltyEngine ─────────────────────────────────────────────────────────────

class PenaltyEngine:
    """
    Orchestrates a single penalty kick.
    Takes a Shooter and a Keeper, simulates the attempt,
    returns an immutable PenaltyOutcome.

    This class has no state after simulate() returns —
    call it again for a new independent attempt.
    """

    # Reason templates for UI display
    _GOAL_REASONS = [
        "{shooter} places it perfectly — {keeper} dives the wrong way.",
        "{shooter} drills it into the {direction} corner. No chance for {keeper}.",
        "{shooter} goes {height} and {keeper} can't get there in time.",
        "Unstoppable from {shooter}. {keeper} guesses right but can't reach it.",
        "{shooter} sends {keeper} the wrong way. Clinical finish.",
    ]
    _SAVE_REASONS = [
        "{keeper} dives {direction} and makes a stunning save!",
        "{keeper} reads {shooter}'s run-up perfectly. Brilliant stop.",
        "{shooter} hits it straight at {keeper}. Easy save.",
        "{keeper} gets fingertips to it — just enough to turn it away!",
        "What a save by {keeper}! {shooter} can't believe it.",
    ]
    _MISS_REASONS = [
        "{shooter} blazes it over the bar! Huge miss.",
        "{shooter} hits the post — agonising!",
        "{shooter} scuffs the shot. {keeper} barely had to move.",
        "Nerves get to {shooter}. The ball goes wide.",
    ]

    def __init__(self, shooter: Shooter, keeper: Keeper):
        self.shooter = shooter
        self.keeper  = keeper

    def simulate(self) -> PenaltyOutcome:
        """
        Core simulation method.
        Steps:
          1. Shooter picks direction + height
          2. Keeper commits to a dive direction (simultaneously, no info sharing)
          3. Compute score_prob and save_prob independently
          4. Determine outcome: score, save, or miss
          5. Return immutable PenaltyOutcome
        """
        # Step 1 — shooter decides
        shot_dir    = self.shooter.choose_direction()
        shot_height = self.shooter.choose_height()
        score_prob  = self.shooter.score_probability(shot_dir, shot_height)

        # Step 2 — keeper commits (simultaneously)
        dive_dir  = self.keeper.choose_dive()
        save_prob = self.keeper.save_probability(shot_dir, shot_height, dive_dir)

        # Step 3 — determine outcome
        scored = False
        reason = ''

        roll = random.random()

        if roll > score_prob:
            # Miss (shooter error, independent of keeper)
            scored = False
            reason = random.choice(self._MISS_REASONS).format(
                shooter=self.shooter.name,
                keeper=self.keeper.name,
            )
        elif random.random() < save_prob:
            # Save
            scored = False
            reason = random.choice(self._SAVE_REASONS).format(
                keeper=self.keeper.name,
                shooter=self.shooter.name,
                direction=dive_dir.value,
            )
        else:
            # Goal
            scored = True
            reason = random.choice(self._GOAL_REASONS).format(
                shooter=self.shooter.name,
                keeper=self.keeper.name,
                direction=shot_dir.value,
                height=shot_height.value,
            )

        return PenaltyOutcome(
            scored         = scored,
            shot_direction = shot_dir.value,
            shot_height    = shot_height.value,
            keeper_dived   = dive_dir.value,
            score_prob     = round(score_prob, 3),
            save_prob      = round(save_prob, 3),
            reason         = reason,
            shooter_name   = self.shooter.name,
            keeper_name    = self.keeper.name,
            shooter_skill  = self.shooter.penalty_skill,
            keeper_skill   = self.keeper.save_skill,
        )

    def simulate_shootout(self, n_kicks: int = 5) -> dict:
        """
        Simulate a full shootout sequence (n_kicks per side not implemented —
        this simulates n_kicks for one team, useful for testing distributions).
        Returns aggregate stats.
        """
        results  = [self.simulate() for _ in range(n_kicks)]
        scored   = sum(1 for r in results if r.scored)
        return {
            'kicks':     n_kicks,
            'scored':    scored,
            'missed':    n_kicks - scored,
            'score_rate':round(scored / n_kicks, 3),
            'kicks_detail': [
                {
                    'kick_number':   i + 1,
                    'scored':        r.scored,
                    'shot_direction':r.shot_direction,
                    'shot_height':   r.shot_height,
                    'keeper_dived':  r.keeper_dived,
                    'reason':        r.reason,
                }
                for i, r in enumerate(results)
            ]
        }