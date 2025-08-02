#!/bin/bash

# Configurazione
SERVER_USER="mirco"
SERVER_HOST="fridgewiseai.com"
REDIS_PASSWORD="FridgeWiseAI_2025_Redis_Cache_Password"

echo "🔴 Deploying FridgeWiseAI Redis with Docker..."

# Deploy Redis on server directly (no custom image needed)
echo "🚀 Deploying Redis on server..."
ssh $SERVER_USER@$SERVER_HOST << EOF
    # Stop and remove old Redis container
    docker stop fridgewiseai-redis 2>/dev/null || true
    docker rm fridgewiseai-redis 2>/dev/null || true
    
    # Create network if it doesn't exist
    docker network create fridgewiseai_network 2>/dev/null || true
    
    # Create volume if it doesn't exist
    docker volume create redis_data 2>/dev/null || true
    
    # Run Redis container with authentication
    docker run -d \
        --name fridgewiseai-redis \
        --network fridgewiseai_network \
        --restart unless-stopped \
        -p 6379:6379 \
        -v redis_data:/data \
        --sysctl net.core.somaxconn=1024 \
        redis:7.2-alpine \
        redis-server \
        --requirepass "$REDIS_PASSWORD" \
        --appendonly yes \
        --appendfsync everysec \
        --maxmemory 256mb \
        --maxmemory-policy allkeys-lru
    
    # Wait for Redis to start
    echo "⏳ Waiting for Redis to start..."
    sleep 10
    
    echo "✅ Redis container deployed successfully!"
    echo "📊 Container status:"
    docker ps | grep fridgewiseai-redis
    
    echo "🔍 Testing Redis connection..."
    docker exec fridgewiseai-redis redis-cli -a "$REDIS_PASSWORD" ping || echo "❌ Redis connection test failed"
    
    echo "📈 Redis info:"
    docker exec fridgewiseai-redis redis-cli -a "$REDIS_PASSWORD" info server | head -5
EOF

echo "🎉 FridgeWiseAI Redis deployed with Docker!"
echo "🔗 Redis: fridgewiseai.com:6379"
echo "🔑 Password: $REDIS_PASSWORD"