import express from 'express';
import {
  createRecommendation,
  getRecommendations,
  getRecommendationById,
  updateRecommendation,
  deleteRecommendation,
  respondToRecommendation,
  implementRecommendation,
  verifyRecommendation,
} from '../controllers/recommendation.controller';
import { authenticate } from '../middleware/auth.middleware';
import { authorize } from '../middleware/authorize.middleware';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

router.post('/', createRecommendation);
router.get('/', getRecommendations);
router.get('/:id', getRecommendationById);
router.patch('/:id', updateRecommendation);
router.delete('/:id', deleteRecommendation);

// LA Admin routes
router.post('/:id/respond', authorize(['la_admin', 'system_admin']), respondToRecommendation);
router.post('/:id/implement', authorize(['la_admin', 'system_admin']), implementRecommendation);
router.post('/:id/verify', authorize(['la_admin', 'system_admin']), verifyRecommendation);

export default router;

