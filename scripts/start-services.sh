#!/bin/bash

# Start FridgeWiseAI services

echo "🚀 Starting FridgeWiseAI services..."

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker first."
    exit 1
fi

# Check if GPU is available
if command -v nvidia-smi &> /dev/null; then
    echo "🔥 GPU detected, starting with GPU support..."
    docker-compose up -d mongodb recognize-api
else
    echo "💻 No GPU detected, starting with CPU-only version..."
    docker-compose --profile cpu up -d mongodb recognize-api-cpu
fi

# Wait for services to be ready
echo "⏳ Waiting for services to be ready..."
sleep 10

# Check service health
echo "🔍 Checking service health..."

# Check MongoDB
if docker exec fridgewiseai-mongodb mongosh --quiet --eval "db.runCommand('ping').ok" > /dev/null 2>&1; then
    echo "✅ MongoDB is ready"
else
    echo "❌ MongoDB is not ready"
fi

# Check Recognize API
if curl -s http://localhost:8000/health > /dev/null 2>&1; then
    echo "✅ Recognize API is ready"
elif curl -s http://localhost:8001/health > /dev/null 2>&1; then
    echo "✅ Recognize API (CPU) is ready"
else
    echo "❌ Recognize API is not ready"
fi

echo "🎉 Services started successfully!"
echo "📊 MongoDB: mongodb://localhost:27017/fridgewiseai"
echo "🔍 Recognize API: http://localhost:8000 (or 8001 for CPU)"
echo ""
echo "To stop services: docker-compose down"