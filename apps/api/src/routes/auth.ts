import { Router } from 'express';
import { register, login, refreshToken, getProfile, updateProfile } from '../controllers/auth';
import { authMiddleware } from '../middleware/auth';

const router: Router = Router();

// Public routes
router.post('/register', register);
router.post('/login', login);
router.post('/refresh', refreshToken);

// Protected routes
router.get('/me', authMiddleware, getProfile);
router.put('/me', authMiddleware, updateProfile);

export default router;