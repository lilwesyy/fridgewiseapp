#!/bin/bash

echo "🚀 Starting FridgeWise Docker Services..."

# Check if docker and docker-compose are installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

# Start MongoDB service
echo "📦 Starting MongoDB container..."
docker-compose up -d mongodb

# Wait for MongoDB to be ready
echo "⏳ Waiting for MongoDB to start..."
sleep 10

# Check if MongoDB is ready
until docker exec fridgewise-mongodb mongosh --eval "db.adminCommand('ping')" --quiet; do
    echo "⏳ MongoDB is not ready yet. Waiting..."
    sleep 2
done

echo "✅ MongoDB is ready!"

# Start the recognition API service
echo "🔍 Starting Recognition API service..."
docker-compose up -d recognize-api

echo "✅ All Docker services are running!"
echo ""
echo "📋 Services Status:"
echo "   - MongoDB: http://localhost:27017"
echo "   - Recognition API: http://localhost:8000"
echo ""
echo "🚀 You can now start your backend with: npm run start:backend"
echo "🛑 To stop all services: docker-compose down"