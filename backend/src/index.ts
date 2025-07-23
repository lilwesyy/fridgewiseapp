import dotenv from 'dotenv';

// Carica le variabili d'ambiente PRIMA di importare altri moduli
dotenv.config();

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import path from 'path';
import { connectDB } from './config/database';
import { errorHandler } from './middleware/errorHandler';
import { authRoutes } from './routes/auth';
import { analysisRoutes } from './routes/analysis';
import { recipeRoutes } from './routes/recipe';
import { userRoutes } from './routes/user';
import aiRoutes from './routes/ai';
import adminRoutes from './routes/admin';
import { uploadRoutes } from './routes/upload';
import { usageRoutes } from './routes/usage';
import recipeCollectionRoutes from './routes/recipeCollection';
import { ratingRoutes } from './routes/rating';

const app = express();
const PORT = process.env.PORT || 3000;

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.NODE_ENV === 'development' ? true : process.env.CORS_ORIGIN?.split(',') || [
    'http://localhost:3000', 
    'http://localhost:19006',
    'http://192.168.1.38:19006',
    'https://*.ngrok.io',
    'https://*.expo.dev',
    'https://*.expo.io'
  ],
  credentials: true
}));

// Logging middleware
app.use(morgan('combined'));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static files
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/analysis', analysisRoutes);
app.use('/api/recipe', recipeRoutes);
app.use('/api/user', userRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/usage', usageRoutes);
app.use('/api/collections', recipeCollectionRoutes);
app.use('/api/recipe', ratingRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0',
    message: 'FridgeWise API is running'
  });
});

// Error handling middleware
app.use(errorHandler);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ 
    success: false, 
    error: 'Route not found' 
  });
});

// Start server
async function startServer() {
  try {
    await connectDB();
    
    app.listen(Number(PORT), '0.0.0.0', () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📊 Health check: http://localhost:${PORT}/health`);
      console.log(`🌐 Network access: http://192.168.1.38:${PORT}/health`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();

export default app;