import express from 'express';
import {
  createAudit,
  getAudits,
  getAuditById,
  updateAudit,
  deleteAudit,
  getAuditReport,
  generateAuditReport,
} from '../controllers/audit.controller';
import { authenticate } from '../middleware/auth.middleware';
import { authorize } from '../middleware/authorize.middleware';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Audit routes
router.post('/', createAudit);
router.get('/', getAudits);
router.get('/:id', getAuditById);
router.patch('/:id', updateAudit);
router.delete('/:id', authorize(['coordinator', 'la_admin', 'system_admin']), deleteAudit);

// Report routes
router.get('/:id/report', getAuditReport);
router.post('/:id/report/generate', generateAuditReport);

export default router;

