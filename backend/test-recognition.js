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
