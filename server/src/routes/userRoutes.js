import { Router } from 'express';
import { authorProfile, dashboard, listAuthorPosts } from '../controllers/postController.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();
router.get('/me/dashboard', requireAuth, dashboard);
router.get('/:id/posts', listAuthorPosts);
router.get('/:id', authorProfile);
export default router;
