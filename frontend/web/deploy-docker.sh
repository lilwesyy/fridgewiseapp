#!/bin/bash

# Configurazione
SERVER_USER="mirco"
SERVER_HOST="fridgewiseai.com"
IMAGE_NAME="fridgewiseai-landing"

echo "🐳 Deploying FridgeWiseAI Landing Page with Docker..."

# Build Docker image
echo "🔨 Building Docker image..."
if ! docker build -t $IMAGE_NAME .; then
    echo "❌ Docker build failed!"
    exit 1
fi

# Save image to tar
echo "📦 Saving Docker image..."
docker save $IMAGE_NAME | gzip > fridgewiseai-landing.tar.gz

# Upload to server
echo "📤 Uploading to server..."
scp fridgewiseai-landing.tar.gz $SERVER_USER@$SERVER_HOST:/tmp/

# Deploy on server
echo "🚀 Deploying on server..."
ssh $SERVER_USER@$SERVER_HOST << EOF
    cd /tmp
    
    # Load Docker image
    docker load < fridgewiseai-landing.tar.gz
    
    # Stop and remove old containers (both old and new names)
    docker stop fridgewise-landing 2>/dev/null || true
    docker rm fridgewise-landing 2>/dev/null || true
    docker stop fridgewiseai-landing 2>/dev/null || true
    docker rm fridgewiseai-landing 2>/dev/null || true
    
    # Run new container
    docker run -d \
        --name fridgewiseai-landing \
        --restart unless-stopped \
        -p 3001:3000 \
        -e NODE_ENV=production \
        -e PORT=3000 \
        $IMAGE_NAME
    
    # Clean up
    rm fridgewiseai-landing.tar.gz
    docker image prune -f
    
    echo "✅ Container deployed successfully!"
    docker ps | grep fridgewiseai-landing
EOF

# Clean up local files
rm fridgewiseai-landing.tar.gz

echo "🎉 FridgeWiseAI landing page deployed with Docker!"
echo "🔗 Check your site at: https://fridgewiseai.com"