const { MongoClient } = require('mongodb');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/fridgewiseai';

async function createIndexSafely(collection, indexSpec, options, description) {
  try {
    await collection.createIndex(indexSpec, options);
    console.log(`✓ ${description}`);
  } catch (error) {
    if (error.code === 85) { // IndexOptionsConflict
      console.log(`⚠️  ${description} - Index already exists with different options`);
    } else {
      console.log(`❌ ${description} - Error: ${error.message}`);
    }
  }
}

async function optimizeDatabase() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    
    const db = client.db();
    
    // Create optimized indexes for recipes collection
    console.log('Creating indexes for recipes collection...');
    
    // Index for rating-based queries (featured/top recipes)
    await createIndexSafely(
      db.collection('recipes'),
      { "averageRating": -1, "totalRatings": -1 },
      { name: "rating_optimization_idx" },
      "Created rating optimization index"
    );
    
    // Index for recent public recipes
    await createIndexSafely(
      db.collection('recipes'),
      { "createdAt": -1, "isPublic": 1 },
      { name: "recent_public_idx" },
      "Created recent public recipes index"
    );
    
    // Check existing user saved recipes index and skip if similar exists
    const existingIndexes = await db.collection('recipes').listIndexes().toArray();
    const hasUserSavedIndex = existingIndexes.some(idx => 
      JSON.stringify(idx.key) === JSON.stringify({ "userId": 1, "isSaved": 1, "createdAt": -1 })
    );
    
    if (!hasUserSavedIndex) {
      await createIndexSafely(
        db.collection('recipes'),
        { "userId": 1, "isSaved": 1, "createdAt": -1 },
        { name: "user_saved_recipes_idx" },
        "Created user saved recipes index"
      );
    } else {
      console.log('⚠️  User saved recipes index already exists - skipping');
    }
    
    // Create TTL index for analyses collection (auto-delete after 30 days)
    console.log('Creating TTL index for analyses collection...');
    await createIndexSafely(
      db.collection('analyses'),
      { "createdAt": 1 },
      { 
        expireAfterSeconds: 2592000, // 30 days
        name: "analyses_ttl_idx"
      },
      "Created TTL index for analyses (30 days expiration)"
    );
    
    // Additional performance indexes
    console.log('Creating additional performance indexes...');
    
    // User lookup optimization
    await createIndexSafely(
      db.collection('users'),
      { "email": 1 },
      { 
        unique: true,
        name: "email_unique_idx"
      },
      "Created unique email index"
    );
    
    // Daily usage queries optimization
    await createIndexSafely(
      db.collection('dailyusages'),
      { "userId": 1, "date": -1 },
      { name: "user_daily_usage_idx" },
      "Created daily usage optimization index"
    );
    
    // Recipe search optimization
    await createIndexSafely(
      db.collection('recipes'),
      { "dietaryTags": 1, "language": 1, "createdAt": -1 },
      { name: "recipe_search_idx" },
      "Created recipe search optimization index"
    );
    
    // List all indexes
    console.log('\n=== Current Indexes ===');
    
    const collections = ['recipes', 'analyses', 'users', 'dailyusages'];
    
    for (const collectionName of collections) {
      console.log(`\n${collectionName.toUpperCase()} collection indexes:`);
      const indexes = await db.collection(collectionName).listIndexes().toArray();
      indexes.forEach(index => {
        console.log(`  - ${index.name}: ${JSON.stringify(index.key)}`);
        if (index.expireAfterSeconds) {
          console.log(`    TTL: ${index.expireAfterSeconds}s (${Math.floor(index.expireAfterSeconds / 86400)} days)`);
        }
      });
    }
    
    console.log('\n✅ Database optimization completed successfully!');
    
  } catch (error) {
    console.log('❌ Error optimizing database:', error);
    process.exit(1);
  } finally {
    await client.close();
  }
}

// Run optimization
optimizeDatabase();