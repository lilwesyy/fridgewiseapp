import mongoose from 'mongoose';
import { User } from '../models/User';
import { connectDB } from '../config/database';

const makeAdmin = async () => {
  try {
    // Connetti al database
    await connectDB();
    
    // Trova l'utente per email
    const user = await User.findOne({ email: 'mirco.carp@icloud.com' });
    
    if (!user) {
      console.log('❌ User mirco.carp@icloud.com not found');
      process.exit(1);
    }
    
    // Aggiorna il ruolo a admin
    user.role = 'admin';
    await user.save();
    
    console.log('✅ User mirco.carp@icloud.com has been made admin');
    console.log('User details:', {
      id: user._id,
      email: user.email,
      name: user.name,
      role: user.role
    });
    
    process.exit(0);
    
  } catch (error) {
    console.log('❌ Error making user admin:', error);
    process.exit(1);
  }
};

makeAdmin();