import mongoose from 'mongoose';
import { Recipe } from '../models/Recipe';
import { config } from 'dotenv';

// Load environment variables
config();

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('❌ MONGODB_URI environment variable is required');
  process.exit(1);
}

async function migrateRecipeStatus() {
  try {
    console.log('🔄 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI!);
    console.log('✅ Connected to MongoDB');

    // Find recipes that should be public (have been cooked or have photos) but are still private
    const recipesToMigrate = await Recipe.find({
      isDeleted: false,
      status: { $in: ['private', null, undefined] }, // Include recipes without status field
      $or: [
        { dishPhotos: { $exists: true, $ne: [] } }, // Has photos
        { cookedAt: { $exists: true, $ne: null } }   // Has been cooked
      ]
    });

    console.log(`📊 Found ${recipesToMigrate.length} recipes to migrate`);

    if (recipesToMigrate.length === 0) {
      console.log('✅ No recipes need migration');
      process.exit(0);
    }

    // Ask for confirmation
    console.log('\n🚨 MIGRATION PLAN:');
    console.log(`   - ${recipesToMigrate.length} existing recipes will be marked as 'approved'`);
    console.log(`   - These recipes already have photos or have been cooked`);
    console.log(`   - They will become immediately visible in public recipes`);
    
    // For production safety, require manual confirmation
    if (process.env.NODE_ENV === 'production') {
      console.log('\n⚠️  This is a PRODUCTION environment!');
      console.log('   Please review the migration carefully before proceeding.');
      console.log('   Set CONFIRM_MIGRATION=true to proceed.');
      
      if (process.env.CONFIRM_MIGRATION !== 'true') {
        console.log('❌ Migration cancelled. Set CONFIRM_MIGRATION=true to proceed.');
        process.exit(1);
      }
    }

    console.log('\n🔄 Starting migration...');
    
    let migratedCount = 0;
    let errorCount = 0;

    for (const recipe of recipesToMigrate) {
      try {
        // Update the recipe status to approved
        recipe.status = 'approved';
        recipe.approvedAt = new Date();
        // Note: approvedBy is left undefined for system migration
        
        await recipe.save();
        migratedCount++;
        
        console.log(`✅ Migrated: ${recipe.title} (${recipe._id})`);
      } catch (error) {
        errorCount++;
        console.error(`❌ Failed to migrate recipe ${recipe._id}:`, error);
      }
    }

    console.log('\n📊 MIGRATION SUMMARY:');
    console.log(`   ✅ Successfully migrated: ${migratedCount} recipes`);
    console.log(`   ❌ Failed migrations: ${errorCount} recipes`);
    console.log(`   📈 Total processed: ${recipesToMigrate.length} recipes`);

    if (migratedCount > 0) {
      console.log('\n🎉 Migration completed successfully!');
      console.log('   All existing public recipes are now properly marked as approved.');
      console.log('   New recipes will require admin approval before becoming public.');
    }

  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

// Additional script to show statistics
async function showStatistics() {
  try {
    await mongoose.connect(MONGODB_URI!);
    
    const stats = await Recipe.aggregate([
      {
        $match: { isDeleted: false }
      },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    console.log('\n📊 CURRENT RECIPE STATUS DISTRIBUTION:');
    for (const stat of stats) {
      const status = stat._id || 'undefined';
      console.log(`   ${status}: ${stat.count} recipes`);
    }

    const publicRecipes = await Recipe.countDocuments({
      isDeleted: false,
      $or: [
        { dishPhotos: { $exists: true, $ne: [] } },
        { cookedAt: { $exists: true, $ne: null } }
      ]
    });

    const approvedRecipes = await Recipe.countDocuments({
      isDeleted: false,
      status: 'approved'
    });

    console.log(`\n📈 PUBLIC RECIPES ANALYSIS:`);
    console.log(`   Total recipes with photos/cooked: ${publicRecipes}`);
    console.log(`   Currently approved: ${approvedRecipes}`);
    console.log(`   Need migration: ${publicRecipes - approvedRecipes}`);

  } catch (error) {
    console.error('❌ Statistics query failed:', error);
  } finally {
    await mongoose.disconnect();
  }
}

// Main execution
async function main() {
  const command = process.argv[2];
  
  switch (command) {
    case 'stats':
      await showStatistics();
      break;
    case 'migrate':
      await migrateRecipeStatus();
      break;
    default:
      console.log('📋 RECIPE STATUS MIGRATION SCRIPT');
      console.log('');
      console.log('Usage:');
      console.log('  npm run migrate-recipe-status stats   - Show current statistics');
      console.log('  npm run migrate-recipe-status migrate - Run the migration');
      console.log('');
      console.log('Environment variables:');
      console.log('  MONGODB_URI - MongoDB connection string (required)');
      console.log('  CONFIRM_MIGRATION - Set to "true" to confirm production migration');
      break;
  }
}

main().catch(console.error);