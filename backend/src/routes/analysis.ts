import { Router } from 'express';
import { analyzeImage, getAnalyses, getAnalysis, deleteAnalysis, upload } from '../controllers/analysisController';
import { protect } from '../middleware/auth';

const router = Router();

// All routes require authentication
router.use(protect);

router.post('/image', upload.single('image'), analyzeImage);
router.get('/', getAnalyses);
router.get('/:id', getAnalysis);
router.delete('/:id', deleteAnalysis);

export { router as analysisRoutes };