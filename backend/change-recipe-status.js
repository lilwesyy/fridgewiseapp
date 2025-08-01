const mongoose = require('mongoose');
require('dotenv').config();

async function changeRecipeStatus() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    
    const Recipe = mongoose.model('Recipe', {
      title: String,
      status: String,
      cookedAt: Date,
      dishPhotos: Array,
      isDeleted: Boolean
    });
    
    // Find the existing recipe
    const recipe = await Recipe.findOne({ isDeleted: false });
    if (!recipe) {
      console.log('❌ No recipe found');
      return;
    }
    
    console.log(`📝 Found recipe: ${recipe.title}`);
    console.log(`📊 Current status: ${recipe.status}`);
    
    // Change status to pending_approval
    recipe.status = 'pending_approval';
    await recipe.save();
    
    console.log('✅ Recipe status changed to pending_approval');
    console.log(`📋 Recipe ID: ${recipe._id}`);
    
  } catch (error) {
    console.log('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

changeRecipeStatus();