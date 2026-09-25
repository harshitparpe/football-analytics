from collections import defaultdict
from pathlib import Path

import numpy as np
import pandas as pd
import statsmodels.api as sm
from scipy.stats import chi2_contingency, mannwhitneyu


FEATURES = [
    "team_a_win_pct",
    "team_b_win_pct",
    "team_a_goals_per_match",
    "team_b_goals_per_match",
    "team_a_goals_against",
    "team_b_goals_against",
    "team_a_wc_experience",
    "team_b_wc_experience",
    "h2h_a_win_pct",
    "h2h_goal_diff",
]


def load_matches(data_dir="data"):
    data_dir = Path(data_dir)

    df = pd.read_csv(data_dir / "wcmatches.csv")

    df = df.rename(columns={
        "home_team": "team_a",
        "away_team": "team_b",
        "home_score": "score_a",
        "away_score": "score_b",
    })

    cols = [
        "year", "stage", "team_a", "team_b",
        "score_a", "score_b", "outcome", "winning_team"
    ]

    df = df[cols].copy()

    # Add curated 2022 data if present.
    wc2022 = data_dir / "WorldCupMatches2022.csv"

    if wc2022.exists():
        x = pd.read_csv(wc2022)

        x = x.rename(columns={
            "Year": "year",
            "Stage": "stage",
            "Home Team Name": "team_a",
            "Away Team Name": "team_b",
            "Home Team Goals": "score_a",
            "Away Team Goals": "score_b",
            "Win conditions": "win_conditions",
        })

        def get_outcome(row):
            if row.score_a > row.score_b:
                return "H"
            if row.score_b > row.score_a:
                return "A"

            text = str(row.get("win_conditions", "")).lower()

            if "win on penalties" in text:
                if row.team_a.lower() in text:
                    return "H"
                return "A"

            return "D"

        x["outcome"] = x.apply(get_outcome, axis=1)

        x["winning_team"] = np.where(
            x.outcome == "H",
            x.team_a,
            np.where(x.outcome == "A", x.team_b, None)
        )

        x = x[cols]

        df = pd.concat([df, x], ignore_index=True)

    return df.sort_values("year").reset_index(drop=True)


def build_temporal_features(matches):
    """
    IMPORTANT:
    Features for a match are calculated BEFORE that match.
    Therefore the current match result can never leak into X.
    """

    stats = defaultdict(lambda: {
        "games": 0,
        "wins": 0,
        "gf": 0,
        "ga": 0,
        "years": set(),
    })

    h2h = defaultdict(lambda: {
        "games": 0,
        "a_wins": 0,
        "b_wins": 0,
        "goal_diff": 0,
    })

    rows = []

    for _, row in matches.iterrows():

        a = row.team_a
        b = row.team_b
        year = int(row.year)

        A = stats[a]
        B = stats[b]

        pair = tuple(sorted([a, b]))
        reverse = pair[0] != a

        H = h2h[pair]

        if H["games"]:
            if reverse:
                h2h_win_pct = H["b_wins"] / H["games"]
                h2h_goal_diff = -H["goal_diff"] / H["games"]
            else:
                h2h_win_pct = H["a_wins"] / H["games"]
                h2h_goal_diff = H["goal_diff"] / H["games"]
        else:
            h2h_win_pct = 0
            h2h_goal_diff = 0

        rows.append({
            "team_a_win_pct":
                A["wins"] / A["games"] if A["games"] else 0,

            "team_b_win_pct":
                B["wins"] / B["games"] if B["games"] else 0,

            "team_a_goals_per_match":
                A["gf"] / A["games"] if A["games"] else 0,

            "team_b_goals_per_match":
                B["gf"] / B["games"] if B["games"] else 0,

            "team_a_goals_against":
                A["ga"] / A["games"] if A["games"] else 0,

            "team_b_goals_against":
                B["ga"] / B["games"] if B["games"] else 0,

            "team_a_wc_experience": len(A["years"]),
            "team_b_wc_experience": len(B["years"]),

            "h2h_a_win_pct": h2h_win_pct,
            "h2h_goal_diff": h2h_goal_diff,
        })

        # Update history AFTER creating current-match features.
        stats[a]["games"] += 1
        stats[b]["games"] += 1

        stats[a]["gf"] += row.score_a
        stats[a]["ga"] += row.score_b

        stats[b]["gf"] += row.score_b
        stats[b]["ga"] += row.score_a

        stats[a]["years"].add(year)
        stats[b]["years"].add(year)

        if row.outcome == "H":
            stats[a]["wins"] += 1
        elif row.outcome == "A":
            stats[b]["wins"] += 1

        if not reverse:
            if row.outcome == "H":
                H["a_wins"] += 1
            elif row.outcome == "A":
                H["b_wins"] += 1

            H["goal_diff"] += row.score_a - row.score_b

        else:
            if row.outcome == "A":
                H["a_wins"] += 1
            elif row.outcome == "H":
                H["b_wins"] += 1

            H["goal_diff"] += row.score_b - row.score_a

        H["games"] += 1

    X = pd.DataFrame(rows, columns=FEATURES)

    y = matches["outcome"].map({
        "H": 0,
        "D": 1,
        "A": 2
    }).astype(int)

    return X, y


def run_statistics(matches, X):

    df = pd.concat(
        [matches.reset_index(drop=True),
         X.reset_index(drop=True)],
        axis=1
    )

    # Team A win vs everything else.
    df["a_win"] = (df.outcome == "H").astype(int)

    df["win_pct_diff"] = (
        df.team_a_win_pct -
        df.team_b_win_pct
    )

    df["gf_diff"] = (
        df.team_a_goals_per_match -
        df.team_b_goals_per_match
    )

    df["ga_diff"] = (
        df.team_b_goals_against -
        df.team_a_goals_against
    )

    tests = []

    for feature in [
        "win_pct_diff",
        "gf_diff",
        "ga_diff",
        "h2h_a_win_pct"
    ]:

        win = df.loc[
            df.a_win == 1, feature
        ].dropna()

        other = df.loc[
            df.a_win == 0, feature
        ].dropna()

        u, p = mannwhitneyu(
            win,
            other,
            alternative="two-sided"
        )

        effect = (
            2 * u / (len(win) * len(other))
        ) - 1

        tests.append({
            "feature": feature,
            "U": float(u),
            "p_value": float(p),
            "rank_biserial": float(effect),
        })

    # Benjamini-Hochberg correction.
    ordered = sorted(
        range(len(tests)),
        key=lambda i: tests[i]["p_value"]
    )

    m = len(tests)

    for rank, i in enumerate(ordered, start=1):
        tests[i]["p_adjusted"] = min(
            tests[i]["p_value"] * m / rank,
            1
        )

    # Stage vs outcome.
    table = pd.crosstab(
        df.stage,
        df.outcome
    )

    chi2, p, dof, _ = chi2_contingency(table)

    n = table.values.sum()

    cramer_v = np.sqrt(
        (chi2 / n) /
        min(table.shape[0] - 1, table.shape[1] - 1)
    )

    # Logistic regression.
    logistic_cols = [
        "win_pct_diff",
        "gf_diff",
        "ga_diff",
        "h2h_a_win_pct",
    ]

    logistic_df = df[
        ["a_win"] + logistic_cols
    ].dropna()

    Z = logistic_df[logistic_cols]

    # Standardise predictors.
    Z = (
        Z - Z.mean()
    ) / Z.std(ddof=0)

    model = sm.Logit(
        logistic_df["a_win"],
        sm.add_constant(Z)
    ).fit(disp=False)

    ci = model.conf_int()

    logistic_results = []

    for feature in model.params.index:

        logistic_results.append({
            "feature": feature,
            "odds_ratio": float(
                np.exp(model.params[feature])
            ),
            "ci_low": float(
                np.exp(ci.loc[feature, 0])
            ),
            "ci_high": float(
                np.exp(ci.loc[feature, 1])
            ),
            "p_value": float(
                model.pvalues[feature]
            )
        })

    return {
        "mann_whitney": tests,
        "stage_chi_square": {
            "chi2": float(chi2),
            "p_value": float(p),
            "dof": int(dof),
            "cramers_v": float(cramer_v),
        },
        "logistic_regression": logistic_results,
    }