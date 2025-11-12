import express from 'express';
import {
  createRoute,
  getRoutes,
  getRouteById,
  updateRoute,
  deleteRoute,
  getNearbyRoutes,
} from '../controllers/route.controller';
import { authenticate } from '../middleware/auth.middleware';
import { authorize } from '../middleware/authorize.middleware';

const router = express.Router();

// Public routes
router.get('/', getRoutes);
router.get('/nearby', getNearbyRoutes);
router.get('/:id', getRouteById);

// Protected routes
router.use(authenticate);

router.post('/', createRoute);
router.patch('/:id', updateRoute);
router.delete('/:id', authorize(['la_admin', 'system_admin']), deleteRoute);

export default router;

