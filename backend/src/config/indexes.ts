import mongoose from 'mongoose';

interface IndexDefinition {
  collection: string;
  index: any;
  options?: any;
  description: string;
}

// Definizione di tutti gli indici ottimizzati per l'app
export const requiredIndexes: IndexDefinition[] = [
  // Recipe collection indexes
  {
    collection: 'recipes',
    index: { userId: 1, createdAt: -1 },
    description: 'User recipes by date'
  },
  {
    collection: 'recipes',
    index: { userId: 1, isSaved: 1, isDeleted: 1 },
    description: 'User saved recipes (exclude deleted)'
  },
  {
    collection: 'recipes',
    index: { userId: 1, isDeleted: 1 },
    description: 'User recipes by deletion status'
  },
  {
    collection: 'recipes',
    index: { userId: 1, completionCount: 1, cookedAt: -1 },
    description: 'User cooked recipes history'
  },
  {
    collection: 'recipes',
    index: { averageRating: -1, totalRatings: -1 },
    description: 'Top rated recipes'
  },
  {
    collection: 'recipes',
    index: { createdAt: -1, isPublic: 1 },
    description: 'Recent public recipes'
  },
  {
    collection: 'recipes',
    index: { dietaryTags: 1, language: 1, createdAt: -1 },
    description: 'Recipe search optimization'
  },
  {
    collection: 'recipes',
    index: { dietaryTags: 1 },
    description: 'Dietary tags lookup'
  },
  {
    collection: 'recipes',
    index: { language: 1 },
    description: 'Language filtering'
  },

  // Analysis collection indexes
  {
    collection: 'analyses',
    index: { userId: 1, createdAt: -1 },
    description: 'User analysis history'
  },
  {
    collection: 'analyses',
    index: { status: 1 },
    description: 'Analysis status lookup'
  },
  {
    collection: 'analyses',
    index: { createdAt: 1 },
    options: { expireAfterSeconds: 2592000 }, // 30 days TTL
    description: 'Auto-delete old analyses'
  },

  // User collection indexes
  {
    collection: 'users',
    index: { email: 1 },
    options: { unique: true },
    description: 'Unique email constraint'
  },
  {
    collection: 'users',
    index: { resetPasswordToken: 1 },
    options: { sparse: true },
    description: 'Password reset lookup'
  },
  {
    collection: 'users',
    index: { emailVerificationToken: 1 },
    options: { sparse: true },
    description: 'Email verification lookup'
  },

  // Daily usage collection indexes
  {
    collection: 'dailyusages',
    index: { userId: 1, date: -1 },
    description: 'User daily usage queries'
  },
  {
    collection: 'dailyusages',
    index: { createdAt: 1 },
    options: { expireAfterSeconds: 2592000 }, // 30 days TTL
    description: 'Auto-delete old usage data'
  }
];

export async function ensureIndexes(): Promise<void> {
  let createdCount = 0;
  let skippedCount = 0;
  const newIndexes: string[] = [];
  
  for (const indexDef of requiredIndexes) {
    try {
      const collection = mongoose.connection.db?.collection(indexDef.collection);
      if (!collection) {
        continue;
      }

      // Check if index already exists
      const existingIndexes = await collection.listIndexes().toArray();
      const indexExists = existingIndexes.some(existing => 
        JSON.stringify(existing.key) === JSON.stringify(indexDef.index)
      );

      if (indexExists) {
        skippedCount++;
      } else {
        await collection.createIndex(indexDef.index, indexDef.options || {});
        newIndexes.push(indexDef.description);
        createdCount++;
      }
    } catch (error: any) {
      console.log(`❌ Failed to create index: ${indexDef.description} - ${error.message}`);
    }
  }
  
  if (createdCount > 0) {
    console.log(`✅ Created ${createdCount} new database indexes:`);
    newIndexes.forEach(desc => console.log(`   • ${desc}`));
  } else {
    console.log('✅ Database indexes verified');
  }
}

export async function dropAllIndexes(): Promise<void> {
  console.log('🗑️  Dropping all custom indexes...');
  
  const collections = ['recipes', 'analyses', 'users', 'dailyusages'];
  
  for (const collectionName of collections) {
    try {
      const collection = mongoose.connection.db?.collection(collectionName);
      if (!collection) continue;
      
      // Get all indexes except _id_
      const indexes = await collection.listIndexes().toArray();
      const customIndexes = indexes.filter(idx => idx.name !== '_id_');
      
      for (const index of customIndexes) {
        try {
          await collection.dropIndex(index.name);
          console.log(`✓ Dropped index: ${index.name} from ${collectionName}`);
        } catch (error: any) {
          console.log(`⚠️  Could not drop index ${index.name}: ${error.message}`);
        }
      }
    } catch (error: any) {
      console.log(`❌ Error processing collection ${collectionName}: ${error.message}`);
    }
  }
}