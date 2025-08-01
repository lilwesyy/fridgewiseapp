const mongoose = require('mongoose');

// Schema della ricetta (semplificato per il debug)
const recipeSchema = new mongoose.Schema({
  title: String,
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  cookedAt: Date,
  isPublic: { type: Boolean, default: false },
  approvalStatus: { type: String, enum: ['pending', 'approved', 'rejected'], default: null },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, { collection: 'recipes' });

const Recipe = mongoose.model('Recipe', recipeSchema);

async function debugRecipes() {
  try {
    // Connetti al database MongoDB
    await mongoose.connect('mongodb://fridgewiseai_user:fridgewiseai_password@localhost:27017/fridgewiseai');
    
    console.log('🔌 Connesso al database MongoDB');
    console.log('====================================');
    
    // 1. Conta tutte le ricette
    const totalRecipes = await Recipe.countDocuments();
    console.log(`📊 TOTALE RICETTE NEL DATABASE: ${totalRecipes}`);
    
    // 2. Conta ricette cucinate (con cookedAt)
    const cookedRecipes = await Recipe.countDocuments({ 
      cookedAt: { $exists: true, $ne: null } 
    });
    console.log(`🍳 RICETTE CUCINATE (con cookedAt): ${cookedRecipes}`);
    
    // 3. Conta ricette pubbliche
    const publicRecipes = await Recipe.countDocuments({ isPublic: true });
    console.log(`🌍 RICETTE PUBBLICHE: ${publicRecipes}`);
    
    // 4. Conta ricette con status (non approvalStatus)
    const pendingApproval = await Recipe.countDocuments({ status: 'pending_approval' });
    const approvedRecipes = await Recipe.countDocuments({ status: 'approved' });
    const rejectedRecipes = await Recipe.countDocuments({ status: 'rejected' });
    
    console.log(`⏳ RICETTE IN ATTESA DI APPROVAZIONE: ${pendingApproval}`);
    console.log(`✅ RICETTE APPROVATE: ${approvedRecipes}`);
    console.log(`❌ RICETTE RIFIUTATE: ${rejectedRecipes}`);
    
    // 5. Ricette cucinate ma non ancora approvate/rifiutate (quelle che dovrebbero apparire nel modale)
    const cookedButNotProcessed = await Recipe.countDocuments({ 
      cookedAt: { $exists: true, $ne: null },
      $or: [
        { approvalStatus: { $exists: false } },
        { approvalStatus: null },
        { approvalStatus: 'pending' }
      ],
      isPublic: { $ne: true }
    });
    console.log(`🔍 RICETTE CUCINATE MA NON PROCESSATE: ${cookedButNotProcessed}`);
    
    console.log('\n====================================');
    console.log('📋 DETTAGLI RICETTE CUCINATE:');
    console.log('====================================');
    
    // 6. Mostra dettagli delle ricette cucinate
    const cookedRecipesList = await Recipe.find({ 
      cookedAt: { $exists: true, $ne: null } 
    })
    .select('title userId cookedAt isPublic approvalStatus createdAt status')
    .sort({ cookedAt: -1 })
    .limit(10);
    
    cookedRecipesList.forEach((recipe, index) => {
      console.log(`\n${index + 1}. "${recipe.title}"`);
      console.log(`   👤 User ID: ${recipe.userId || 'N/A'}`);
      console.log(`   🍳 Cucinata il: ${recipe.cookedAt?.toISOString() || 'N/A'}`);
      console.log(`   🌍 Pubblica: ${recipe.isPublic ? 'Sì' : 'No'}`);
      console.log(`   📋 Stato approvazione: ${recipe.approvalStatus || 'Non impostato'}`);
      console.log(`   🔧 Status: ${recipe.status || 'Non impostato'}`);
      console.log(`   📅 Creata il: ${recipe.createdAt?.toISOString() || 'N/A'}`);
    });
    
    // 7. Verifica la struttura del database
    console.log('\n====================================');
    console.log('🔧 STRUTTURA CAMPI:');
    console.log('====================================');
    
    const sampleRecipe = await Recipe.findOne({ cookedAt: { $exists: true } });
    if (sampleRecipe) {
      console.log('📋 Campi della prima ricetta cucinata:');
      console.log(Object.keys(sampleRecipe.toObject()));
    } else {
      console.log('❌ Nessuna ricetta cucinata trovata');
    }
    
  } catch (error) {
    console.log('❌ Errore:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnesso dal database');
  }
}

// Esegui lo script
debugRecipes();