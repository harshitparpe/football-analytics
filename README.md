# FIFA World Cup Analytics Platform

> Full-stack sports analytics platform with ML match outcome prediction and an OOP penalty shootout simulator, built over 14 days as a resume project for software engineering placements.

## Badges

![CI](https://github.com/YOUR_USERNAME/football-analytics/workflows/CI%20Pipeline/badge.svg)
![Python](https://img.shields.io/badge/Python-3.12-blue)
![React](https://img.shields.io/badge/React-18-61dafb)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-18-336791)
![License](https://img.shields.io/badge/license-MIT-green)

## Links

[Live Demo] (https://football-analytics-s3kk.vercel.app/) ·
[API](https://football-analytics-production-7564.up.railway.app) ·
[API Docs](#api-endpoints)

## Features

* Match outcome prediction — Random Forest classifier trained on 852 historical World Cup matches (1930–2014), achieving 62% test accuracy with leave-one-out feature computation to prevent data leakage.
* OOP penalty simulator — Shooter / Keeper / PenaltyEngine class hierarchy with probabilistic direction-matching mechanics and animated result visualization.
* Interactive dashboard — league table (83 nations), top scorers leaderboard, and tournament goals-per-match charts.
* Team performance analytics — win/draw/loss donut charts, goals-per-tournament trends, and filterable match history.
* JWT authentication with bcrypt password hashing and protected routes.
* 21 REST API endpoints across 5 Flask Blueprints.
* 25 pytest test cases with SQLite in-memory isolation.
* CI/CD pipeline using GitHub Actions.
* Dockerized deployment with Flask, PostgreSQL, and Nginx.

## Tech Stack

| Category         | Technologies                                                                                 |
| ---------------- | -------------------------------------------------------------------------------------------- |
| Backend          | Python 3.12, Flask 3.0, SQLAlchemy, Flask-Migrate, Flask-JWT-Extended, Marshmallow, Werkzeug |
| Database         | PostgreSQL 18, Alembic Migrations                                                            |
| Machine Learning | scikit-learn, pandas, numpy, Random Forest                                                   |
| Frontend         | React 18, Vite, Tailwind CSS, Recharts, React Router v6, Axios                               |
| DevOps           | Docker, Docker Compose, GitHub Actions, Railway, Vercel, Nginx                               |
| Testing          | pytest, pytest-flask, SQLite in-memory testing                                               |

## Quick Start

### Clone Repository

```bash
git clone https://github.com/YOUR_USERNAME/football-analytics
cd football-analytics
```

### Environment Setup

```bash
cp .env.docker .env.local
```

Update the following values:

```env
DB_PASSWORD=
SECRET_KEY=
JWT_SECRET_KEY=
```

### Start Services

```bash
docker-compose --env-file .env.docker up --build -d
```

### Run Migrations, Seed Data, and Train Model

```bash
docker exec football_backend flask --app run db upgrade

docker exec football_backend python -m etl.seed

docker exec football_backend python -m ml.train
```

### Open Application

```bash
http://localhost:3000
```

## API Endpoints

### Teams

| Method | Endpoint                         | Description                      |
| ------ | -------------------------------- | -------------------------------- |
| GET    | `/api/teams/`                    | Paginated team list with filters |
| GET    | `/api/teams/<id>/stats`          | Team statistics                  |
| GET    | `/api/teams/head-to-head`        | Historical head-to-head records  |
| GET    | `/api/teams/tournament-averages` | Tournament performance averages  |

### Players

| Method | Endpoint                      | Description           |
| ------ | ----------------------------- | --------------------- |
| GET    | `/api/players/top-scorers`    | World Cup top scorers |
| GET    | `/api/players/penalty-takers` | Ranked penalty takers |
| GET    | `/api/players/keepers`        | Ranked goalkeepers    |

### Predictions

| Method | Endpoint             | Description                |
| ------ | -------------------- | -------------------------- |
| POST   | `/api/predict/match` | Match outcome prediction   |
| GET    | `/api/predict/info`  | Model metadata and metrics |

### Penalty Simulator

| Method | Endpoint                | Description                    |
| ------ | ----------------------- | ------------------------------ |
| POST   | `/api/penalty/simulate` | Single penalty simulation      |
| POST   | `/api/penalty/shootout` | Multi-kick shootout            |
| GET    | `/api/penalty/players`  | Available shooters and keepers |

### Authentication

| Method | Endpoint             | Description              |
| ------ | -------------------- | ------------------------ |
| POST   | `/api/auth/register` | Create account           |
| POST   | `/api/auth/login`    | Login and receive JWT    |
| GET    | `/api/auth/me`       | Current user information |

### System

| Method | Endpoint  | Description  |
| ------ | --------- | ------------ |
| GET    | `/health` | Health check |

**Protected Endpoints:** Require

```http
Authorization: Bearer <token>
```

## Database Schema

The application uses 5 normalized tables with foreign key constraints.

### Key Design Decisions

* `matches` contains two foreign keys (`team_a_id`, `team_b_id`) referencing the teams table.
* `match_stats` stores one row per team per match.
* `predictions` maintains a one-to-one relationship with matches.
* `penalty_skill` and `save_skill` are derived during the ETL process.

## ML Model Details

| Property           | Value                                                    |
| ------------------ | -------------------------------------------------------- |
| Algorithm          | Random Forest Classifier                                 |
| Training Data      | 852 FIFA World Cup matches (1930–2014)                   |
| Train/Test Split   | 681 Train / 171 Test (80/20)                             |
| Features           | 10 engineered features                                   |
| Test Accuracy      | 62.0%                                                    |
| Baseline Accuracy  | 47.0%                                                    |
| Cross Validation   | 58.2% ± 4.5%                                             |
| Leakage Prevention | Leave-one-out feature generation                         |
| Class Weights      | Balanced                                                 |
| Hyperparameters    | `n_estimators=200`, `max_depth=8`, `min_samples_split=5` |

## Project Structure

```text
football-analytics/
│
├── api/                    # Flask application
├── ml/                     # ML pipeline and model training
├── etl/                    # Data ingestion and transformation
├── tests/                  # Pytest test suite
├── frontend/               # React application
├── data/                   # FIFA World Cup datasets
├── .github/workflows/      # GitHub Actions
│
├── Dockerfile
├── docker-compose.yml
└── README.md
```
