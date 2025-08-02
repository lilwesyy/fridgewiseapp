#!/bin/bash

# Configurazione
SERVER_USER="mirco"
SERVER_HOST="fridgewiseai.com"
IMAGE_NAME="fridgewiseai-mongo"

echo "🐳 Deploying FridgeWiseAI MongoDB with Docker..."

# Build Docker image
echo "🔨 Building MongoDB Docker image..."
if ! docker build -f Dockerfile.mongo -t $IMAGE_NAME .; then
    echo "❌ Docker build failed!"
    exit 1
fi

# Save image to tar
echo "📦 Saving MongoDB Docker image..."
docker save $IMAGE_NAME | gzip > fridgewiseai-mongo.tar.gz

# Upload to server
echo "📤 Uploading to server..."
scp fridgewiseai-mongo.tar.gz $SERVER_USER@$SERVER_HOST:/tmp/

# Deploy on server
echo "🚀 Deploying MongoDB on server..."
ssh $SERVER_USER@$SERVER_HOST << EOF
    cd /tmp
    
    # Load Docker image
    docker load < fridgewiseai-mongo.tar.gz
    
    # Stop and remove old containers
    docker stop fridgewiseai-mongo 2>/dev/null || true
    docker rm fridgewiseai-mongo 2>/dev/null || true
    
    # Create network if it doesn't exist
    docker network create fridgewiseai_network 2>/dev/null || true
    
    # Create volume if it doesn't exist
    docker volume create mongo_data 2>/dev/null || true
    
    # Run MongoDB container
    docker run -d \
        --name fridgewiseai-mongo \
        --network fridgewiseai_network \
        --restart unless-stopped \
        -p 27017:27017 \
        -e MONGO_INITDB_ROOT_USERNAME=fridgewiseai \
        -e MONGO_INITDB_ROOT_PASSWORD="FridgeWiseAI_2025_Secure_MongoDB_Root_Password" \
        -e MONGO_INITDB_DATABASE=fridgewiseai \
        -v mongo_data:/data/db \
        $IMAGE_NAME
    
    # Wait for MongoDB to start
    echo "⏳ Waiting for MongoDB to start..."
    sleep 30
    
    # Clean up
    rm fridgewiseai-mongo.tar.gz
    docker image prune -f
    
    echo "✅ MongoDB container deployed successfully!"
    echo "📊 Container status:"
    docker ps | grep fridgewiseai-mongo
    
    echo "🔍 Testing MongoDB connection..."
    docker exec fridgewiseai-mongo mongosh --eval "db.adminCommand('ping')" || echo "❌ MongoDB connection test failed"
EOF

# Clean up local files
rm fridgewiseai-mongo.tar.gz

echo "🎉 FridgeWiseAI MongoDB deployed with Docker!"
echo "🔗 MongoDB: fridgewiseai.com:27017"