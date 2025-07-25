import { Router } from 'express';
import { analyzeImage, getAnalyses, getAnalysis, deleteAnalysis, upload } from '../controllers/analysisController';
import { protect } from '../middleware/auth';
import { USDARecognizeService } from '../services/usdaRecognizeService';
import { rateLimits } from '../middleware/rateLimiter';
import { 
  validationRules, 
  handleValidationErrors, 
  createRateLimit 
} from '../middleware/inputValidation';
import { query } from 'express-validator';

const router = Router();

// Health check endpoint (no auth required)
router.get('/health', async (req, res) => {
  try {
    const recognizeService = new USDARecognizeService();
    const healthStatus = await recognizeService.healthCheck();
    
    res.json({
      success: true,
      data: {
        ...healthStatus,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Health check failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Search ingredients endpoint (no auth required for basic search)
router.get('/search-ingredients', 
  ...validationRules.search,
  query('limit')
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage('Limit must be between 1 and 50'),
  handleValidationErrors,
  createRateLimit(30, 60000), // 30 searches per minute
  rateLimits.ingredientSearch, 
  async (req, res) => {
  try {
    const { query, limit } = req.query;
    
    if (!query || typeof query !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Query parameter is required'
      });
    }

    const searchLimit = limit ? parseInt(limit as string) : 20;
    const recognizeService = new USDARecognizeService();
    const ingredients = await recognizeService.searchIngredients(query, searchLimit);
    
    return res.json({
      success: true,
      data: {
        query,
        ingredients,
        count: ingredients.length
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Search failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// All routes require authentication
router.use(protect);

router.post('/image', 
  ...validationRules.fileUpload,
  handleValidationErrors,
  createRateLimit(10, 60000), // 10 image analyses per minute
  rateLimits.imageAnalysis, 
  upload.single('image'), 
  analyzeImage
);
router.get('/', 
  ...validationRules.pagination,
  handleValidationErrors,
  getAnalyses
);
router.get('/:id', 
  ...validationRules.mongoId,
  handleValidationErrors,
  getAnalysis
);
router.delete('/:id', 
  ...validationRules.mongoId,
  handleValidationErrors,
  deleteAnalysis
);

export { router as analysisRoutes };