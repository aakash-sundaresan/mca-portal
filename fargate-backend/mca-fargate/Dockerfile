# Use standard Python image for Fargate (not Lambda)
FROM python:3.11-slim

# Install system dependencies needed for building Python packages
RUN apt-get update && apt-get install -y \
    gcc \
    g++ \
    make \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy requirements first for better caching
COPY requirements.txt .

# Upgrade pip first
RUN pip install --upgrade pip

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy the entire application structure
COPY . .

# Set Python path to include the app directory
ENV PYTHONPATH=/app:$PYTHONPATH

# Set default environment variables
ENV AWS_REGION=us-east-2
ENV AWS_DEFAULT_REGION=us-east-2
ENV BUCKET_NAME=mca-filing-bucket

# Default command - can be overridden
CMD ["python", "main.py"]