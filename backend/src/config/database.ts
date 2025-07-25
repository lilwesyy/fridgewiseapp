import mongoose from 'mongoose';
import { ensureIndexes } from './indexes';
import { queryMonitor } from '../middleware/queryMonitoring';

export const connectDB = async (): Promise<void> => {
  try {
    const mongoUri = process.env.MONGODB_URI;
    
    if (!mongoUri) {
      throw new Error('MONGODB_URI environment variable is not set');
    }

    await mongoose.connect(mongoUri, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 30000, // Aumentato a 30 secondi
      socketTimeoutMS: 45000,
      connectTimeoutMS: 30000, // Aggiunto timeout di connessione
    });

    console.log('✅ MongoDB connected successfully');
    
    // Initialize query monitoring
    if (queryMonitor.isMonitoringEnabled()) {
      console.log('📊 Database query monitoring enabled');
    }
    
    // Ensure all required indexes exist
    await ensureIndexes();
    
    // Handle connection events
    mongoose.connection.on('error', (err) => {
      console.error('MongoDB connection error:', err);
    });
    
    mongoose.connection.on('disconnected', () => {
      console.warn('MongoDB disconnected');
    });
    
    mongoose.connection.on('reconnected', () => {
      console.log('MongoDB reconnected');
    });
    
  } catch (error) {
    console.error('MongoDB connection failed:', error);
    process.exit(1);
  }
};

export const disconnectDB = async (): Promise<void> => {
  try {
    await mongoose.disconnect();
    console.log('MongoDB disconnected');
  } catch (error) {
    console.error('Error disconnecting from MongoDB:', error);
  }
};