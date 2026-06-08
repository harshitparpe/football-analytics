# ── Stage 1: build dependencies ───────────────────────────────────────────────
FROM python:3.12-slim AS builder

WORKDIR /app

# Install build deps for psycopg2
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc libpq-dev \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --user --no-cache-dir -r requirements.txt

# ── Stage 2: runtime ──────────────────────────────────────────────────────────
FROM python:3.12-slim

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    libpq5 \
    && rm -rf /var/lib/apt/lists/*

# Copy installed packages from builder
COPY --from=builder /root/.local /root/.local
ENV PATH=/root/.local/bin:$PATH

# Copy application code
COPY . .

# Don't run as root
RUN useradd -m appuser && chown -R appuser /app
USER appuser

EXPOSE 5000

# Use gunicorn in production, flask dev server in development
CMD ["python", "run.py"]