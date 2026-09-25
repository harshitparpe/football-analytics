# FIFA World Cup Research Analysis

Matches analysed: **964**

## 1. Statistical inference

| Feature | Effect Size | Adjusted p-value |
|---|---:|---:|
| win_pct_diff | 0.2691 | 1.00727e-12 |
| gf_diff | 0.2949 | 9.81967e-15 |
| ga_diff | 0.1482 | 9.25993e-05 |
| h2h_a_win_pct | 0.0598 | 0.0192221 |

### Stage vs outcome

- χ²: `114.2051`
- p-value: `6.25047e-07`
- Cramer's V: `0.2434`

## 2. Logistic regression

| Feature | Odds Ratio | 95% CI | p-value |
|---|---:|---:|---:|
| win_pct_diff | 0.9016 | 0.6900–1.1782 | 0.448153 |
| gf_diff | 1.8278 | 1.3981–2.3897 | 1.03275e-05 |
| ga_diff | 1.3411 | 1.1260–1.5974 | 0.00100338 |
| h2h_a_win_pct | 1.0701 | 0.9382–1.2206 | 0.312497 |

## 3. Temporal model comparison

| model               |   accuracy |   macro_f1 |   balanced_accuracy |   log_loss |
|:--------------------|-----------:|-----------:|--------------------:|-----------:|
| Gradient Boosting   |     0.4804 |     0.3828 |              0.4016 |     1.1773 |
| Logistic Regression |     0.3969 |     0.3735 |              0.4090 |     1.2580 |
| Random Forest       |     0.4594 |     0.3888 |              0.4083 |     1.0914 |

## 4. Bootstrap 95% confidence intervals

### Logistic Regression
- accuracy: 0.4027 (0.3714–0.4349)
- macro_f1: 0.3976 (0.3658–0.4294)
- balanced_accuracy: 0.4210 (0.3873–0.4551)
### Random Forest
- accuracy: 0.4651 (0.4316–0.4962)
- macro_f1: 0.4167 (0.3839–0.4481)
- balanced_accuracy: 0.4178 (0.3850–0.4497)
### Gradient Boosting
- accuracy: 0.4885 (0.4575–0.5188)
- macro_f1: 0.3954 (0.3652–0.4246)
- balanced_accuracy: 0.4050 (0.3772–0.4313)

## 5. Feature importance

| feature                |   mean_importance |   std_importance |
|:-----------------------|------------------:|-----------------:|
| team_a_goals_per_match |            0.0249 |           0.0594 |
| team_a_wc_experience   |            0.0152 |           0.0380 |
| team_b_wc_experience   |            0.0083 |           0.0317 |
| h2h_a_win_pct          |           -0.0041 |           0.0252 |
| team_b_win_pct         |           -0.0056 |           0.0385 |
| team_b_goals_against   |           -0.0060 |           0.0381 |
| team_b_goals_per_match |           -0.0063 |           0.0345 |
| team_a_goals_against   |           -0.0068 |           0.0366 |
| h2h_goal_diff          |           -0.0078 |           0.0248 |
| team_a_win_pct         |           -0.0170 |           0.0389 |

## Methodology

Features are constructed using only information available before each match. Temporal validation trains on earlier World Cups and evaluates on the next tournament.

Statistical association does not imply causation.