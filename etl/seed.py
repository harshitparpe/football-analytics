"""
etl/seed.py
-----------
ETL pipeline: Kaggle FIFA World Cup CSVs → PostgreSQL via SQLAlchemy ORM.

Run from project root:
    python -m etl.seed

Design decisions (know these for interviews):
- Uses ORM (not raw SQL INSERT) so relationships are enforced at the Python layer.
- Deduplicates teams by name before inserting — CSVs repeat team names across rows.
- Assigns synthetic penalty_skill / save_skill scores from real goal data so the
  penalty simulator has meaningful probabilities, not random noise.
- Wraps everything in a single db.session transaction; rolls back on any error.
"""

import sys
import os
import pandas as pd
import numpy as np

# Make sure project root is on the path when run as `python -m etl.seed`
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from api import create_app
from api.extensions import db
from api.models import Team, Player, Match, MatchStat, Prediction


# ─── helpers ────────────────────────────────────────────────────────────────

def clean_str(val):
    """Strip whitespace; return None for NaN/empty."""
    if pd.isna(val):
        return None
    return str(val).strip()


def safe_int(val):
    try:
        return int(float(val))
    except (ValueError, TypeError):
        return None


def safe_float(val):
    try:
        return float(val)
    except (ValueError, TypeError):
        return None


def determine_winner(row):
    """Return winner name, 'Draw', handling extra-time/penalty notes."""
    home = clean_str(row['Home Team Name'])
    away = clean_str(row['Away Team Name'])
    hg   = safe_int(row['Home Team Goals'])
    ag   = safe_int(row['Away Team Goals'])
    wc   = clean_str(row.get('Win conditions', ''))

    if hg is None or ag is None:
        return None

    # Penalty shootout result overrides scoreline
    if wc and 'penalties' in wc.lower():
        if home.lower() in wc.lower():
            return home
        if away.lower() in wc.lower():
            return away

    if hg > ag:
        return home
    if ag > hg:
        return away
    return 'Draw'


# ─── loaders ─────────────────────────────────────────────────────────────────

def load_teams(matches_df):
    """
    Extract unique team names from both Home and Away columns.
    Build a confederation lookup from a hardcoded map (dataset doesn't include it).
    Returns: dict[team_name → Team ORM object]
    """
    confederation_map = {
        # CONMEBOL
        'Brazil':'CONMEBOL','Argentina':'CONMEBOL','Uruguay':'CONMEBOL',
        'Colombia':'CONMEBOL','Chile':'CONMEBOL','Paraguay':'CONMEBOL',
        'Peru':'CONMEBOL','Ecuador':'CONMEBOL','Bolivia':'CONMEBOL',
        'Venezuela':'CONMEBOL',
        # UEFA
        'Germany':'UEFA','France':'UEFA','Spain':'UEFA','Italy':'UEFA',
        'England':'UEFA','Netherlands':'UEFA','Portugal':'UEFA',
        'Belgium':'UEFA','Croatia':'UEFA','Sweden':'UEFA','Denmark':'UEFA',
        'Switzerland':'UEFA','Poland':'UEFA','Russia':'UEFA','Hungary':'UEFA',
        'Czechoslovakia':'UEFA','Yugoslavia':'UEFA','Romania':'UEFA',
        'Austria':'UEFA','Turkey':'UEFA','Greece':'UEFA','Czech Republic':'UEFA',
        'Serbia':'UEFA','Ukraine':'UEFA','Slovakia':'UEFA','Slovenia':'UEFA',
        'Wales':'UEFA','Scotland':'UEFA','Northern Ireland':'UEFA',
        'Republic of Ireland':'UEFA','Bosnia and Herzegovina':'UEFA',
        'Albania':'UEFA','Iceland':'UEFA','Norway':'UEFA','Finland':'UEFA',
        # CONCACAF
        'USA':'CONCACAF','Mexico':'CONCACAF','Costa Rica':'CONCACAF',
        'Honduras':'CONCACAF','Jamaica':'CONCACAF','Trinidad and Tobago':'CONCACAF',
        'Cuba':'CONCACAF','El Salvador':'CONCACAF','Haiti':'CONCACAF',
        'Canada':'CONCACAF',
        # CAF
        'Senegal':'CAF','Ghana':'CAF','Nigeria':'CAF','Cameroon':'CAF',
        'Ivory Coast':'CAF','Morocco':'CAF','Tunisia':'CAF','Egypt':'CAF',
        'South Africa':'CAF','Algeria':'CAF','Togo':'CAF','Angola':'CAF',
        'Zaire':'CAF',
        # AFC
        'Japan':'AFC','South Korea':'AFC','Australia':'AFC','Iran':'AFC',
        'Saudi Arabia':'AFC','China PR':'AFC','North Korea':'AFC',
        'Iraq':'AFC','Kuwait':'AFC','UAE':'AFC','Indonesia':'AFC',
        'East Germany':'UEFA',  # historical
        'West Germany':'UEFA',
        'Soviet Union':'UEFA',
        'rn">Republic of Ireland':'UEFA',
        'Dutch East Indies':'AFC',
    }

    home_teams = matches_df['Home Team Name'].dropna().str.strip().unique()
    away_teams = matches_df['Away Team Name'].dropna().str.strip().unique()
    all_names  = set(home_teams) | set(away_teams)

    team_map = {}
    for name in sorted(all_names):
        if not name:
            continue
        conf = confederation_map.get(name, 'OTHER')
        t = Team(
            name=name,
            country=name,
            confederation=conf,
            fifa_ranking=None,       # not in dataset; fine for our purposes
            world_cups_played=0      # we'll increment below
        )
        db.session.add(t)
        team_map[name] = t

    db.session.flush()   # assign IDs without committing

    # Count world cup appearances per team
    for name, t in team_map.items():
        home_years = matches_df[matches_df['Home Team Name'].str.strip() == name]['Year'].unique()
        away_years = matches_df[matches_df['Away Team Name'].str.strip() == name]['Year'].unique()
        t.world_cups_played = len(set(home_years) | set(away_years))

    print(f'  ✓ {len(team_map)} teams loaded')
    return team_map


def load_matches(matches_df, team_map):
    """
    Insert one Match row per row in WorldCupMatches.csv.
    Returns: dict[(home_name, away_name, year) → Match ORM object]
    """
    match_map = {}
    skipped   = 0

    for _, row in matches_df.iterrows():
        home = clean_str(row['Home Team Name'])
        away = clean_str(row['Away Team Name'])
        year = safe_int(row['Year'])

        if not home or not away or not year:
            skipped += 1
            continue
        if home not in team_map or away not in team_map:
            skipped += 1
            continue

        winner = determine_winner(row)
        stage  = clean_str(row.get('Stage', 'Unknown'))

        m = Match(
            team_a_id  = team_map[home].id,
            team_b_id  = team_map[away].id,
            stage      = stage,
            group_name = clean_str(row.get('Group', None)),
            venue      = clean_str(row.get('Stadium', None)),
            score_a    = safe_int(row['Home Team Goals']),
            score_b    = safe_int(row['Away Team Goals']),
            winner     = winner,
            year       = year,
        )
        db.session.add(m)
        match_map[(home, away, year)] = m

    db.session.flush()
    print(f'  ✓ {len(match_map)} matches loaded  ({skipped} skipped)')
    return match_map


def load_players_and_stats(players_df, matches_df, team_map, match_map):
    """
    Build Player rows from WorldCupPlayers.csv.
    Synthetic penalty_skill derived from goal count.
    Synthetic save_skill for GKs derived from appearances.
    Also creates MatchStat rows with xG proxy = shots_on_target * 0.33.
    """

    # ── players ──────────────────────────────────────────────────────────────
    # Group by player name + team to aggregate goals and appearances
    player_key_map = {}   # (name, team_name) → Player ORM obj

    # Build initials → full name lookup from matches_df
    initials_lookup = {}
    for _, row in matches_df.iterrows():
        home = clean_str(row.get('Home Team Name'))
        away = clean_str(row.get('Away Team Name'))
        hi   = clean_str(row.get('Home Team Initials'))
        ai   = clean_str(row.get('Away Team Initials'))
        if home and hi:
            initials_lookup[hi] = home
        if away and ai:
            initials_lookup[ai] = away

    position_map = {'GK': 'GK', 'C': 'DEF', 'D': 'DEF',
                    'MF': 'MID', 'M': 'MID', 'FW': 'FWD',
                    'F': 'FWD', 'A': 'FWD', 'T': 'FWD'}

    players_df = players_df.dropna(subset=['Player Name'])

    for _, row in players_df.iterrows():
        initials = clean_str(row.get('Team Initials'))
        team_name = initials_lookup.get(initials)
        if not team_name or team_name not in team_map:
            continue

        p_name = clean_str(row['Player Name'])
        raw_pos = clean_str(row.get('Position', 'MID'))
        position = position_map.get(raw_pos, 'MID')

        key = (p_name, team_name)
        if key not in player_key_map:
            p = Player(
                team_id      = team_map[team_name].id,
                name         = p_name,
                position     = position,
                age          = None,
                goals        = 0,
                appearances  = 0,
                penalty_skill= 0.5,
                save_skill   = 0.5,
            )
            db.session.add(p)
            player_key_map[key] = p

        player_key_map[key].appearances += 1

        # Count goals from Event column: G = goal, G40 = goal 40th min, etc.
        event = clean_str(row.get('Event', ''))
        if event:
            goal_count = event.count('G') - event.count('GK') - event.count('OG')
            player_key_map[key].goals += max(goal_count, 0)

    db.session.flush()

    # Derive skill scores from real data
    for (name, team_name), p in player_key_map.items():
        if p.position == 'GK':
            # Keepers who played more have higher save_skill (proxy for reliability)
            p.save_skill = round(min(0.95, 0.45 + (p.appearances * 0.03)), 2)
            p.penalty_skill = 0.35   # GKs rarely take penalties
        else:
            # Strikers/midfielders with more goals have higher penalty_skill
            goals_ratio = p.goals / max(p.appearances, 1)
            p.penalty_skill = round(min(0.92, 0.45 + (goals_ratio * 1.5)), 2)

    print(f'  ✓ {len(player_key_map)} unique players loaded')

    # ── match stats ───────────────────────────────────────────────────────────
    # The Kaggle dataset doesn't include possession/shots per match,
    # so we generate realistic synthetic stats seeded by match result.
    # This is fine for a portfolio project — you'd note it in the README.
    stat_count = 0
    rng = np.random.default_rng(seed=42)   # deterministic seed = reproducible

    for (home, away, year), match in match_map.items():
        for team_name, is_home in [(home, True), (away, False)]:
            if team_name not in team_map:
                continue

            won  = (match.winner == team_name)
            draw = (match.winner == 'Draw')

            # Teams that win tend to have slightly more shots and possession
            base_possession = 52.0 if won else (50.0 if draw else 47.0)
            possession = float(np.clip(rng.normal(base_possession, 6), 30, 70))

            shots = int(np.clip(rng.normal(13 if won else 10, 4), 2, 28))
            sot   = int(np.clip(rng.normal(shots * 0.45, 2), 0, shots))
            xg    = round(float(sot * 0.33 + rng.normal(0, 0.3)), 2)

            stat = MatchStat(
                match_id       = match.id,
                team_id        = team_map[team_name].id,
                possession_pct = round(possession, 1),
                shots          = shots,
                shots_on_target= sot,
                xg             = max(xg, 0.0),
                corners        = int(np.clip(rng.normal(5, 2), 0, 14)),
                fouls          = int(np.clip(rng.normal(14, 4), 3, 30)),
            )
            db.session.add(stat)
            stat_count += 1

    print(f'  ✓ {stat_count} match stat rows generated')


# ─── main ────────────────────────────────────────────────────────────────────

def seed():
    print('\n[ETL] Loading CSVs...')
    matches_df = pd.read_csv('data/WorldCupMatches.csv', encoding='utf-8')
    players_df = pd.read_csv('data/WorldCupPlayers.csv', encoding='utf-8')

    # Normalize column whitespace (Kaggle CSVs sometimes have trailing spaces)
    matches_df.columns = matches_df.columns.str.strip()
    players_df.columns = players_df.columns.str.strip()
    matches_df = matches_df.dropna(how='all')

    print('[ETL] Seeding database...')
    try:
        # load_teams(matches_df)
        # match_map = load_matches(matches_df,
        #                          Team.query.with_entities(Team.name, Team.id)
        #                          .all())

        # # Rebuild team_map from DB after flush so IDs are available
        # team_map = {t.name: t for t in Team.query.all()}

        team_map = load_teams(matches_df)

        match_map = load_matches(matches_df, team_map)
        match_map_rebuilt = {
            (m.team_a.name, m.team_b.name, m.year): m
            for m in Match.query.all()
        }

        load_players_and_stats(players_df, matches_df,
                               team_map, match_map_rebuilt)

        db.session.commit()
        print('\n[ETL] ✓ Seed complete.')
        _print_summary()

    except Exception as e:
        db.session.rollback()
        print(f'\n[ETL] ✗ Rolled back due to error: {e}')
        raise


def _print_summary():
    print('\n── Database summary ──────────────────────')
    print(f'  Teams:       {Team.query.count()}')
    print(f'  Players:     {Player.query.count()}')
    print(f'  Matches:     {Match.query.count()}')
    print(f'  Match stats: {MatchStat.query.count()}')
    print(f'  Predictions: {Prediction.query.count()}')
    print('──────────────────────────────────────────\n')


if __name__ == '__main__':
    app = create_app()
    with app.app_context():
        seed()