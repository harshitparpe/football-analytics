import json
from pathlib import Path

import pandas as pd

from ml.statistical_analysis import (
    load_matches,
    build_temporal_features,
    run_statistics
)

from ml.temporal_validation import (
    evaluate_temporal
)

from ml.bootstrap_evaluation import (
    bootstrap_ci
)

from ml.feature_interpretation import (
    temporal_permutation_importance
)


ROOT = Path(__file__).resolve().parents[1]

REPORTS = ROOT / "reports"

REPORTS.mkdir(
    exist_ok=True
)


def main():

    print("\nLoading FIFA data...")

    matches = load_matches(
        ROOT / "data"
    )

    print(
        f"Matches: {len(matches)}"
    )

    print(
        "\nBuilding leakage-safe features..."
    )

    X, y = build_temporal_features(
        matches
    )

    print(
        f"Features: {X.shape[1]}"
    )

    # --------------------------------------------------
    # STATISTICS
    # --------------------------------------------------

    print(
        "\nRunning statistical tests..."
    )

    statistics = run_statistics(
        matches,
        X
    )

    with open(
        REPORTS / "statistical_results.json",
        "w",
        encoding="utf-8"
    ) as f:

        json.dump(
            statistics,
            f,
            indent=2
        )

    # --------------------------------------------------
    # TEMPORAL VALIDATION
    # --------------------------------------------------

    print(
        "\nRunning temporal validation..."
    )

    fold_results, summary, predictions = (
        evaluate_temporal(
            matches,
            X,
            y
        )
    )

    fold_results.to_csv(
        REPORTS /
        "temporal_fold_results.csv",
        index=False
    )

    summary.to_csv(
        REPORTS /
        "model_comparison.csv",
        index=False
    )

    # --------------------------------------------------
    # BOOTSTRAP
    # --------------------------------------------------

    print(
        "\nCalculating bootstrap confidence intervals..."
    )

    bootstrap_results = {}

    for model_name, values in predictions.items():

        bootstrap_results[
            model_name
        ] = bootstrap_ci(
            values["y_true"],
            values["y_pred"]
        )

    with open(
        REPORTS / "bootstrap_results.json",
        "w",
        encoding="utf-8"
    ) as f:

        json.dump(
            bootstrap_results,
            f,
            indent=2
        )

    # --------------------------------------------------
    # PERMUTATION IMPORTANCE
    # --------------------------------------------------

    print(
        "\nCalculating feature importance..."
    )

    importance = (
        temporal_permutation_importance(
            matches,
            X,
            y
        )
    )

    importance.to_csv(
        REPORTS /
        "feature_importance.csv",
        index=False
    )

    # --------------------------------------------------
    # REPORT
    # --------------------------------------------------

    create_report(
        matches,
        statistics,
        summary,
        bootstrap_results,
        importance
    )

    print(
        "\n================================"
    )

    print(
        "ANALYSIS COMPLETE"
    )

    print(
        "================================"
    )

    print(
        summary.to_string(
            index=False
        )
    )

    print(
        f"\nReports saved to: {REPORTS}"
    )


def create_report(
    matches,
    statistics,
    summary,
    bootstrap,
    importance
):

    lines = []

    lines.append(
        "# FIFA World Cup Research Analysis"
    )

    lines.append("")

    lines.append(
        f"Matches analysed: **{len(matches)}**"
    )

    lines.append("")

    lines.append(
        "## 1. Statistical inference"
    )

    lines.append("")

    lines.append(
        "| Feature | Effect Size | Adjusted p-value |"
    )

    lines.append(
        "|---|---:|---:|"
    )

    for result in statistics[
        "mann_whitney"
    ]:

        lines.append(
            f"| {result['feature']} "
            f"| {result['rank_biserial']:.4f} "
            f"| {result['p_adjusted']:.6g} |"
        )

    lines.append("")

    chi = statistics[
        "stage_chi_square"
    ]

    lines.append(
        "### Stage vs outcome"
    )

    lines.append("")

    lines.append(
        f"- χ²: `{chi['chi2']:.4f}`"
    )

    lines.append(
        f"- p-value: `{chi['p_value']:.6g}`"
    )

    lines.append(
        f"- Cramer's V: `{chi['cramers_v']:.4f}`"
    )

    lines.append("")

    lines.append(
        "## 2. Logistic regression"
    )

    lines.append("")

    lines.append(
        "| Feature | Odds Ratio | 95% CI | p-value |"
    )

    lines.append(
        "|---|---:|---:|---:|"
    )

    for result in statistics[
        "logistic_regression"
    ]:

        if result["feature"] == "const":
            continue

        lines.append(
            f"| {result['feature']} "
            f"| {result['odds_ratio']:.4f} "
            f"| {result['ci_low']:.4f}–"
            f"{result['ci_high']:.4f} "
            f"| {result['p_value']:.6g} |"
        )

    lines.append("")

    lines.append(
        "## 3. Temporal model comparison"
    )

    lines.append("")

    lines.append(
        summary.to_markdown(
            index=False,
            floatfmt=".4f"
        )
    )

    lines.append("")

    lines.append(
        "## 4. Bootstrap 95% confidence intervals"
    )

    lines.append("")

    for model, values in bootstrap.items():

        lines.append(
            f"### {model}"
        )

        for metric, result in values.items():

            lines.append(
                f"- {metric}: "
                f"{result['mean']:.4f} "
                f"({result['ci95_low']:.4f}–"
                f"{result['ci95_high']:.4f})"
            )

    lines.append("")

    lines.append(
        "## 5. Feature importance"
    )

    lines.append("")

    lines.append(
        importance.to_markdown(
            index=False,
            floatfmt=".4f"
        )
    )

    lines.append("")

    lines.append(
        "## Methodology"
    )

    lines.append("")

    lines.append(
        "Features are constructed using only information "
        "available before each match. Temporal validation "
        "trains on earlier World Cups and evaluates on the "
        "next tournament."
    )

    lines.append("")

    lines.append(
        "Statistical association does not imply causation."
    )

    (
        REPORTS /
        "statistical_report.md"
    ).write_text(
        "\n".join(lines),
        encoding="utf-8"
    )


if __name__ == "__main__":
    main()