import { Router } from 'express';
import { register, login, refreshToken, getProfile, updateProfile, requestPasswordReset, resetPassword } from '../controllers/auth';
import { authMiddleware } from '../middleware/auth';

const router: Router = Router();

// Public routes
router.post('/register', register);
router.post('/login', login);
router.post('/refresh', refreshToken);
router.post('/request-password-reset', requestPasswordReset);
router.post('/reset-password', resetPassword);

// Protected routes
router.get('/me', authMiddleware, getProfile);
router.put('/me', authMiddleware, updateProfile);

export default router;