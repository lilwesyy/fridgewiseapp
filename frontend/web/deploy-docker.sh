#!/bin/bash

# Configurazione
SERVER_USER="mirco"
SERVER_HOST="fridgewiseai.com"
IMAGE_NAME="fridgewise-landing"

echo "🐳 Deploying FridgeWiseAI Landing Page with Docker..."

# Build Docker image
echo "🔨 Building Docker image..."
if ! docker build -t $IMAGE_NAME .; then
    echo "❌ Docker build failed!"
    exit 1
fi

# Save image to tar
echo "📦 Saving Docker image..."
docker save $IMAGE_NAME | gzip > fridgewise-landing.tar.gz

# Upload to server
echo "📤 Uploading to server..."
scp fridgewise-landing.tar.gz $SERVER_USER@$SERVER_HOST:/tmp/

# Deploy on server
echo "🚀 Deploying on server..."
ssh $SERVER_USER@$SERVER_HOST << EOF
    cd /tmp
    
    # Load Docker image
    docker load < fridgewise-landing.tar.gz
    
    # Stop and remove old container
    docker stop fridgewise-landing 2>/dev/null || true
    docker rm fridgewise-landing 2>/dev/null || true
    
    # Run new container
    docker run -d \
        --name fridgewise-landing \
        --restart unless-stopped \
        -p 3000:3000 \
        -e NODE_ENV=production \
        $IMAGE_NAME
    
    # Clean up
    rm fridgewise-landing.tar.gz
    docker image prune -f
    
    echo "✅ Container deployed successfully!"
    docker ps | grep fridgewise-landing
EOF

# Clean up local files
rm fridgewise-landing.tar.gz

echo "🎉 FridgeWise landing page deployed with Docker!"
echo "🔗 Check your site at: https://fridgewiseai.com"