// Script per promuovere l'utente Mirco ad admin
require('dotenv').config();
const mongoose = require('mongoose');

// Schema User semplificato per lo script
const userSchema = new mongoose.Schema({
  email: String,
  password: String,
  name: String,
  preferredLanguage: { type: String, default: 'en' },
  dietaryRestrictions: { type: [String], default: [] },
  role: { type: String, enum: ['user', 'admin'], default: 'user' }
}, { timestamps: true });

const User = mongoose.model('User', userSchema);

const makeAdmin = async () => {
  try {
    // Connetti al database
    const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/fridgewise';
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');
    
    // Trova e aggiorna l'utente
    const user = await User.findOneAndUpdate(
      { email: 'mirco.carp@icloud.com' },
      { role: 'admin' },
      { new: true }
    );
    
    if (!user) {
      console.log('❌ User mirco.carp@icloud.com not found');
      console.log('💡 Make sure the user is registered first');
    } else {
      console.log('✅ User promoted to admin successfully!');
      console.log('👤 User details:', {
        id: user._id,
        email: user.email,
        name: user.name,
        role: user.role
      });
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('👋 Disconnected from MongoDB');
    process.exit(0);
  }
};

makeAdmin();