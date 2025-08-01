import dotenv from 'dotenv';

// Carica le variabili d'ambiente PRIMA di importare altri moduli
dotenv.config();

// Validate environment variables before starting the server
import { envValidator } from './config/envValidation';
envValidator.validateAndExit();

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import path from 'path';
import { sanitizeRequest, securityHeaders } from './middleware/inputValidation';
import { cspMiddleware } from './middleware/contentSecurityPolicy';
import { connectDB } from './config/database';
import { redisService } from './services/redisService';
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
import { cacheRoutes } from './routes/cache';
import databaseMonitoringRoutes from './routes/databaseMonitoring';
import { securityRoutes } from './routes/security';

const app = express();
const PORT = process.env.PORT || 5001;

// Security middleware
app.use(helmet({
  // Disable CSP in helmet since we use our custom implementation
  contentSecurityPolicy: false,
  // Disable HSTS in helmet since we handle it in securityHeaders
  hsts: false
}));
app.use(cspMiddleware);
app.use(securityHeaders);
app.use(cors({
  origin: process.env.NODE_ENV === 'development' ? true : process.env.CORS_ORIGIN?.split(',') || [
    'http://localhost:5001', 
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

// Body parsing middleware with enhanced DoS protection
app.use(express.json({ 
  limit: '10mb',
  strict: true,
  type: 'application/json'
}));
app.use(express.urlencoded({ 
  extended: true, 
  limit: '10mb',
  parameterLimit: 100, // Limit number of parameters
  type: 'application/x-www-form-urlencoded'
}));

// Request timeout middleware to prevent DoS
app.use((req, res, next) => {
  // Set timeout for all requests (30 seconds)
  const timeout = setTimeout(() => {
    if (!res.headersSent) {
      res.status(408).json({
        success: false,
        error: 'Request timeout'
      });
    }
  }, 30000);

  // Clear timeout when response finishes
  res.on('finish', () => {
    clearTimeout(timeout);
  });

  // Clear timeout when response closes
  res.on('close', () => {
    clearTimeout(timeout);
  });

  next();
});

// Input sanitization middleware
app.use(sanitizeRequest);

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
app.use('/api/cache', cacheRoutes);
app.use('/api/database-monitoring', databaseMonitoringRoutes);
app.use('/api/security', securityRoutes);

// Health check endpoint
app.get('/health', (req: express.Request, res: express.Response) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0',
    message: 'FridgeWiseAI API is running',
    environment: {
      nodeEnv: process.env.NODE_ENV,
      port: process.env.PORT
    },
    services: {
      redis: redisService.isHealthy(),
      mongodb: 'connected'
    },
    security: {
      csp: 'enabled',
      cors: 'configured',
      rateLimit: 'active',
      inputValidation: 'active',
      headers: 'secure'
    }
  });
});

// Error handling middleware
app.use(errorHandler);

// 404 handler
app.use('*', (req: express.Request, res: express.Response) => {
  res.status(404).json({ 
    success: false, 
    error: 'Route not found' 
  });
});

// Start server
async function startServer() {
  try {
    await connectDB();
    
    // Initialize Redis connection
    try {
      await redisService.connect();
      console.log('✅ Redis connected successfully');
      
      // Start cache warming in background (don't wait for it)
      setTimeout(async () => {
        const { CacheService } = await import('./services/cacheService');
        await CacheService.warmCache();
      }, 5000); // Wait 5 seconds after server start
      
    } catch (error) {
      console.warn('⚠️  Redis connection failed, caching will be disabled:', error);
    }
    
    app.listen(Number(PORT), '0.0.0.0', () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📊 Health check: http://localhost:${PORT}/health`);
      console.log(`🌐 Network access: http://192.168.1.38:${PORT}/health`);
    });
  } catch (error) {
    console.log('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();

export default app;