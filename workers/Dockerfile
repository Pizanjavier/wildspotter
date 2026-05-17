FROM python:3.12-slim
RUN apt-get update && apt-get install -y libgdal-dev osm2pgsql ca-certificates && \
    update-ca-certificates && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt && \
    playwright install --with-deps chromium
COPY . .
CMD ["tail", "-f", "/dev/null"]
