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
    docker stop fridgewiseai-mongo-express 2>/dev/null || true
    docker rm fridgewiseai-mongo-express 2>/dev/null || true
    
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
        -e MONGO_INITDB_ROOT_PASSWORD="FridgeWiseAI_2025_Secure_MongoDB_Root_P@ssw0rd!" \
        -e MONGO_INITDB_DATABASE=fridgewiseai \
        -v mongo_data:/data/db \
        $IMAGE_NAME
    
    # Wait for MongoDB to start
    echo "⏳ Waiting for MongoDB to start..."
    sleep 30
    
    # Run Mongo Express container
    docker run -d \
        --name fridgewiseai-mongo-express \
        --network fridgewiseai_network \
        --restart unless-stopped \
        -p 8081:8081 \
        -e ME_CONFIG_MONGODB_ADMINUSERNAME=fridgewiseai \
        -e ME_CONFIG_MONGODB_ADMINPASSWORD="FridgeWiseAI_2025_Secure_MongoDB_Root_P@ssw0rd!" \
        -e ME_CONFIG_MONGODB_URL="mongodb://fridgewiseai:FridgeWiseAI_2025_Secure_MongoDB_Root_P@ssw0rd!@fridgewiseai-mongo:27017/" \
        -e ME_CONFIG_BASICAUTH_USERNAME=admin \
        -e ME_CONFIG_BASICAUTH_PASSWORD="FridgeWiseAI_MongoExpress_Admin_2025!" \
        -e ME_CONFIG_MONGODB_SERVER=fridgewiseai-mongo \
        mongo-express:1.0.2
    
    # Clean up
    rm fridgewiseai-mongo.tar.gz
    docker image prune -f
    
    echo "✅ MongoDB containers deployed successfully!"
    echo "📊 Container status:"
    docker ps | grep fridgewiseai
    
    echo "🔍 Testing MongoDB connection..."
    docker exec fridgewiseai-mongo mongosh --eval "db.adminCommand('ping')" || echo "❌ MongoDB connection test failed"
EOF

# Clean up local files
rm fridgewiseai-mongo.tar.gz

echo "🎉 FridgeWiseAI MongoDB deployed with Docker!"
echo "🔗 MongoDB: fridgewiseai.com:27017"
echo "🌐 Mongo Express: http://fridgewiseai.com:8081"
echo "👤 Mongo Express login: admin / FridgeWiseAI_MongoExpress_Admin_2025!"