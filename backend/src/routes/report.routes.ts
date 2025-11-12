import express from 'express';
import {
  generateReport,
  getReport,
  downloadReport,
} from '../controllers/report.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

router.post('/generate', generateReport);
router.get('/:id', getReport);
router.get('/:id/download', downloadReport);

export default router;

