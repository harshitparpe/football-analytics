import numpy as np
import pandas as pd

from sklearn.ensemble import RandomForestClassifier
from sklearn.inspection import permutation_importance


def temporal_permutation_importance(
    matches,
    X,
    y,
    repeats=5
):

    rows = []

    years = sorted(
        matches["year"].unique()
    )

    for year in years[1:]:

        train_idx = np.where(
            matches["year"].values < year
        )[0]

        test_idx = np.where(
            matches["year"].values == year
        )[0]

        if len(
            np.unique(y.iloc[train_idx])
        ) < 3:
            continue

        model = RandomForestClassifier(
            n_estimators=200,
            max_depth=8,
            min_samples_split=5,
            class_weight="balanced",
            random_state=42,
            n_jobs=-1
        )

        model.fit(
            X.iloc[train_idx],
            y.iloc[train_idx]
        )

        result = permutation_importance(
            model,
            X.iloc[test_idx],
            y.iloc[test_idx],
            scoring="f1_macro",
            n_repeats=repeats,
            random_state=42,
            n_jobs=-1
        )

        for feature, importance in zip(
            X.columns,
            result.importances_mean
        ):

            rows.append({
                "year": int(year),
                "feature": feature,
                "importance": float(
                    importance
                )
            })

    result = pd.DataFrame(rows)

    return (
        result
        .groupby("feature")
        .agg(
            mean_importance=(
                "importance",
                "mean"
            ),
            std_importance=(
                "importance",
                "std"
            )
        )
        .reset_index()
        .sort_values(
            "mean_importance",
            ascending=False
        )
    )