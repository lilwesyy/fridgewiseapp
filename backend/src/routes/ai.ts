import express from 'express';
import { chatWithAI } from '../controllers/aiController';
import { protect } from '../middleware/auth';
import { rateLimits } from '../middleware/rateLimiter';

const router = express.Router();

// All AI routes require authentication
router.use(protect);

// POST /api/ai/chat - Chat with AI about recipes
router.post('/chat', rateLimits.aiChat, chatWithAI);

export default router;