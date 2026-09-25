import numpy as np

from sklearn.metrics import (
    accuracy_score,
    f1_score,
    balanced_accuracy_score
)


def bootstrap_ci(
    y_true,
    y_pred,
    n_bootstrap=2000,
    seed=42
):

    y_true = np.asarray(y_true)
    y_pred = np.asarray(y_pred)

    rng = np.random.default_rng(seed)

    n = len(y_true)

    scores = np.zeros(
        (n_bootstrap, 3)
    )

    for i in range(n_bootstrap):

        idx = rng.integers(
            0,
            n,
            size=n
        )

        yt = y_true[idx]
        yp = y_pred[idx]

        scores[i, 0] = accuracy_score(
            yt, yp
        )

        scores[i, 1] = f1_score(
            yt,
            yp,
            average="macro",
            zero_division=0
        )

        scores[i, 2] = balanced_accuracy_score(
            yt,
            yp
        )

    metrics = [
        "accuracy",
        "macro_f1",
        "balanced_accuracy"
    ]

    output = {}

    for i, metric in enumerate(metrics):

        output[metric] = {
            "mean": float(
                np.mean(scores[:, i])
            ),
            "ci95_low": float(
                np.percentile(
                    scores[:, i], 2.5
                )
            ),
            "ci95_high": float(
                np.percentile(
                    scores[:, i], 97.5
                )
            )
        }

    return output