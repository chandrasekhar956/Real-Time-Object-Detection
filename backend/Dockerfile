# Use Python 3.11 slim-bookworm image as base (stable)
FROM python:3.11-slim-bookworm

WORKDIR /app

RUN apt-get update && apt-get install -y \
    libgl1 \
    libglib2.0-0 \
    libsm6 \
    libxext6 \
    libxrender-dev \
    libgomp1 \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

RUN mkdir -p uploads test weights

ENV EMAIL_SENDER=""
ENV EMAIL_PASSWORD=""
ENV EMAIL_RECEIVER=""
ENV ALERT_COOLDOWN_SEC=30
ENV VIDEO_SAMPLE_FRAMES=100

EXPOSE 5000
CMD ["python", "app.py"]
