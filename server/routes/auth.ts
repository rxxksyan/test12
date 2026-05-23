import { Router } from 'express';
import { register, login, getMe, logout, changePassword } from '../controllers/authController';
import { requireAuth } from '../middleware/authMiddleware';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.get('/me', requireAuth, getMe);
router.post('/logout', logout);
router.post('/change-password', requireAuth, changePassword);

export default router;