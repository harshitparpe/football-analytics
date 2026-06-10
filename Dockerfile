FROM python:3.12-slim

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

RUN useradd -m appuser && chown -R appuser /app
USER appuser

EXPOSE 5000

# Set default environment variables for Railway
ENV FLASK_ENV=production
ENV DATABASE_URL=${DATABASE_URL:-sqlite:///app.db}
ENV SECRET_KEY=${SECRET_KEY:-change-me-in-production-32chars}
ENV JWT_SECRET_KEY=${JWT_SECRET_KEY:-change-jwt-secret-32chars-min}

CMD ["python", "run.py"]