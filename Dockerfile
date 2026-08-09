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

COPY start.sh .
RUN chmod +x start.sh && chown appuser:appuser start.sh

USER appuser

EXPOSE 5000

ENV FLASK_ENV=production

CMD ["./start.sh"]
