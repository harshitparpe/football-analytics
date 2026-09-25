import numpy as np
import pandas as pd

from sklearn.ensemble import (
    RandomForestClassifier,
    GradientBoostingClassifier
)
from sklearn.linear_model import LogisticRegression
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler

from sklearn.metrics import (
    accuracy_score,
    f1_score,
    balanced_accuracy_score,
    log_loss
)


def get_models():

    return {

        "Logistic Regression":
            Pipeline([
                ("scaler", StandardScaler()),
                (
                    "model",
                    LogisticRegression(
                        max_iter=2000,
                        class_weight="balanced",
                        random_state=42
                    )
                )
            ]),

        "Random Forest":
            RandomForestClassifier(
                n_estimators=400,
                max_depth=8,
                min_samples_split=5,
                min_samples_leaf=2,
                class_weight="balanced",
                random_state=42,
                n_jobs=-1
            ),

        "Gradient Boosting":
            GradientBoostingClassifier(
                n_estimators=150,
                learning_rate=0.05,
                max_depth=2,
                random_state=42
            )
    }


def evaluate_temporal(matches, X, y):

    models = get_models()

    results = []

    predictions = {
        name: {
            "y_true": [],
            "y_pred": []
        }
        for name in models
    }

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

        # Need all 3 classes in training.
        if len(
            np.unique(y.iloc[train_idx])
        ) < 3:
            continue

        for name, model in models.items():

            model.fit(
                X.iloc[train_idx],
                y.iloc[train_idx]
            )

            pred = model.predict(
                X.iloc[test_idx]
            )

            proba = model.predict_proba(
                X.iloc[test_idx]
            )

            results.append({

                "year": int(year),

                "model": name,

                "n_test":
                    len(test_idx),

                "accuracy":
                    accuracy_score(
                        y.iloc[test_idx],
                        pred
                    ),

                "macro_f1":
                    f1_score(
                        y.iloc[test_idx],
                        pred,
                        average="macro",
                        zero_division=0
                    ),

                "balanced_accuracy":
                    balanced_accuracy_score(
                        y.iloc[test_idx],
                        pred
                    ),

                "log_loss":
                    log_loss(
                        y.iloc[test_idx],
                        proba,
                        labels=[0, 1, 2]
                    )
            })

            predictions[name]["y_true"].extend(
                y.iloc[test_idx].tolist()
            )

            predictions[name]["y_pred"].extend(
                pred.tolist()
            )

    results = pd.DataFrame(results)

    summary = (
        results
        .groupby("model")
        [
            [
                "accuracy",
                "macro_f1",
                "balanced_accuracy",
                "log_loss"
            ]
        ]
        .mean()
        .reset_index()
    )

    return results, summary, predictions