# Use Python 3.11 slim image as base
FROM python:3.11-slim

# Set working directory
WORKDIR /app

# Install minimal system dependencies required for OpenCV
RUN apt-get update && apt-get install -y \
    libglib2.0-0 \
    libgomp1 \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements file
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy application files
COPY . .

# Create necessary directories
RUN mkdir -p uploads test weights

# Environment variables (can be overridden at runtime)
ENV EMAIL_SENDER=""
ENV EMAIL_PASSWORD=""
ENV EMAIL_RECEIVER=""
ENV ALERT_COOLDOWN_SEC=30
ENV VIDEO_SAMPLE_FRAMES=100

# Expose port 5000
EXPOSE # Use Python 3.11 slim image as base
FROM python:3.11-slim

# Set working directory
WORKDIR /app

# Install system dependencies required for OpenCV and other libraries
RUN apt-get update && apt-get install -y \
    libglib2.0-0 \
    libsm6 \
    libxext6 \
    libxrender-dev \
    libgomp1 \
    libgl1-mesa-glx \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements file
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy application files
COPY . .

# Create necessary directories
RUN mkdir -p uploads test weights

# Environment variables (can be overridden at runtime)
ENV EMAIL_SENDER=""
ENV EMAIL_PASSWORD=""
ENV EMAIL_RECEIVER=""
ENV ALERT_COOLDOWN_SEC=30
ENV VIDEO_SAMPLE_FRAMES=100

# Expose port 5000
EXPOSE 5000

# Run the application
CMD ["python", "app.py"]


# Run the application
CMD ["python", "app.py"]
