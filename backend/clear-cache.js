const redis = require('redis');
require('dotenv').config();

async function clearCache() {
  try {
    const client = redis.createClient({ url: process.env.REDIS_URL });
    await client.connect();
    
    // Clear all public recipes cache keys
    const keys = await client.keys('public:recipes:*');
    console.log(`Found ${keys.length} cache keys:`, keys);
    
    if (keys.length > 0) {
      await client.del(...keys);
      console.log('✅ Cleared all public recipe cache keys');
    }
    
    await client.disconnect();
    console.log('✅ Cache cleared successfully');
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

clearCache();