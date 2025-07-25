import { Router } from 'express';
import { protect } from '../middleware/auth';
import {
  getQueryPerformanceStats,
  getRecentQueries,
  getSlowQueries,
  updateMonitoringSettings,
  clearQueryMetrics
} from '../controllers/databaseMonitoringController';

const router = Router();

// All routes require authentication and admin role (checked in controllers)

// GET /api/database-monitoring/stats - Get overall query performance statistics
router.get('/stats', protect, getQueryPerformanceStats);

// GET /api/database-monitoring/queries - Get recent queries with optional filters
router.get('/queries', protect, getRecentQueries);

// GET /api/database-monitoring/slow-queries - Get slow queries analysis
router.get('/slow-queries', protect, getSlowQueries);

// PUT /api/database-monitoring/settings - Update monitoring settings
router.put('/settings', protect, updateMonitoringSettings);

// DELETE /api/database-monitoring/metrics - Clear collected metrics
router.delete('/metrics', protect, clearQueryMetrics);

export default router;