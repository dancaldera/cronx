import express from 'express';
import { authMiddleware } from '../middleware/auth';
import {
  getExecutionLogs,
  getAllExecutionLogs,
  getExecutionStats,
} from '../controllers/execution-logs';

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authMiddleware);

// Routes
router.get('/', getAllExecutionLogs);
router.get('/stats', getExecutionStats);
router.get('/cron-job/:cronJobId', getExecutionLogs);

export default router;