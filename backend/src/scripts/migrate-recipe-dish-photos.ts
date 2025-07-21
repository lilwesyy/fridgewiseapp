import mongoose from 'mongoose';
import { Recipe } from '../models/Recipe';
import { connectDB } from '../config/database';

/**
 * Migration script to add dish photo fields to existing recipes
 * This script adds the new fields: dishPhoto, cookedAt, and completionCount
 * to all existing recipes in the database.
 */
async function migrateRecipeDishPhotos() {
  try {
    console.log('Starting Recipe dish photo migration...');
    
    // Connect to database
    await connectDB();
    console.log('Connected to database');

    // Find all recipes that don't have the new fields
    const recipesToUpdate = await Recipe.find({
      $or: [
        { completionCount: { $exists: false } },
        { completionCount: null }
      ]
    });

    console.log(`Found ${recipesToUpdate.length} recipes to update`);

    if (recipesToUpdate.length === 0) {
      console.log('No recipes need migration');
      return;
    }

    // Update recipes in batches to avoid memory issues
    const batchSize = 100;
    let updatedCount = 0;

    for (let i = 0; i < recipesToUpdate.length; i += batchSize) {
      const batch = recipesToUpdate.slice(i, i + batchSize);
      const batchIds = batch.map(recipe => recipe._id);

      // Update batch with default values for new fields
      const result = await Recipe.updateMany(
        { _id: { $in: batchIds } },
        {
          $set: {
            completionCount: 0
          },
          $unset: {
            // Remove any existing null values
            dishPhoto: "",
            cookedAt: ""
          }
        }
      );

      updatedCount += result.modifiedCount;
      console.log(`Updated batch ${Math.floor(i / batchSize) + 1}: ${result.modifiedCount} recipes`);
    }

    console.log(`Migration completed successfully! Updated ${updatedCount} recipes`);

    // Verify the migration
    const verificationCount = await Recipe.countDocuments({
      completionCount: { $exists: true, $gte: 0 }
    });
    
    const totalRecipes = await Recipe.countDocuments();
    
    console.log(`Verification: ${verificationCount}/${totalRecipes} recipes have completionCount field`);
    
    if (verificationCount === totalRecipes) {
      console.log('✅ Migration verification successful - all recipes updated');
    } else {
      console.log('⚠️  Migration verification failed - some recipes may not have been updated');
    }

  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  } finally {
    // Close database connection
    await mongoose.connection.close();
    console.log('Database connection closed');
  }
}

// Run migration if this script is executed directly
if (require.main === module) {
  migrateRecipeDishPhotos()
    .then(() => {
      console.log('Migration script completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Migration script failed:', error);
      process.exit(1);
    });
}

export { migrateRecipeDishPhotos };