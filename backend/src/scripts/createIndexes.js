const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

// Create database indexes for performance optimization
const createIndexes = async () => {
  try {
    console.log('🔄 Creating database indexes...\n');

    // Get database collections
    const db = mongoose.connection.db;
    const users = db.collection('users');
    const recipes = db.collection('recipes');
    const analyses = db.collection('analyses');
    const dailyUsages = db.collection('dailyusages');

    // HIGH PRIORITY INDEXES

    console.log('📈 Creating high priority indexes...');

    // 1. Users Collection - Authentication optimizations
    console.log('  - Users: Password reset token lookup');
    await users.createIndex(
      { resetPasswordToken: 1, resetPasswordExpiry: 1 },
      { name: 'password_reset_lookup', background: true }
    );

    console.log('  - Users: Email verification token lookup');
    await users.createIndex(
      { emailVerificationToken: 1, emailVerificationExpiry: 1 },
      { name: 'email_verification_lookup', background: true }
    );

    console.log('  - Users: Email verification status');
    await users.createIndex(
      { email: 1, isEmailVerified: 1 },
      { name: 'email_verification_status', background: true }
    );

    // 2. Recipes Collection - Search and filtering optimizations
    console.log('  - Recipes: Full-text search index');
    await recipes.createIndex(
      { 
        title: "text", 
        description: "text", 
        originalIngredients: "text" 
      },
      { 
        name: 'recipe_search_text',
        background: true,
        weights: {
          title: 10,
          description: 5,
          originalIngredients: 3
        }
      }
    );

    console.log('  - Recipes: User difficulty filter');
    await recipes.createIndex(
      { userId: 1, difficulty: 1, createdAt: -1 },
      { name: 'user_difficulty_date', background: true }
    );

    console.log('  - Recipes: User recent updates');
    await recipes.createIndex(
      { userId: 1, updatedAt: -1 },
      { name: 'user_recent_updates', background: true }
    );

    console.log('  - Recipes: User saved recipes optimized');
    await recipes.createIndex(
      { userId: 1, isSaved: 1, createdAt: -1 },
      { name: 'user_saved_recipes_opt', background: true }
    );

    console.log('  - Recipes: User completion tracking');
    await recipes.createIndex(
      { userId: 1, cookedAt: 1 },
      { name: 'user_completion_tracking', background: true }
    );

    // 3. Analysis Collection - Statistics optimization
    console.log('  - Analysis: User status date filter');
    await analyses.createIndex(
      { userId: 1, status: 1, createdAt: -1 },
      { name: 'user_status_date', background: true }
    );

    console.log('✅ High priority indexes created!\n');

    // MEDIUM PRIORITY INDEXES

    console.log('📊 Creating medium priority indexes...');

    // 4. Additional Recipe indexes
    console.log('  - Recipes: User dietary tags filter');
    await recipes.createIndex(
      { userId: 1, dietaryTags: 1, createdAt: -1 },
      { name: 'user_dietary_date', background: true }
    );

    console.log('  - Recipes: User language filter');
    await recipes.createIndex(
      { userId: 1, language: 1, createdAt: -1 },
      { name: 'user_language_date', background: true }
    );

    console.log('  - Recipes: User completion count stats');
    await recipes.createIndex(
      { userId: 1, completionCount: 1 },
      { name: 'user_completion_count', background: true }
    );

    // 5. Analysis Collection - Ingredient analytics
    console.log('  - Analysis: User ingredient categories');
    await analyses.createIndex(
      { userId: 1, "ingredients.category": 1 },
      { name: 'user_ingredient_categories', background: true }
    );

    console.log('  - Analysis: User ingredient names');
    await analyses.createIndex(
      { userId: 1, "ingredients.name": 1 },
      { name: 'user_ingredient_names', background: true }
    );

    console.log('✅ Medium priority indexes created!\n');

    // LOW PRIORITY INDEXES (Analytics/Admin)

    console.log('📋 Creating low priority indexes...');

    // 6. System-wide analytics
    console.log('  - Users: Registration trends');
    await users.createIndex(
      { createdAt: 1 },
      { name: 'registration_trends', background: true }
    );

    console.log('  - Recipes: Creation trends');
    await recipes.createIndex(
      { createdAt: 1 },
      { name: 'recipe_creation_trends', background: true }
    );

    console.log('  - Analysis: Processing performance');
    await analyses.createIndex(
      { processingTime: 1, status: 1 },
      { name: 'processing_performance', background: true }
    );

    console.log('✅ Low priority indexes created!\n');

    // Display current indexes
    console.log('📋 Current database indexes:\n');

    const collections = ['users', 'recipes', 'analyses', 'dailyusages'];
    
    for (const collectionName of collections) {
      console.log(`📁 ${collectionName.toUpperCase()} Collection:`);
      const collection = db.collection(collectionName);
      const indexes = await collection.indexes();
      
      indexes.forEach(index => {
        const keys = Object.keys(index.key).map(key => {
          const direction = index.key[key];
          if (direction === 1) return `${key}:ASC`;
          if (direction === -1) return `${key}:DESC`;
          if (direction === 'text') return `${key}:TEXT`;
          return `${key}:${direction}`;
        }).join(', ');
        
        console.log(`  • ${index.name}: { ${keys} }`);
      });
      console.log('');
    }

    console.log('🎉 All indexes created successfully!');
    console.log('📈 Database performance should be significantly improved.');
    
  } catch (error) {
    console.error('❌ Error creating indexes:', error);
    throw error;
  }
};

// Main execution
const main = async () => {
  try {
    await connectDB();
    await createIndexes();
    console.log('\n✨ Index creation completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Script failed:', error);
    process.exit(1);
  }
};

// Handle script interruption
process.on('SIGINT', () => {
  console.log('\n🛑 Script interrupted');
  mongoose.connection.close();
  process.exit(0);
});

// Run the script
if (require.main === module) {
  main();
}

module.exports = { createIndexes };