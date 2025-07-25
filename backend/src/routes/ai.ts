import express from 'express';
import { chatWithAI } from '../controllers/aiController';
import { protect } from '../middleware/auth';
import { rateLimits } from '../middleware/rateLimiter';
import { 
  validationRules, 
  handleValidationErrors, 
  createRateLimit 
} from '../middleware/inputValidation';

const router = express.Router();

// All AI routes require authentication
router.use(protect);

// POST /api/ai/chat - Chat with AI about recipes
router.post('/chat', 
  ...validationRules.chatMessage,
  handleValidationErrors,
  createRateLimit(20, 60000), // 20 chat messages per minute
  rateLimits.aiChat, 
  chatWithAI
);

export default router;