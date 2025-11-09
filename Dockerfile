# Stage 1: Build React frontend
FROM node:18-alpine AS frontend-builder

WORKDIR /app/frontend

COPY frontend/package*.json ./
RUN npm ci --only=production || npm install

COPY frontend/ ./
RUN npm run build

RUN ls -la dist/ && echo "✓ Frontend built successfully"

# Stage 2: Python backend with MongoDB
FROM python:3.11-slim

ENV DEBIAN_FRONTEND=noninteractive

RUN apt-get update && \
    apt-get install -y --no-install-recommends \
      tshark \
      tcpdump \
      ca-certificates \
      build-essential \
      libpcap0.8-dev \
      curl \
      && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY requirements.txt /app/requirements.txt
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r /app/requirements.txt

# Copy backend code (INCLUDING models_mongodb.py and new directories)
COPY app.py parser.py detectors.py ip_services.py report_generator.py models_mongodb.py ./

# Copy new directories (config, services, routes, utils)
COPY config/ ./config/
COPY services/ ./services/
COPY routes/ ./routes/
COPY utils/ ./utils/

# Copy built React frontend
COPY --from=frontend-builder /app/frontend/dist /app/static

# Create directories
RUN mkdir -p /app/uploads /app/static /app/pcap_captures && \
    chmod -R 755 /app/uploads /app/static /app/pcap_captures

# Verify
RUN ls -la /app/static && \
    test -f /app/static/index.html && echo "✓ Frontend found" || echo "⚠ Frontend missing"

ENV FLASK_APP=app.py
ENV FLASK_RUN_HOST=0.0.0.0
ENV FLASK_ENV=production
ENV FLASK_DEBUG=0
ENV TSHARK_PATH=/usr/bin/tshark
ENV PYTHONUNBUFFERED=1
ENV PORT=8000

EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:8000/health').read()" || exit 1

CMD ["python", "app.py"]
