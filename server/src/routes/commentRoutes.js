import { Router } from 'express';
import { deleteComment, updateComment } from '../controllers/commentController.js';
import { requireAuth } from '../middleware/auth.js';
import { requireCsrf } from '../middleware/csrf.js';

const router = Router();
router.put('/:id', requireAuth, requireCsrf, updateComment);
router.delete('/:id', requireAuth, requireCsrf, deleteComment);
export default router;
