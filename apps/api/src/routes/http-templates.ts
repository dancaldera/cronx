import express, { Router } from 'express';
import { authMiddleware } from '../middleware/auth';
import {
  createHttpTemplate,
  getHttpTemplates,
  getHttpTemplateById,
  updateHttpTemplate,
  deleteHttpTemplate,
  testHttpTemplate,
} from '../controllers/http-templates';

const router: Router = express.Router();

// Apply authentication middleware to all routes
router.use(authMiddleware);

// Routes
router.post('/', createHttpTemplate);
router.get('/', getHttpTemplates);
router.get('/:id', getHttpTemplateById);
router.put('/:id', updateHttpTemplate);
router.delete('/:id', deleteHttpTemplate);
router.post('/:id/test', testHttpTemplate);

export = router;