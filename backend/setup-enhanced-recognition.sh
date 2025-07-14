#!/bin/bash

echo "🔧 Setting up Enhanced Recognition Service..."

# Check if .env exists
if [ ! -f .env ]; then
    echo "📝 Creating .env from example..."
    cp .env.example .env
    echo "⚠️  Please update .env with your actual API keys"
fi

# Check for required environment variables
echo "🔍 Checking environment variables..."

if grep -q "your-gemini-api-key-here" .env 2>/dev/null; then
    echo "❌ GEMINI_API_KEY not set in .env"
    echo "   Get your key from: https://makersuite.google.com/app/apikey"
else
    echo "✅ GEMINI_API_KEY configured"
fi

# Test the enhanced recognition service
echo "🧪 Testing Enhanced Recognition Service..."

cat > test-recognition.js << 'EOF'
const { EnhancedRecognizeService } = require('./dist/services/enhancedRecognizeService');
const path = require('path');

async function testRecognition() {
    try {
        const service = new EnhancedRecognizeService();
        
        console.log('🩺 Health Check...');
        const health = await service.healthCheck();
        console.log('Health Status:', health);
        
        // Test with a sample image if available
        const testImagePath = path.join(__dirname, 'temp', 'test-image.jpg');
        if (require('fs').existsSync(testImagePath)) {
            console.log('🔍 Testing with sample image...');
            const results = await service.analyzeImage(testImagePath);
            console.log('Recognition Results:', results);
        } else {
            console.log('ℹ️  No test image found. Place a test image at:', testImagePath);
        }
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
    }
}

testRecognition();
EOF

# Build TypeScript if needed
if [ ! -d "dist" ]; then
    echo "🔨 Building TypeScript..."
    npm run build
fi

echo "✅ Setup complete!"
echo ""
echo "📋 Next steps:"
echo "1. Update .env with your GEMINI_API_KEY"
echo "2. Run: node test-recognition.js"
echo "3. Test with actual images in your app"
echo ""
echo "🔧 Configuration tips:"
echo "- Gemini Vision API: Best overall accuracy"
echo "- Legacy API: Fallback when Gemini fails"
echo "- Smart fallback: Uses filename analysis when all APIs fail"
