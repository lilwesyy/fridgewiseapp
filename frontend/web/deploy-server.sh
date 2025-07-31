#!/bin/bash

# Configurazione
SERVER_USER="mirco"
SERVER_HOST="fridgewiseai.com"
SERVER_PATH="/var/www/fridgewise"
PM2_APP_NAME="fridgewise-landing"

echo "🚀 Deploying FridgeWise to your server..."

# Build locally
echo "🔨 Building application..."
npm ci
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Build failed!"
    exit 1
fi

# Create deployment package
echo "📦 Creating deployment package..."
tar -czf fridgewise-landing.tar.gz \
    .next \
    public \
    package.json \
    package-lock.json \
    next.config.ts

# Upload to server
echo "📤 Uploading to server..."
scp fridgewise-landing.tar.gz $SERVER_USER@$SERVER_HOST:/tmp/

# Deploy on server
echo "🔧 Deploying on server..."
ssh $SERVER_USER@$SERVER_HOST << 'EOF'
    cd /tmp
    
    # Backup current version
    if [ -d "/var/www/fridgewise" ]; then
        sudo mv /var/www/fridgewise /var/www/fridgewise-backup-$(date +%Y%m%d-%H%M%S)
    fi
    
    # Create new directory
    sudo mkdir -p /var/www/fridgewise
    sudo tar -xzf fridgewise-landing.tar.gz -C /var/www/fridgewise
    
    # Set permissions
    sudo chown -R www-data:www-data /var/www/fridgewise
    
    # Install dependencies
    cd /var/www/fridgewise
    sudo -u www-data npm ci --production
    
    # Restart with PM2
    pm2 delete fridgewise-landing 2>/dev/null || true
    pm2 start npm --name "fridgewise-landing" -- start
    pm2 save
    
    # Clean up
    rm /tmp/fridgewise-landing.tar.gz
    
    echo "✅ Deployment complete!"
EOF

# Clean up local files
rm fridgewise-landing.tar.gz

echo "🎉 FridgeWise landing page deployed successfully!"
echo "🔗 Check your site at: https://your-domain.com"