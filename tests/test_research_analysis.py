import numpy as np
import pandas as pd

from ml.statistical_analysis import (
    build_temporal_features
)

from ml.bootstrap_evaluation import (
    bootstrap_ci
)


def test_no_current_match_leakage():

    matches = pd.DataFrame([
        {
            "year": 2018,
            "team_a": "A",
            "team_b": "B",
            "score_a": 10,
            "score_b": 0,
            "outcome": "H"
        },
        {
            "year": 2022,
            "team_a": "A",
            "team_b": "B",
            "score_a": 0,
            "score_b": 10,
            "outcome": "A"
        }
    ])

    X, y = build_temporal_features(
        matches
    )

    # 2022 features must use 2018,
    # not the 2022 result.
    assert (
        X.iloc[1]["team_a_win_pct"]
        == 1.0
    )

    assert (
        X.iloc[1]["team_b_win_pct"]
        == 0.0
    )

    assert (
        X.iloc[1]["team_a_goals_per_match"]
        == 10.0
    )


def test_bootstrap():

    y_true = np.array(
        [0, 1, 2, 0, 1, 2]
    )

    y_pred = np.array(
        [0, 1, 1, 0, 2, 2]
    )

    result = bootstrap_ci(
        y_true,
        y_pred,
        n_bootstrap=100
    )

    for metric in result.values():

        assert (
            0 <= metric["ci95_low"]
            <= metric["mean"]
            <= metric["ci95_high"]
            <= 1
        )