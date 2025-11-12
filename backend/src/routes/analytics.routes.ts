import express from 'express';
import {
  getDashboardAnalytics,
  getAuditTrends,
  getTopIssues,
  getCountyBreakdown,
  getRouteAnalytics,
} from '../controllers/analytics.controller';
import { authenticate } from '../middleware/auth.middleware';
import { authorize } from '../middleware/authorize.middleware';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

router.get('/dashboard', getDashboardAnalytics);
router.get('/trends', getAuditTrends);
router.get('/top-issues', getTopIssues);
router.get('/county-breakdown', getCountyBreakdown);
router.get('/route/:routeId', getRouteAnalytics);

export default router;

