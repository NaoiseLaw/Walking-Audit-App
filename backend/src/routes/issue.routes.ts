import express from 'express';
import {
  createIssue,
  getIssues,
  getIssueById,
  updateIssue,
  deleteIssue,
  acknowledgeIssue,
  resolveIssue,
  verifyIssue,
} from '../controllers/issue.controller';
import { authenticate } from '../middleware/auth.middleware';
import { authorize } from '../middleware/authorize.middleware';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

router.post('/', createIssue);
router.get('/', getIssues);
router.get('/:id', getIssueById);
router.patch('/:id', updateIssue);
router.delete('/:id', deleteIssue);

// LA Admin routes
router.post('/:id/acknowledge', authorize(['la_admin', 'system_admin']), acknowledgeIssue);
router.post('/:id/resolve', authorize(['la_admin', 'system_admin']), resolveIssue);
router.post('/:id/verify', authorize(['la_admin', 'system_admin']), verifyIssue);

export default router;

