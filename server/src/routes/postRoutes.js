import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { createComment, listComments } from '../controllers/commentController.js';
import { createPost, deletePost, getPost, getPostBySlug, listCategories, listMyPosts, listPosts, updatePost } from '../controllers/postController.js';
import { optionalAuth, requireAuth } from '../middleware/auth.js';
import { requireCsrf } from '../middleware/csrf.js';

const router = Router();
const writeLimiter = rateLimit({ windowMs: 60 * 1000, limit: 30, standardHeaders: 'draft-8', legacyHeaders: false, message: { success: false, message: 'You are doing that too often. Please wait a moment.' } });

router.get('/', listPosts);
router.get('/categories', listCategories);
router.get('/mine', requireAuth, listMyPosts);
router.get('/slug/:slug', getPostBySlug);
router.get('/:id/comments', optionalAuth, listComments);
router.post('/:id/comments', requireAuth, requireCsrf, writeLimiter, createComment);
router.get('/:id', optionalAuth, getPost);
router.post('/', requireAuth, requireCsrf, writeLimiter, createPost);
router.put('/:id', requireAuth, requireCsrf, writeLimiter, updatePost);
router.delete('/:id', requireAuth, requireCsrf, writeLimiter, deletePost);

export default router;
