const { MongoClient } = require('mongodb');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/fridgewiseai';

async function rebuildIndexes() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('🔌 Connected to MongoDB');
    
    const db = client.db();
    
    console.log('🗑️  Dropping all existing indexes (except _id)...');
    
    const collections = ['recipes', 'analyses', 'users', 'dailyusages'];
    
    // Drop all custom indexes
    for (const collectionName of collections) {
      try {
        const collection = db.collection(collectionName);
        const indexes = await collection.listIndexes().toArray();
        
        for (const index of indexes) {
          if (index.name !== '_id_') {
            try {
              await collection.dropIndex(index.name);
              console.log(`✓ Dropped ${index.name} from ${collectionName}`);
            } catch (error) {
              console.log(`⚠️  Could not drop ${index.name}: ${error.message}`);
            }
          }
        }
      } catch (error) {
        console.log(`⚠️  Collection ${collectionName} not found or error: ${error.message}`);
      }
    }
    
    console.log('\n🔨 Creating optimized indexes...');
    
    // Recipe indexes
    const recipeIndexes = [
      { key: { userId: 1, createdAt: -1 }, name: 'user_recipes_date' },
      { key: { userId: 1, isSaved: 1 }, name: 'user_saved_recipes' },
      { key: { averageRating: -1, totalRatings: -1 }, name: 'rating_optimization' },
      { key: { createdAt: -1, isPublic: 1 }, name: 'recent_public' },
      { key: { dietaryTags: 1, language: 1, createdAt: -1 }, name: 'recipe_search' },
      { key: { dietaryTags: 1 }, name: 'dietary_tags' },
      { key: { language: 1 }, name: 'language_filter' }
    ];
    
    for (const indexDef of recipeIndexes) {
      try {
        await db.collection('recipes').createIndex(indexDef.key, { name: indexDef.name });
        console.log(`✅ Created recipes.${indexDef.name}`);
      } catch (error) {
        console.log(`❌ Failed to create recipes.${indexDef.name}: ${error.message}`);
      }
    }
    
    // Analysis indexes
    const analysisIndexes = [
      { key: { userId: 1, createdAt: -1 }, name: 'user_analysis_history' },
      { key: { status: 1 }, name: 'analysis_status' },
      { key: { createdAt: 1 }, name: 'analysis_ttl', options: { expireAfterSeconds: 2592000 } }
    ];
    
    for (const indexDef of analysisIndexes) {
      try {
        await db.collection('analyses').createIndex(indexDef.key, { 
          name: indexDef.name,
          ...indexDef.options
        });
        console.log(`✅ Created analyses.${indexDef.name}`);
      } catch (error) {
        console.log(`❌ Failed to create analyses.${indexDef.name}: ${error.message}`);
      }
    }
    
    // User indexes
    const userIndexes = [
      { key: { email: 1 }, name: 'email_unique', options: { unique: true } },
      { key: { resetPasswordToken: 1 }, name: 'password_reset', options: { sparse: true } },
      { key: { emailVerificationToken: 1 }, name: 'email_verification', options: { sparse: true } }
    ];
    
    for (const indexDef of userIndexes) {
      try {
        await db.collection('users').createIndex(indexDef.key, { 
          name: indexDef.name,
          ...indexDef.options
        });
        console.log(`✅ Created users.${indexDef.name}`);
      } catch (error) {
        console.log(`❌ Failed to create users.${indexDef.name}: ${error.message}`);
      }
    }
    
    // Daily usage indexes
    const usageIndexes = [
      { key: { userId: 1, date: -1 }, name: 'user_daily_usage' },
      { key: { createdAt: 1 }, name: 'usage_ttl', options: { expireAfterSeconds: 2592000 } }
    ];
    
    for (const indexDef of usageIndexes) {
      try {
        await db.collection('dailyusages').createIndex(indexDef.key, { 
          name: indexDef.name,
          ...indexDef.options
        });
        console.log(`✅ Created dailyusages.${indexDef.name}`);
      } catch (error) {
        console.log(`❌ Failed to create dailyusages.${indexDef.name}: ${error.message}`);
      }
    }
    
    console.log('\n📊 Final index summary:');
    
    for (const collectionName of collections) {
      try {
        const collection = db.collection(collectionName);
        const indexes = await collection.listIndexes().toArray();
        console.log(`\n${collectionName.toUpperCase()}:`);
        indexes.forEach(index => {
          let info = `  - ${index.name}: ${JSON.stringify(index.key)}`;
          if (index.expireAfterSeconds) {
            info += ` (TTL: ${Math.floor(index.expireAfterSeconds / 86400)} days)`;
          }
          if (index.unique) {
            info += ' (UNIQUE)';
          }
          console.log(info);
        });
      } catch (error) {
        console.log(`⚠️  Could not list indexes for ${collectionName}`);
      }
    }
    
    console.log('\n✅ Database indexes rebuilt successfully!');
    console.log('🚀 New database is now optimized and ready to use.');
    
  } catch (error) {
    console.log('❌ Error rebuilding indexes:', error);
    process.exit(1);
  } finally {
    await client.close();
  }
}

rebuildIndexes();