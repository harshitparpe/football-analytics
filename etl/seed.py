"""
etl/seed.py
-----------
ETL pipeline v2: wcmatches.csv (1930-2018, clean schema) + WorldCupMatches2022.csv
(2022, hand-compiled) -> PostgreSQL via SQLAlchemy ORM.

Run from project root:
    python -m etl.seed

Why wcmatches.csv replaces WorldCupMatches.csv as primary source:
- Clean team names (no quote-character bug, no 'rn">' HTML artifacts)
- Consistent naming (United States, South Korea, Iran) vs old codes (USA, Korea Republic, IR Iran)
- Clean draw handling: outcome='D' with winning_team=NaN, no string parsing of 'Win conditions'
- Includes 2018 data already

WorldCupPlayers.csv still uses OLD initials (FRA, USA, IR Iran-style codes) because it's
keyed to the old MatchID/RoundID system. We build an initials -> old_name -> new_name
translation table using WorldCupMatches.csv (old file, kept only for this mapping).
"""

import sys
import os
import pandas as pd
import numpy as np

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from api import create_app
from api.extensions import db
from api.models import Team, Player, Match, MatchStat, Prediction


# ─── helpers ────────────────────────────────────────────────────────────────

def clean_str(val):
    """Strip whitespace and quote characters; fix legacy HTML artifacts."""
    if pd.isna(val):
        return None
    s = str(val).strip().strip("'\"")
    if s.startswith('rn">'):
        s = s[4:]
    return s if s else None


def safe_int(val):
    try:
        if pd.isna(val):
            return None
        return int(float(val))
    except (ValueError, TypeError):
        return None


def safe_float(val):
    try:
        if pd.isna(val):
            return None
        return float(val)
    except (ValueError, TypeError):
        return None


# Manual translation: old WorldCupPlayers.csv team names -> wcmatches.csv team names
OLD_TO_NEW_NAME = {
    'USA':                    'United States',
    'Korea Republic':         'South Korea',
    'Korea DPR':              'North Korea',
    'IR Iran':                'Iran',
    'Germany FR':             'West Germany',
    'German DR':              'East Germany',
    "C\u00f4te d'Ivoire":     'Ivory Coast',
    # Historical entities not present in wcmatches.csv (1938/2006 squads only) —
    # players from these squads are skipped during seeding.
    'Dutch East Indies':      None,
    'Serbia and Montenegro':  None,
}


# ─── loaders ─────────────────────────────────────────────────────────────────

def load_2022_players(team_map):
    """
    Load notable 2022 World Cup players from a curated CSV.
    WorldCupPlayers.csv (the main player dataset) has no 2022 data —
    this fills that gap for the penalty simulator's shooter/keeper pools.
    """
    path = 'data/WorldCupPlayers2022.csv'
    if not os.path.exists(path):
        print('  \u26a0 WorldCupPlayers2022.csv not found \u2014 skipping 2022 players')
        return 0

    df = pd.read_csv(path, encoding='utf-8')
    count = 0

    for _, row in df.iterrows():
        team_name = clean_str(row['team_name'])
        if team_name not in team_map:
            continue

        p = Player(
            team_id      = team_map[team_name].id,
            name         = clean_str(row['player_name']),
            position     = clean_str(row['position']),
            age          = None,
            goals        = safe_int(row['goals']) or 0,
            appearances  = safe_int(row['appearances']) or 0,
            penalty_skill= 0.5,
            save_skill   = 0.5,
        )
        db.session.add(p)
        count += 1

    db.session.flush()

    # Derive skill scores the same way as load_players_and_stats
    new_players = Player.query.filter(
        Player.id > (Player.query.order_by(Player.id.desc()).offset(count).first().id
                     if count else 0)
    ).all()

    for p in new_players:
        if p.position == 'GK':
            p.save_skill = round(min(0.95, 0.45 + (p.appearances * 0.03)), 2)
            p.penalty_skill = 0.35
        else:
            goals_ratio = p.goals / max(p.appearances, 1)
            p.penalty_skill = round(min(0.92, 0.45 + (goals_ratio * 1.5)), 2)

    print(f'  \u2713 {count} World Cup 2022 players loaded')
    return count

def build_initials_to_newname_map():
    """
    WorldCupPlayers.csv uses 'Team Initials' (e.g. FRA, USA, IRN) that were
    assigned in the OLD WorldCupMatches.csv. We build:
        initials -> old_name -> new_name (matching wcmatches.csv)
    Returns dict[initials] = new_name (or None if no longer represented).
    """
    old_matches = pd.read_csv('data/WorldCupMatches.csv', encoding='utf-8')
    old_matches.columns = old_matches.columns.str.strip()

    init_to_old = {}
    for _, row in old_matches.iterrows():
        h_init = clean_str(row.get('Home Team Initials'))
        a_init = clean_str(row.get('Away Team Initials'))
        h_name = clean_str(row.get('Home Team Name'))
        a_name = clean_str(row.get('Away Team Name'))
        if h_init and h_name and h_init not in init_to_old:
            init_to_old[h_init] = h_name
        if a_init and a_name and a_init not in init_to_old:
            init_to_old[a_init] = a_name

    init_to_new = {}
    for initials, old_name in init_to_old.items():
        new_name = OLD_TO_NEW_NAME.get(old_name, old_name)  # default: name unchanged
        init_to_new[initials] = new_name  # may be None for retired entities

    return init_to_new


def load_teams(matches_df):
    """
    Build Team rows from unique home/away team names in wcmatches.csv + 2022 CSV.
    Confederation assigned via hardcoded map (not in dataset).
    Returns: dict[team_name -> Team ORM object]
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
        'West Germany':'UEFA','East Germany':'UEFA','Soviet Union':'UEFA',
        'FR Yugoslavia':'UEFA','Israel':'UEFA',
        # CONCACAF
        'United States':'CONCACAF','Mexico':'CONCACAF','Costa Rica':'CONCACAF',
        'Honduras':'CONCACAF','Jamaica':'CONCACAF','Trinidad and Tobago':'CONCACAF',
        'Cuba':'CONCACAF','El Salvador':'CONCACAF','Haiti':'CONCACAF',
        'Canada':'CONCACAF','Panama':'CONCACAF',
        # CAF
        'Senegal':'CAF','Ghana':'CAF','Nigeria':'CAF','Cameroon':'CAF',
        'Ivory Coast':'CAF','Morocco':'CAF','Tunisia':'CAF','Egypt':'CAF',
        'South Africa':'CAF','Algeria':'CAF','Togo':'CAF','Angola':'CAF',
        'Zaire':'CAF','Qatar':'AFC',
        # AFC
        'Japan':'AFC','South Korea':'AFC','Australia':'AFC','Iran':'AFC',
        'Saudi Arabia':'AFC','China PR':'AFC','North Korea':'AFC',
        'Iraq':'AFC','Kuwait':'AFC','United Arab Emirates':'AFC',
        'Indonesia':'AFC',
    }

    home = matches_df['home_team'].dropna().unique()
    away = matches_df['away_team'].dropna().unique()
    all_names = sorted(set(home) | set(away))

    team_map = {}
    for name in all_names:
        conf = confederation_map.get(name, 'OTHER')
        t = Team(
            name=name,
            country=name,
            confederation=conf,
            fifa_ranking=None,
            world_cups_played=0,
        )
        db.session.add(t)
        team_map[name] = t

    db.session.flush()

    # World Cup appearance count
    for name, t in team_map.items():
        h_years = matches_df[matches_df['home_team'] == name]['year'].unique()
        a_years = matches_df[matches_df['away_team'] == name]['year'].unique()
        t.world_cups_played = len(set(h_years) | set(a_years))

    print(f'  \u2713 {len(team_map)} teams loaded')
    return team_map


def load_matches(matches_df, team_map):
    """
    Insert one Match row per row of the merged dataset.
    Uses outcome/winning_team for clean win/draw determination —
    no string parsing of penalty notes required.
    """
    match_map = {}
    skipped = 0

    for _, row in matches_df.iterrows():
        home = row['home_team']
        away = row['away_team']
        year = safe_int(row['year'])

        if not home or not away or not year:
            skipped += 1
            continue
        if home not in team_map or away not in team_map:
            skipped += 1
            continue

        outcome = row.get('outcome')
        if outcome == 'D':
            winner = 'Draw'
        elif outcome == 'H':
            winner = home
        elif outcome == 'A':
            winner = away
        else:
            winner = clean_str(row.get('winning_team'))
            if winner is None:
                winner = 'Draw'

        stage = clean_str(row.get('stage', 'Unknown'))
        # Extract group letter from stage like "Group A" / "Group 1"
        group_name = None
        if stage and stage.lower().startswith('group'):
            parts = stage.split()
            if len(parts) > 1:
                group_name = parts[1][:5]

        m = Match(
            team_a_id  = team_map[home].id,
            team_b_id  = team_map[away].id,
            stage      = stage,
            group_name = group_name,
            venue      = clean_str(row.get('city') or row.get('country')),
            score_a    = safe_int(row['home_score']),
            score_b    = safe_int(row['away_score']),
            winner     = winner,
            year       = year,
        )
        db.session.add(m)
        match_map[(home, away, year)] = m

    db.session.flush()
    print(f'  \u2713 {len(match_map)} matches loaded  ({skipped} skipped)')
    return match_map


def load_players_and_stats(players_df, init_to_new_name, team_map, match_map):
    """
    Build Player rows from WorldCupPlayers.csv, translating old team initials
    to current team names via init_to_new_name. Players from retired entities
    (Dutch East Indies, Serbia and Montenegro) are skipped (None mapping).

    Also generates synthetic match_stats (possession/shots/xG) for ML features
    since neither dataset includes per-match stats.
    """
    position_map = {'GK': 'GK', 'C': 'DEF', 'D': 'DEF',
                    'MF': 'MID', 'M': 'MID', 'FW': 'FWD',
                    'F': 'FWD', 'A': 'FWD', 'T': 'FWD'}

    players_df = players_df.dropna(subset=['Player Name'])
    player_key_map = {}
    skipped_players = 0

    for _, row in players_df.iterrows():
        initials = clean_str(row.get('Team Initials'))
        team_name = init_to_new_name.get(initials)

        if not team_name or team_name not in team_map:
            skipped_players += 1
            continue

        p_name  = clean_str(row['Player Name'])
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

        event = clean_str(row.get('Event', '')) or ''
        if event:
            goal_count = event.count('G') - event.count('GK') - event.count('OG')
            player_key_map[key].goals += max(goal_count, 0)

    db.session.flush()

    # Derive skill scores from real appearance/goal data
    for (name, team_name), p in player_key_map.items():
        if p.position == 'GK':
            p.save_skill = round(min(0.95, 0.45 + (p.appearances * 0.03)), 2)
            p.penalty_skill = 0.35
        else:
            goals_ratio = p.goals / max(p.appearances, 1)
            p.penalty_skill = round(min(0.92, 0.45 + (goals_ratio * 1.5)), 2)

    print(f'  \u2713 {len(player_key_map)} unique players loaded  '
          f'({skipped_players} rows skipped - retired squads)')

    # Synthetic match stats (xG proxy etc.) — seeded for reproducibility
    stat_count = 0
    rng = np.random.default_rng(seed=42)

    for (home, away, year), match in match_map.items():
        for team_name, is_home in [(home, True), (away, False)]:
            if team_name not in team_map:
                continue

            won  = (match.winner == team_name)
            draw = (match.winner == 'Draw')

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

    print(f'  \u2713 {stat_count} match stat rows generated')


# ─── main ────────────────────────────────────────────────────────────────────

def seed():
    print('\n[ETL] Loading CSVs...')

    # Primary match data: 1930-2018, clean schema
    matches_df = pd.read_csv('data/wcmatches.csv', encoding='utf-8')
    matches_df.columns = matches_df.columns.str.strip()
    matches_df['stage'] = matches_df['stage'].str.strip()
    matches_df['home_team'] = matches_df['home_team'].apply(clean_str)
    matches_df['away_team'] = matches_df['away_team'].apply(clean_str)
    matches_df['winning_team'] = matches_df['winning_team'].apply(clean_str)
    matches_df = matches_df.dropna(subset=['home_team', 'away_team'])

    # Merge in 2022 data (hand-compiled, different column names)
    wc2022_path = 'data/WorldCupMatches2022.csv'
    if os.path.exists(wc2022_path):
        wc22 = pd.read_csv(wc2022_path, encoding='utf-8')
        wc22.columns = wc22.columns.str.strip()

        # Translate 2022 schema -> wcmatches.csv schema
        wc22_translated = pd.DataFrame({
            'year':         wc22['Year'],
            'country':      'Qatar',
            'city':         wc22['Stadium'],
            'stage':        wc22['Stage'].replace({
                                'Round of 16': 'Round of 16',
                                'Quarter-finals': 'Quarterfinals',
                                'Semi-finals': 'Semifinals',
                                'Play-off for third place': 'Third place',
                            }),
            'home_team':    wc22['Home Team Name'].apply(clean_str),
            'away_team':    wc22['Away Team Name'].apply(clean_str),
            'home_score':   wc22['Home Team Goals'],
            'away_score':   wc22['Away Team Goals'],
            'win_conditions': wc22['Win conditions'],
            'winning_team': None,
            'losing_team':  None,
            'date':         None, 'month': None, 'dayofweek': None,
        })

        # Determine outcome + winning_team for 2022 rows
        def determine_2022(row):
            h, a = row['home_score'], row['away_score']
            wc = clean_str(row.get('win_conditions'))
            if h > a:
                return 'H', row['home_team']
            if a > h:
                return 'A', row['away_team']
            # drawn after 90 — check penalty win condition
            if wc and 'win on penalties' in wc.lower():
                if row['home_team'].lower() in wc.lower():
                    return 'H', row['home_team']
                if row['away_team'].lower() in wc.lower():
                    return 'A', row['away_team']
            return 'D', None

        outcomes = wc22_translated.apply(determine_2022, axis=1, result_type='expand')
        wc22_translated['outcome'] = outcomes[0]
        wc22_translated['winning_team'] = outcomes[1]

        # Align columns
        for col in matches_df.columns:
            if col not in wc22_translated.columns:
                wc22_translated[col] = None
        wc22_translated = wc22_translated[matches_df.columns]

        matches_df = pd.concat([matches_df, wc22_translated], ignore_index=True)
        print(f'  \u2713 Merged {len(wc22_translated)} matches from World Cup 2022')
    else:
        print('  \u26a0 WorldCupMatches2022.csv not found \u2014 skipping 2022 data')

    players_df = pd.read_csv('data/WorldCupPlayers.csv', encoding='utf-8')
    players_df.columns = players_df.columns.str.strip()

    print('[ETL] Building player initials translation table...')
    init_to_new_name = build_initials_to_newname_map()

    print('[ETL] Seeding database...')
    try:
        team_map  = load_teams(matches_df)
        match_map = load_matches(matches_df, team_map)
        load_players_and_stats(players_df, init_to_new_name, team_map, match_map)
        load_2022_players(team_map)   # ← add this line

        db.session.commit()
        print('\n[ETL] \u2713 Seed complete.')
        _print_summary()

    except Exception as e:
        db.session.rollback()
        print(f'\n[ETL] \u2717 Rolled back due to error: {e}')
        raise

def _print_summary():
    print('\n\u2500\u2500 Database summary \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500')
    print(f'  Teams:       {Team.query.count()}')
    print(f'  Players:     {Player.query.count()}')
    print(f'  Matches:     {Match.query.count()}')
    print(f'  Match stats: {MatchStat.query.count()}')
    print(f'  Predictions: {Prediction.query.count()}')
    print('\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\n')


if __name__ == '__main__':
    app = create_app()
    with app.app_context():
        seed()