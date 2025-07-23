import express, { Router } from 'express';
import { authMiddleware } from '../middleware/auth';
import {
  createCronJob,
  getCronJobs,
  getCronJobById,
  updateCronJob,
  deleteCronJob,
  toggleCronJob,
  executeCronJob,
  getCronJobsStats,
} from '../controllers/cron-jobs';

const router: Router = express.Router();

// Apply authentication middleware to all routes
router.use(authMiddleware);

// Routes
router.post('/', createCronJob);
router.get('/', getCronJobs);
router.get('/stats', getCronJobsStats);
router.get('/:id', getCronJobById);
router.put('/:id', updateCronJob);
router.delete('/:id', deleteCronJob);
router.patch('/:id/toggle', toggleCronJob);
router.post('/:id/execute', executeCronJob);

export = router;