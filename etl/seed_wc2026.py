"""
etl/seed_wc2026.py
--------------------
Seeds a generic 48-team WC2026 template: 12 groups of 4 (A-L), 6 matches
per group = 72 group-stage matches, plus a 32-team knockout bracket
(Round of 32 -> Round of 16 -> QF -> SF -> Third place -> Final) = 32 matches.
Total: 104 fixtures.

GROUP TEAMS BELOW ARE PLACEHOLDERS. Edit GROUPS dict once the official
December 2025 draw is announced, then re-run this script (it wipes and
re-seeds wc2026_fixtures only — does not touch historical data).

Run: python -m etl.seed_wc2026
"""

import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from api import create_app
from api.extensions import db
from api.models import WC2026Fixture, Team
from api.services.prediction_service import PredictionService

GROUPS = {
    'A': ['Mexico', 'South Africa', 'South Korea', 'Czech Republic'],
    'B': ['Canada', 'Bosnia and Herzegovina', 'Qatar', 'Switzerland'],
    'C': ['Brazil', 'Morocco', 'Haiti', 'Scotland'],
    'D': ['United States', 'Paraguay', 'Australia', 'Turkey'],
    'E': ['Germany', 'Curacao', "Ivory Coast", 'Ecuador'],
    'F': ['Netherlands', 'Japan', 'Sweden', 'Tunisia'],
    'G': ['Belgium', 'Egypt', 'IR Iran', 'New Zealand'],
    'H': ['Spain', 'Cabo Verde', 'Saudi Arabia', 'Uruguay'],
    'I': ['France', 'Senegal', 'Iraq', 'Norway'],
    'J': ['Argentina', 'Algeria', 'Austria', 'Jordan'],
    'K': ['Portugal', 'Congo DR', 'Uzbekistan', 'Colombia'],
    'L': ['England', 'Croatia', 'Ghana', 'Panama'],
}
# ──────────────────────────────────────────────────────────────────────────────


def group_round_robin(teams):
    """Return all 6 unique pairings for a group of 4 teams."""
    pairs = []
    for i in range(len(teams)):
        for j in range(i + 1, len(teams)):
            pairs.append((teams[i], teams[j]))
    return pairs


def seed_group_stage(team_map, predictor):
    """Create 72 group-stage fixtures (12 groups x 6 matches)."""
    match_num = 1
    count = 0

    for group_letter, teams in GROUPS.items():
        for team_a, team_b in group_round_robin(teams):
            fixture = WC2026Fixture(
                match_number = match_num,
                stage        = 'group',
                group_name   = group_letter,
                round_name   = f'Group {group_letter}',
                team_a_name  = team_a,
                team_b_name  = team_b,
                team_a_id    = team_map.get(team_a),
                team_b_id    = team_map.get(team_b),
            )

            # Auto-predict if both teams exist in historical data
            if team_a in team_map and team_b in team_map:
                try:
                    pred = predictor.predict_match(team_map[team_a], team_map[team_b])
                    fixture.pred_team_a_prob = pred['team_a']['win_prob']
                    fixture.pred_draw_prob   = pred['draw']['prob']
                    fixture.pred_team_b_prob = pred['team_b']['win_prob']
                    fixture.predicted_winner = pred['favourite']
                except Exception:
                    pass

            db.session.add(fixture)
            match_num += 1
            count += 1

    return count, match_num


def seed_knockout_stage(start_match_num):
    """
    Create 32 knockout fixtures: Round of 32 (16) -> Round of 16 (8)
    -> QF (4) -> SF (2) -> Third place (1) -> Final (1) = 32.

    Team slots are empty until group stage resolves — feeds_from_a/b
    point to earlier match_numbers whose winners populate these slots.
    This is a structural template; population logic runs when you mark
    group matches as played (see /api/wc2026/advance endpoint).
    """
    match_num = start_match_num
    count = 0

    # Round of 32 — 16 matches, fed by group standings (manual assignment later)
    ro32_start = match_num
    for i in range(16):
        db.session.add(WC2026Fixture(
            match_number=match_num,
            stage='round_of_32',
            round_name='Round of 32',
            team_a_name=f'TBD (R32-{i+1}A)',
            team_b_name=f'TBD (R32-{i+1}B)',
        ))
        match_num += 1
        count += 1

    # Round of 16 — 8 matches
    ro16_start = match_num
    for i in range(8):
        db.session.add(WC2026Fixture(
            match_number=match_num,
            stage='round_of_16',
            round_name='Round of 16',
            team_a_name=f'Winner R32-{2*i+1}',
            team_b_name=f'Winner R32-{2*i+2}',
            feeds_from_a=ro32_start + 2*i,
            feeds_from_b=ro32_start + 2*i + 1,
        ))
        match_num += 1
        count += 1

    # Quarterfinals — 4 matches
    qf_start = match_num
    for i in range(4):
        db.session.add(WC2026Fixture(
            match_number=match_num,
            stage='quarterfinal',
            round_name='Quarterfinal',
            team_a_name=f'Winner R16-{2*i+1}',
            team_b_name=f'Winner R16-{2*i+2}',
            feeds_from_a=ro16_start + 2*i,
            feeds_from_b=ro16_start + 2*i + 1,
        ))
        match_num += 1
        count += 1

    # Semifinals — 2 matches
    sf_start = match_num
    for i in range(2):
        db.session.add(WC2026Fixture(
            match_number=match_num,
            stage='semifinal',
            round_name='Semifinal',
            team_a_name=f'Winner QF-{2*i+1}',
            team_b_name=f'Winner QF-{2*i+2}',
            feeds_from_a=qf_start + 2*i,
            feeds_from_b=qf_start + 2*i + 1,
        ))
        match_num += 1
        count += 1

    # Third place
    db.session.add(WC2026Fixture(
        match_number=match_num,
        stage='third_place',
        round_name='Third Place',
        team_a_name='Loser SF-1',
        team_b_name='Loser SF-2',
        feeds_from_a=sf_start,
        feeds_from_b=sf_start + 1,
    ))
    match_num += 1
    count += 1

    # Final
    db.session.add(WC2026Fixture(
        match_number=match_num,
        stage='final',
        round_name='Final',
        team_a_name='Winner SF-1',
        team_b_name='Winner SF-2',
        feeds_from_a=sf_start,
        feeds_from_b=sf_start + 1,
    ))
    count += 1

    return count


def seed():
    print('\n[WC2026] Seeding fixture template...')

    # Wipe existing WC2026 data only
    WC2026Fixture.query.delete()
    db.session.commit()

    # Build team name -> id map
    team_map = {t.name: t.id for t in Team.query.all()}

    predictor = PredictionService

    group_count, next_num = seed_group_stage(team_map, predictor)
    knockout_count = seed_knockout_stage(next_num)

    db.session.commit()

    print(f'  \u2713 {group_count} group-stage fixtures (12 groups x 6 matches)')
    print(f'  \u2713 {knockout_count} knockout fixtures (R32 -> Final)')
    print(f'  \u2713 Total: {group_count + knockout_count} fixtures')
    print('\n[WC2026] \u26a0 Remember: GROUPS dict has placeholder team names.')
    print('[WC2026]   Edit etl/seed_wc2026.py after the Dec 2025 draw, then re-run.')


if __name__ == '__main__':
    app = create_app()
    with app.app_context():
        seed()