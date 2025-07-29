const mongoose = require('mongoose');
require('dotenv').config();

async function createTestRecipe() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    
    const Recipe = mongoose.model('Recipe', {
      title: String,
      description: String,
      ingredients: Array,
      instructions: Array,
      cookingTime: Number,
      servings: Number,
      difficulty: String,
      dietaryTags: Array,
      language: String,
      userId: mongoose.Types.ObjectId,
      status: String,
      cookedAt: Date,
      dishPhotos: Array,
      isDeleted: Boolean,
      createdAt: { type: Date, default: Date.now },
      updatedAt: { type: Date, default: Date.now }
    });
    
    // Find the existing user
    const User = mongoose.model('User', {
      name: String,
      email: String
    });
    
    const user = await User.findOne({});
    if (!user) {
      console.log('❌ No user found');
      return;
    }
    
    console.log(`👤 Found user: ${user.name} (${user._id})`);
    
    // Create a test recipe with pending_approval status
    const testRecipe = new Recipe({
      title: 'Test Recipe for Approval',
      description: 'This is a test recipe to check the approval system',
      ingredients: [
        { name: 'Test Ingredient', amount: '1', unit: 'cup' }
      ],
      instructions: ['Test instruction'],
      cookingTime: 30,
      servings: 2,
      difficulty: 'easy',
      dietaryTags: [],
      language: 'it',
      userId: user._id,
      status: 'pending_approval',
      cookedAt: new Date(),
      dishPhotos: [{ url: 'test.jpg', publicId: 'test' }],
      isDeleted: false
    });
    
    await testRecipe.save();
    console.log('✅ Created test recipe with pending_approval status');
    console.log(`📝 Recipe ID: ${testRecipe._id}`);
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

createTestRecipe();