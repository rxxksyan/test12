import { Router } from 'express';
import { register, login, getMe, logout, changePassword, setUserRole } from '../controllers/authController';
import { requireAuth } from '../middleware/authMiddleware';
import { requireRole } from '../middleware/roleMiddleware';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.get('/me', requireAuth, getMe);
router.post('/logout', logout);
router.post('/change-password', requireAuth, changePassword);
router.post('/set-role', requireAuth, requireRole('owner'), setUserRole);

export default router;
