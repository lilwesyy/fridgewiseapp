#!/bin/bash

echo "🚀 Deploying FridgeWise Landing Page..."

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found. Run this script from frontend/web directory"
    exit 1
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm ci

# Run build
echo "🔨 Building application..."
npm run build

# Check build success
if [ $? -eq 0 ]; then
    echo "✅ Build successful!"
    
    # Deploy to Vercel
    echo "🌐 Deploying to Vercel..."
    npx vercel --prod
    
    echo "🎉 Deployment complete!"
    echo "🔗 Your site is live at: https://fridgewise.vercel.app"
else
    echo "❌ Build failed. Please fix errors and try again."
    exit 1
fi