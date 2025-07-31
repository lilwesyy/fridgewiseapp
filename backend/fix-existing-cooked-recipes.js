const mongoose = require('mongoose');

// Schema della ricetta (semplificato per il debug)
const recipeSchema = new mongoose.Schema({
  title: String,
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  cookedAt: Date,
  isPublic: { type: Boolean, default: false },
  status: { type: String, enum: ['private', 'pending_approval', 'approved', 'rejected'], default: 'private' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, { collection: 'recipes' });

const Recipe = mongoose.model('Recipe', recipeSchema);

async function fixExistingCookedRecipes() {
  try {
    // Connetti al database MongoDB
    await mongoose.connect('mongodb://fridgewiseai_user:fridgewiseai_password@localhost:27017/fridgewiseai');
    
    console.log('🔌 Connesso al database MongoDB');
    console.log('====================================');
    
    // 1. Trova tutte le ricette cucinate che non hanno status pending_approval o approved
    const cookedRecipesNeedingFix = await Recipe.find({
      cookedAt: { $exists: true, $ne: null },
      status: { $nin: ['pending_approval', 'approved'] },
      isDeleted: false
    });
    
    console.log(`🔍 Trovate ${cookedRecipesNeedingFix.length} ricette cucinate che necessitano di fix`);
    
    if (cookedRecipesNeedingFix.length === 0) {
      console.log('✅ Nessuna ricetta da fixare!');
      return;
    }
    
    // 2. Per ogni ricetta, controlla se esiste una ricetta simile già approvata
    let fixedCount = 0;
    let skippedCount = 0;
    
    for (const recipe of cookedRecipesNeedingFix) {
      console.log(`\n🔧 Processando: "${recipe.title}"`);
      
      // Check if there's already a recipe with the same title that's approved or pending
      const existingSimilarRecipe = await Recipe.findOne({
        title: recipe.title,
        _id: { $ne: recipe._id }, // Exclude the current recipe
        status: { $in: ['approved', 'pending_approval'] },
        isDeleted: false
      });
      
      if (!existingSimilarRecipe) {
        // Aggiorna lo status a pending_approval
        await Recipe.updateOne(
          { _id: recipe._id },
          { 
            status: 'pending_approval',
            updatedAt: new Date()
          }
        );
        
        console.log(`   ✅ Status aggiornato a "pending_approval"`);
        fixedCount++;
      } else {
        console.log(`   ⚠️ Skippato - esiste già una ricetta simile: "${existingSimilarRecipe.title}"`);
        skippedCount++;
      }
    }
    
    console.log('\n====================================');
    console.log('📊 RISULTATI:');
    console.log(`✅ Ricette fixate: ${fixedCount}`);
    console.log(`⚠️ Ricette skippate: ${skippedCount}`);
    console.log(`📊 Totale processate: ${cookedRecipesNeedingFix.length}`);
    
    // 3. Verifica il risultato
    const pendingRecipesAfterFix = await Recipe.countDocuments({
      status: 'pending_approval',
      isDeleted: false
    });
    
    console.log(`🔍 Ricette in pending_approval dopo il fix: ${pendingRecipesAfterFix}`);
    
  } catch (error) {
    console.error('❌ Errore:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnesso dal database');
  }
}

// Esegui lo script
fixExistingCookedRecipes();