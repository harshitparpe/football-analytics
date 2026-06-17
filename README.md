# FIFA World Cup Analytics Platform

> Full-stack sports analytics platform featuring machine learning match prediction, an object-oriented penalty shootout simulator, World Cup 2026 prediction tracking, and interactive football analytics dashboards. Built over 21 days to strengthen software engineering fundamentals and demonstrate full-stack, machine learning, and DevOps capabilities.

## Badges

![Python](https://img.shields.io/badge/Python-3.12-blue)
![Flask](https://img.shields.io/badge/Flask-3.0-black)
![React](https://img.shields.io/badge/React-18-61dafb)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-18-336791)
![Docker](https://img.shields.io/badge/Docker-Containerized-2496ED)
![Machine Learning](https://img.shields.io/badge/Machine-Learning-green)

## Links

[Live Demo](https://football-analytics-s3kk.vercel.app) ·
[Backend API](https://football-analytics-production-7564.up.railway.app) ·
[GitHub Repository]([https://github.com/YOUR_USERNAME/football-analytics](https://github.com/harshitparpe/football-analytics)

## Features

* Machine learning match outcome prediction using a Random Forest classifier trained on 964 FIFA World Cup matches.
* OOP-based penalty shootout simulator featuring 7,000+ players from 23 World Cups.
* World Cup 2026 prediction tracker with automated fixture prediction and accuracy monitoring.
* Interactive football analytics dashboard with standings, top scorers, and tournament trends.
* Team performance analytics including win/draw/loss records and head-to-head statistics.
* JWT authentication with bcrypt password hashing and email DNS validation.
* 21 REST API endpoints across 5 Flask Blueprints.
* PostgreSQL-backed relational database with normalized schema design.
* Automated testing suite with 25 pytest test cases.
* CI/CD pipeline using GitHub Actions.
* Dockerized deployment with Flask, PostgreSQL, and Nginx.

## Project Metrics

| Metric              | Value  |
| ------------------- | ------ |
| Historical Matches  | 964    |
| Nations Covered     | 85+    |
| World Cups Included | 23     |
| Player Records      | 7,000+ |
| REST API Endpoints  | 21     |
| Automated Tests     | 25     |
| ML Test Accuracy    | 62%    |

## Tech Stack

| Category         | Technologies                                                   |
| ---------------- | -------------------------------------------------------------- |
| Backend          | Python 3.12, Flask 3.0, SQLAlchemy, Marshmallow                |
| Database         | PostgreSQL 18, Alembic Migrations                              |
| Authentication   | JWT, Bcrypt, Email Validation                                  |
| Machine Learning | scikit-learn, pandas, numpy                                    |
| Frontend         | React 18, Vite, Tailwind CSS, Recharts, Axios                  |
| DevOps           | Docker, Docker Compose, GitHub Actions, Railway, Vercel, Nginx |
| Testing          | pytest, pytest-flask, SQLite In-Memory Testing                 |
| Data Sources     | Kaggle FIFA World Cup Dataset, Curated 2022 Data               |

## Architecture

The platform follows a modular full-stack architecture separating analytics, prediction services, simulation logic, authentication, and presentation layers.

### Analytics Layer

* Historical World Cup statistics
* Team performance analysis
* Head-to-head records
* Tournament trend visualization

### Machine Learning Layer

* Match outcome prediction
* Feature engineering pipeline
* Model evaluation and validation
* Prediction confidence scoring

### Simulation Layer

* Object-oriented penalty engine
* Player skill-based outcomes
* Shootout sequence generation
* Match-deciding simulation workflows

### Authentication Layer

* JWT-based authentication
* Secure user registration and login
* Email domain validation
* Protected API endpoints

### World Cup 2026 Layer

* Fixture management
* Knockout bracket tracking
* Prediction accuracy monitoring
* Actual result comparison

## Core Modules

### Match Prediction Engine

Random Forest model trained on historical FIFA World Cup data using engineered performance metrics and leakage-prevention techniques.

### Penalty Shootout Simulator

Object-oriented simulation engine featuring:

* Shooter class
* Keeper class
* PenaltyEngine class
* PenaltyOutcome class

Supports thousands of historical and modern players with realistic skill-based outcomes.

### World Cup 2026 Tracker

Tracks:

* Group stage predictions
* Knockout stage progression
* Predicted vs actual outcomes
* Live prediction accuracy

### Football Analytics Dashboard

Provides:

* Team standings
* Top scorer leaderboards
* Goals-per-tournament trends
* Team performance analytics
* Historical match exploration

## Database Schema

#### Teams: Stores national team information, rankings, confederations, and World Cup participation history.
#### Players: Contains player profiles, appearances, goals, penalty ratings, and goalkeeper save ratings.
#### Matches: Historical World Cup fixtures with scores, stages, and outcomes.
#### Match Statistics: Detailed performance metrics including possession, shots, expected goals, corners, and fouls.
#### Predictions: Stores machine learning predictions and model outputs.
#### WC2026 Fixtures: Manages tournament fixtures, predictions, and actual result tracking.

## Machine Learning Model

| Property           | Value                             |
| ------------------ | --------------------------------- |
| Algorithm          | Random Forest Classifier          |
| Training Data      | 964 FIFA World Cup Matches        |
| Train/Test Split   | 772 Train / 192 Test              |
| Features           | 10 Engineered Features            |
| Test Accuracy      | 62%                               |
| Baseline Accuracy  | 47%                               |
| Cross Validation   | 58.2% ± 4.5%                      |
| Class Weighting    | Balanced                          |
| Leakage Prevention | Leave-One-Out Feature Engineering |

### Key Features Used

* Win Percentage
* Goals For Average
* Goals Against Average
* Average xG
* World Cup Experience
* Historical Performance Metrics

## API Endpoints

### Teams

| Method | Endpoint                         | Description                      |
| ------ | -------------------------------- | -------------------------------- |
| GET    | `/api/teams/`                    | Team listing and search          |
| GET    | `/api/teams/<id>/stats`          | Team performance statistics      |
| GET    | `/api/teams/head-to-head`        | Historical head-to-head analysis |
| GET    | `/api/teams/tournament-averages` | Tournament metrics               |

### Players

| Method | Endpoint                      | Description             |
| ------ | ----------------------------- | ----------------------- |
| GET    | `/api/players/top-scorers`    | Top scorers leaderboard |
| GET    | `/api/players/penalty-takers` | Ranked penalty takers   |
| GET    | `/api/players/keepers`        | Ranked goalkeepers      |

### Predictions

| Method | Endpoint             | Description                   |
| ------ | -------------------- | ----------------------------- |
| POST   | `/api/predict/match` | Match outcome prediction      |
| GET    | `/api/predict/info`  | Model information and metrics |

### Penalty Simulator

| Method | Endpoint                | Description               |
| ------ | ----------------------- | ------------------------- |
| POST   | `/api/penalty/simulate` | Single penalty simulation |
| POST   | `/api/penalty/shootout` | Full shootout simulation  |
| GET    | `/api/penalty/players`  | Available players         |

### World Cup 2026

| Method | Endpoint                     | Description                    |
| ------ | ---------------------------- | ------------------------------ |
| GET    | `/api/wc2026/fixtures`       | Tournament fixtures            |
| GET    | `/api/wc2026/standings`      | Group standings                |
| GET    | `/api/wc2026/summary`        | Prediction performance summary |
| POST   | `/api/wc2026/result`         | Record actual results          |
| POST   | `/api/wc2026/knockout-teams` | Configure knockout bracket     |

### Authentication

| Method | Endpoint             | Description              |
| ------ | -------------------- | ------------------------ |
| POST   | `/api/auth/register` | User registration        |
| POST   | `/api/auth/login`    | User authentication      |
| GET    | `/api/auth/me`       | Current user information |

### System

| Method | Endpoint  | Description  |
| ------ | --------- | ------------ |
| GET    | `/health` | Health check |

## Security Features

### Authentication

* JWT-based authorization
* Secure password hashing with bcrypt
* Email domain validation
* Protected routes

### API Security

* Token validation
* Request validation with Marshmallow
* Input sanitization
* Role-based endpoint protection

## Project Structure

```text
football-analytics/
│
├── api/
│   ├── blueprints/
│   ├── models/
│   ├── services/
│   ├── schemas/
│   └── app.py
│
├── ml/
│   ├── training/
│   ├── features/
│   └── model.pkl
│
├── etl/
│
├── frontend/
│   ├── src/
│   ├── components/
│   ├── pages/
│   └── services/
│
├── tests/
│
├── data/
│
├── .github/workflows/
│
├── Dockerfile
├── docker-compose.yml
└── README.md
```

## Quick Start

### Clone Repository

```bash
git clone https://github.com/YOUR_USERNAME/football-analytics
cd football-analytics
```

### Configure Environment

```bash
cp .env.docker .env.local
```

Update:

```env
DB_PASSWORD=
SECRET_KEY=
JWT_SECRET_KEY=
```

### Start Services

```bash
docker-compose --env-file .env.docker up --build -d
```

### Initialize Database and Train Model

```bash
docker exec football_backend flask --app run db upgrade

docker exec football_backend python -m etl.seed

docker exec football_backend python -m ml.train

docker exec football_backend python -m etl.seed_wc2026
```

### Access Application

```text
http://localhost:3000
```

## Future Enhancements

* Live FIFA API integrations
* Advanced xG and player performance models
* Tournament simulation engine
* Real-time match prediction updates
* Historical player comparison tools
* International football analytics expansion

## Key Learnings

* Full-stack application architecture
* Machine learning model deployment
* REST API development
* Relational database design
* Docker containerization
* CI/CD automation with GitHub Actions
* Software testing and quality assurance

## Author

**Harshit Parpe**

Information Technology Undergraduate, Delhi Technological University

Software Engineering • Machine Learning • Data Analytics
