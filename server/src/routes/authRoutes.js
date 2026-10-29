import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { currentUser, login, logout, register } from '../controllers/authController.js';
import { issueCsrf, requireCsrf } from '../middleware/csrf.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();
const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 20, standardHeaders: 'draft-8', legacyHeaders: false, message: { success: false, message: 'Too many sign-in attempts. Please try again in a little while.' } });

router.get('/csrf', issueCsrf);
router.post('/register', authLimiter, requireCsrf, register);
router.post('/login', authLimiter, requireCsrf, login);
router.post('/logout', requireCsrf, logout);
router.get('/me', currentUser);
router.get('/protected-check', requireAuth, (_req, res) => res.json({ success: true }));

export default router;
