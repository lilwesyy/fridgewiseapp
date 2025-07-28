const { createClient } = require('redis');

async function testRedis() {
  const client = createClient({
    url: 'redis://localhost:6379'
  });

  client.on('error', (err) => {
    console.error('Redis Client Error:', err);
  });

  try {
    await client.connect();
    console.log('✅ Connected to Redis successfully');

    // Test basic operations
    await client.set('test:key', 'Hello Redis!');
    const value = await client.get('test:key');
    console.log('✅ Set/Get test:', value);

    // Test JSON operations
    const testData = { message: 'Hello from FridgeWiseAI!', timestamp: new Date().toISOString() };
    await client.set('test:json', JSON.stringify(testData));
    const jsonValue = await client.get('test:json');
    console.log('✅ JSON test:', JSON.parse(jsonValue));

    // Test TTL
    await client.setEx('test:ttl', 5, 'This will expire in 5 seconds');
    const ttl = await client.ttl('test:ttl');
    console.log('✅ TTL test:', ttl, 'seconds remaining');

    // Clean up
    await client.del('test:key', 'test:json', 'test:ttl');
    console.log('✅ Cleanup completed');

    await client.disconnect();
    console.log('✅ Redis test completed successfully');
  } catch (error) {
    console.error('❌ Redis test failed:', error);
    process.exit(1);
  }
}

testRedis();