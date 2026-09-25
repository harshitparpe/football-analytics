# FIFA World Cup Analytics & Prediction Platform

A full-stack FIFA World Cup analytics platform combining **data engineering, exploratory data analysis, statistical inference, interpretable regression, machine learning, temporal validation, and prediction**.

The project started as a match-outcome prediction system and was extended into a research-oriented analytics pipeline to answer a broader question:

> **Which historical team characteristics are associated with World Cup match outcomes, and how well can those characteristics predict future matches?**

---

## Project Overview

The platform combines:

* Historical FIFA World Cup match data
* SQL-backed data storage
* Flask REST APIs
* React analytics dashboard
* Statistical hypothesis testing
* Logistic regression
* Random Forest
* Gradient Boosting
* Temporal model validation
* Bootstrap confidence intervals
* Permutation feature importance
* Penalty shootout simulation
* 2026 World Cup tracking

The research pipeline analyses **964 World Cup matches** and constructs **10 historical-performance features** for every match.

The goal is not simply to maximize prediction accuracy, but to connect:

**EDA → Statistical Inference → Regression → Machine Learning → Validation → Interpretation**

---

# 1. Research Question

The analysis investigates three related questions:

### 1. What historical characteristics are associated with match outcomes?

Examples:

* Does a stronger historical win percentage correspond to a higher chance of winning?
* Does historical scoring performance differ between winners and non-winners?
* Does defensive performance matter?
* Does previous head-to-head performance provide additional information?
* Does the World Cup stage have an association with the outcome?

### 2. Which statistical relationships are meaningful?

Statistical tests are used to distinguish between:

* observed differences that may reflect genuine relationships, and
* differences that could plausibly arise from sampling variation.

### 3. Can these historical characteristics predict future match outcomes?

Three models are evaluated:

* Logistic Regression
* Random Forest
* Gradient Boosting

Rather than using a conventional random train/test split, the research pipeline evaluates models chronologically across World Cup tournaments.

---

# 2. Dataset

The current research dataset contains:

**964 FIFA World Cup matches**

Each match contains information such as:

* Tournament year
* Stage
* Team A
* Team B
* Team A score
* Team B score
* Match outcome
* Winning team

The target is represented as:

| Outcome | Meaning     |
| ------- | ----------- |
| `H`     | Team A wins |
| `D`     | Draw        |
| `A`     | Team B wins |

For machine learning this is encoded as:

```text
H → 0
D → 1
A → 2
```

The prediction problem is therefore a **three-class classification problem**.

---

# 3. Historical Feature Engineering

Instead of directly using the final match result to create predictors, the research pipeline builds historical team statistics.

The 10 features are:

| Feature                  | Meaning                                           |
| ------------------------ | ------------------------------------------------- |
| `team_a_win_pct`         | Historical win percentage of Team A               |
| `team_b_win_pct`         | Historical win percentage of Team B               |
| `team_a_goals_per_match` | Historical goals scored per match by Team A       |
| `team_b_goals_per_match` | Historical goals scored per match by Team B       |
| `team_a_goals_against`   | Historical goals conceded per match by Team A     |
| `team_b_goals_against`   | Historical goals conceded per match by Team B     |
| `team_a_wc_experience`   | Number of World Cup tournaments previously played |
| `team_b_wc_experience`   | Number of World Cup tournaments previously played |
| `h2h_a_win_pct`          | Team A's historical head-to-head win percentage   |
| `h2h_goal_diff`          | Historical head-to-head goal difference           |

### Why historical features?

Using raw match scores from the match being predicted would leak the answer into the predictors.

For example, using the current match's goals to predict whether the team won would make the model artificially accurate.

Instead, the project calculates team statistics from historical matches.

---

# 4. Leakage Considerations

The original project contained an xG-style feature generated from match-level information. Because the generated xG values were influenced by the actual match outcome, they were **not suitable as pre-match predictors**.

The research pipeline therefore does **not use those outcome-derived xG values**.

This makes the research features substantially more appropriate for investigating whether historical team performance can predict match outcomes.

> The current temporal feature construction is chronological, but later matches within the same tournament can incorporate earlier matches from that tournament. A stricter pre-tournament evaluation can be added by freezing each tournament's feature history before the tournament begins.

---

# 5. Exploratory & Descriptive Analysis

Before modelling, the pipeline examines:

* Dataset size
* Feature distributions
* Missing values
* Duplicate records
* Outcome distribution
* Winner vs non-winner feature differences
* Tournament-stage distribution

The purpose of EDA is to understand the data before applying statistical tests or machine learning.

---

# 6. Statistical Inference

The project uses statistical tests to investigate whether historical characteristics are associated with match outcomes.

## Mann–Whitney U Test

For numerical features, matches where Team A won are compared with matches where Team A did not win.

The test is useful because it does not require the two groups to follow a normal distribution.

The analysis uses four derived variables:

```text
win_pct_diff
gf_diff
ga_diff
h2h_a_win_pct
```

Where:

```text
win_pct_diff = Team A win % - Team B win %

gf_diff = Team A goals/match - Team B goals/match

ga_diff = Team B goals conceded/match
           - Team A goals conceded/match
```

A positive `ga_diff` therefore indicates a defensive advantage for Team A.

---

## Effect Size: Rank-Biserial Correlation

A p-value tells us whether the observed difference is statistically detectable.

It does **not** tell us how large the difference is.

Therefore, the project also calculates rank-biserial correlation.

Approximate interpretation:

* Near `0` → little separation between groups
* Larger absolute value → greater separation
* Positive value → the first group tends to have larger values

### Results

| Feature                   | Rank-Biserial Effect | Adjusted p-value |
| ------------------------- | -------------------: | ---------------: |
| Goals-for difference      |            **0.295** | **9.82 × 10⁻¹⁵** |
| Win-percentage difference |            **0.269** | **1.01 × 10⁻¹²** |
| Goals-against difference  |            **0.148** |  **9.26 × 10⁻⁵** |
| H2H win percentage        |            **0.060** |       **0.0192** |

### Interpretation

Historical attacking performance showed the largest observed group separation among these four variables.

Win-percentage difference also showed a meaningful statistical relationship.

Goals-against difference had a smaller effect.

Head-to-head win percentage had the smallest effect, despite reaching statistical significance.

This distinction is important:

> **Statistical significance does not automatically mean practical importance.**

---

# 7. Multiple-Testing Correction

Four statistical hypotheses were tested.

Because testing multiple hypotheses increases the chance of obtaining a small p-value by chance, the pipeline applies a **Benjamini–Hochberg-style false discovery rate adjustment** to the Mann–Whitney p-values.

The adjusted p-values are reported in the research output.

This makes the statistical analysis more conservative than simply reporting the raw p-values.

---

# 8. World Cup Stage Analysis

The project also investigates whether tournament stage and match outcome are associated.

A **Chi-Square Test of Independence** is used.

### Results

```text
χ² = 114.205
p-value = 6.25 × 10⁻⁷
degrees of freedom = 50
Cramer's V = 0.243
```

### What this means

The Chi-Square test evaluates whether the distribution of outcomes varies across tournament stages.

The very small p-value indicates evidence of an association between stage and outcome in this dataset.

However, the test does **not** prove that tournament stage causes a particular result.

### Cramer's V

Cramer's V measures the strength of association between categorical variables.

Here:

```text
Cramer's V ≈ 0.243
```

indicates a non-zero association of moderate magnitude in this dataset.

---

# 9. Logistic Regression

A Logistic Regression model is used as an interpretable statistical baseline.

Unlike the main machine-learning problem, this analysis simplifies the target to:

```text
1 → Team A wins
0 → Team A does not win
```

The model uses:

* Win percentage difference
* Goals-for difference
* Goals-against difference
* Head-to-head win percentage

The numerical predictors are standardized before fitting the model.

---

## Odds Ratios

The regression coefficients are converted into odds ratios:

```text
Odds Ratio = e^(coefficient)
```

An odds ratio above 1 means increasing the standardized predictor is associated with higher odds of a Team A win, while an odds ratio below 1 indicates lower odds.

### Results

| Predictor                | Odds Ratio | 95% Confidence Interval |    p-value |
| ------------------------ | ---------: | ----------------------: | ---------: |
| Win % difference         |      0.902 |             0.690–1.178 |      0.448 |
| Goals-for difference     |  **1.828** |         **1.398–2.390** | **<0.001** |
| Goals-against difference |  **1.341** |         **1.126–1.597** |  **0.001** |
| H2H win %                |      1.070 |             0.938–1.221 |      0.312 |

### Interpretation

The goals-for difference has an estimated odds ratio of approximately **1.83**.

Because the predictors were standardized, this corresponds to a **one-standard-deviation increase** in goals-for difference being associated with approximately 1.83× the odds of Team A winning, holding the other predictors constant.

The confidence interval does not cross 1 and the p-value is below 0.001.

The goals-against difference also shows a statistically significant relationship.

The confidence intervals for win-percentage difference and head-to-head win percentage include 1, so this model does not provide strong evidence that those predictors have an independent effect after accounting for the other variables.

---

# 10. Machine Learning Models

Three classification algorithms are evaluated using the same historical features.

### Logistic Regression

Used as an interpretable linear baseline.

It provides:

* A simple benchmark
* Coefficients
* Probability estimates
* An interpretable relationship between predictors and outcomes

### Random Forest

An ensemble of decision trees that can capture:

* Non-linear relationships
* Feature interactions
* Different decision boundaries

Class weighting is used to reduce the impact of outcome imbalance.

### Gradient Boosting

An ensemble method that builds trees sequentially, with each tree attempting to improve upon previous errors.

The implementation uses:

```text
150 estimators
learning rate = 0.05
max depth = 2
```

---

# 11. Temporal Validation

A random train/test split can be misleading for historical sports prediction.

For example:

```text
2018 data → training
2022 data → testing
```

better represents the real-world situation than randomly mixing matches from 1930–2022.

The temporal evaluation therefore trains models using earlier World Cup years and evaluates them on later tournaments.

This reduces the risk of training on information from a future tournament.

---

# 12. Model Evaluation Metrics

Four metrics are reported.

## Accuracy

```text
Correct predictions / Total predictions
```

Measures the overall proportion of correctly classified matches.

---

## Macro-F1

F1-score is calculated separately for each outcome class and then averaged.

This gives each class equal importance, rather than allowing the most common class to dominate the metric.

Useful because football outcomes are not perfectly balanced.

---

## Balanced Accuracy

Balanced accuracy calculates recall for each class and averages the recalls.

This helps determine whether the model performs reasonably across all outcome classes rather than mainly predicting the majority class.

---

## Log Loss

Log loss evaluates the quality of predicted probabilities.

Unlike accuracy, it considers **how confident the model was**.

For example:

```text
Prediction A:
Win = 0.51
Draw = 0.25
Loss = 0.24
```

is treated differently from:

```text
Prediction B:
Win = 0.99
Draw = 0.005
Loss = 0.005
```

if the prediction is wrong.

**Lower log loss is better.**

---

# 13. Model Results

The temporal evaluation produced the following average results:

| Model               |   Accuracy |  Macro-F1 | Balanced Accuracy |  Log Loss |
| ------------------- | ---------: | --------: | ----------------: | --------: |
| Gradient Boosting   | **48.04%** |     0.383 |             0.402 |     1.177 |
| Logistic Regression |     39.69% |     0.373 |         **0.409** |     1.258 |
| Random Forest       |     45.94% | **0.389** |             0.408 | **1.091** |

### How to interpret this

The models behave differently depending on the metric.

**Gradient Boosting** produced the highest overall accuracy at approximately **48.0%**.

**Random Forest** produced the highest Macro-F1 and lowest log loss.

**Logistic Regression** produced the highest balanced accuracy, although its overall accuracy was lower.

This demonstrates why evaluating a classification model using accuracy alone can be misleading.

The results also show that predicting all three World Cup outcomes from historical team statistics is a difficult problem.

---

# 14. Bootstrap Confidence Intervals

The project also uses bootstrap resampling to estimate uncertainty around model metrics.

The process is:

1. Collect the predictions from the temporal test sets.
2. Randomly resample the prediction pairs with replacement.
3. Recalculate the evaluation metric.
4. Repeat the process 2,000 times.
5. Use the 2.5th and 97.5th percentiles as the approximate 95% confidence interval.

This provides an estimate of how much the reported metric could vary under repeated samples from the observed predictions.

The generated results are stored in:

```text
reports/bootstrap_results.json
```

---

# 15. Feature Importance

The project uses **permutation importance** rather than relying only on tree feature importance.

For each feature:

1. Evaluate the trained model normally.
2. Randomly shuffle one feature in the test set.
3. Evaluate the model again.
4. Measure how much Macro-F1 changes.
5. Repeat the permutation several times.
6. Average the resulting importance values across temporal folds.

If shuffling a feature substantially reduces performance, that feature was useful to the model.

This is different from statistical significance:

> A statistically significant variable does not necessarily have high predictive importance, and a predictive feature does not automatically establish a causal relationship.

The resulting feature-importance table is saved to:

```text
reports/feature_importance.csv
```

---

# 16. Research Outputs

Running:

```bash
python -m ml.run_research_analysis
```

generates the following:

```text
reports/
├── statistical_results.json
├── temporal_fold_results.csv
├── model_comparison.csv
├── bootstrap_results.json
├── feature_importance.csv
└── research_report.md
```

### `statistical_results.json`

Contains:

* Mann–Whitney U tests
* Effect sizes
* Adjusted p-values
* Chi-Square test
* Cramer's V
* Logistic regression coefficients
* Odds ratios
* Confidence intervals

### `temporal_fold_results.csv`

Contains model performance for each temporal evaluation fold.

### `model_comparison.csv`

Contains the aggregate model metrics.

### `bootstrap_results.json`

Contains bootstrap estimates and 95% confidence intervals.

### `feature_importance.csv`

Contains temporal permutation importance for each historical feature.

### `research_report.md`

Human-readable summary of the complete analysis.

---

# 17. Engineering Architecture

```text
                    FIFA Historical Data
                           │
                           ▼
                    Data Preparation
                           │
                           ▼
                 Historical Feature Engineering
                           │
          ┌────────────────┼────────────────┐
          ▼                ▼                ▼
         EDA        Statistical Tests    Regression
          │                │                │
          └────────────────┼────────────────┘
                           ▼
                  Temporal Validation
                           │
              ┌────────────┼────────────┐
              ▼            ▼            ▼
          Logistic     Random Forest   Gradient
          Regression                   Boosting
              │            │            │
              └────────────┼────────────┘
                           ▼
                 Model Evaluation
                           │
          ┌────────────────┼────────────────┐
          ▼                ▼                ▼
       Bootstrap      Permutation      Interpretation
       Confidence      Importance
        Intervals
                           │
                           ▼
                    Research Reports
```

---

# 18. Full-Stack Application

The research pipeline exists alongside the original production-oriented application.

### Backend

Built using:

* Python
* Flask
* Flask-SQLAlchemy
* Flask-Migrate
* Flask-JWT-Extended
* PostgreSQL
* REST APIs

The backend contains **21 API endpoints across 5 Flask Blueprints**.

### Frontend

Built using:

* React
* JavaScript
* Tailwind CSS

The dashboard provides visual access to World Cup statistics and prediction functionality.

### Deployment / DevOps

The project also includes:

* Docker
* Docker Compose
* GitHub Actions
* Railway
* Vercel

---

# 19. Penalty Shootout Simulator

The project includes a separate penalty shootout simulation system.

It uses player-level information from **7,000+ players** and models penalty decisions using:

* Player penalty ratings
* Goalkeeper save ratings
* Shot location
* Goalkeeper dive direction

The simulator divides the goal into a **3 × 2 grid** and uses player/goalkeeper ratings to simulate penalty outcomes.

This demonstrates an additional application of the dataset beyond match-result prediction.

---

# 20. Testing

The research pipeline includes automated tests covering:

* Historical feature construction
* Bootstrap evaluation

Current test result:

```text
2 passed
```

Run:

```bash
pytest tests/test_research_analysis.py
```

The current tests pass successfully.

---

# 21. Technologies

### Programming

* Python
* SQL
* JavaScript

### Data Science

* Pandas
* NumPy
* SciPy
* Statsmodels
* Scikit-learn

### Machine Learning

* Logistic Regression
* Random Forest
* Gradient Boosting
* Permutation Importance
* Bootstrap Evaluation

### Backend

* Flask
* SQLAlchemy
* Flask-Migrate
* JWT

### Database

* PostgreSQL

### Frontend

* React
* Tailwind CSS

### Engineering

* Docker
* GitHub Actions
* Railway
* Vercel
* Pytest

---

# 22. Key Takeaways

The research extension changes the project from a simple prediction application into a broader analytics study.

The main findings from the current 964-match analysis are:

1. **Historical scoring performance has a measurable statistical relationship with match outcomes.**
2. **Historical win percentage also shows a statistically significant relationship with Team A winning.**
3. **Defensive performance shows a smaller but statistically significant relationship.**
4. **Head-to-head performance has a comparatively small effect.**
5. **Tournament stage and outcome are statistically associated in the historical dataset.**
6. **Different ML models perform differently depending on the evaluation metric.**
7. **Random Forest produced the lowest log loss, while Gradient Boosting produced the highest accuracy.**
8. **Bootstrap evaluation and permutation importance provide additional information beyond a single accuracy number.**
9. **The results demonstrate that statistical significance and predictive importance are different concepts.**

The project therefore focuses not only on:

> **"Can I predict the winner?"**

but also:

> **"Which historical factors are associated with the outcome, how strong are those relationships, and how reliably can they be used for prediction?"**

---

# 23. Running the Research Pipeline

Install dependencies:

```bash
pip install -r requirements.txt
```

Run the complete analysis:

```bash
python -m ml.run_research_analysis
```

Run the research tests:

```bash
pytest tests/test_research_analysis.py
```

The complete research output will be generated inside:

```text
reports/
```

---

## Project Structure

```text
football-analytics/
│
├── api/
│   ├── models/
│   ├── routes/
│   └── ...
│
├── data/
│   ├── wcmatches.csv
│   ├── WorldCupMatches2022.csv
│   └── ...
│
├── etl/
│   └── ...
│
├── ml/
│   ├── statistical_analysis.py
│   ├── temporal_validation.py
│   ├── bootstrap_evaluation.py
│   ├── feature_interpretation.py
│   ├── run_research_analysis.py
│   └── ...
│
├── reports/
│   ├── statistical_results.json
│   ├── temporal_fold_results.csv
│   ├── model_comparison.csv
│   ├── bootstrap_results.json
│   ├── feature_importance.csv
│   └── research_report.md
│
├── frontend/
├── migrations/
├── tests/
├── Dockerfile
├── docker-compose.yml
├── requirements.txt
└── README.md
```

---

# Conclusion

This project combines a production-style full-stack application with a research-oriented machine learning workflow.

It demonstrates the complete analytical process:

**Data → EDA → Feature Engineering → Statistical Inference → Regression → Machine Learning → Temporal Validation → Uncertainty Estimation → Feature Interpretation → Deployment**

The emphasis is on understanding **why the models behave as they do**, rather than reporting a single prediction accuracy.
