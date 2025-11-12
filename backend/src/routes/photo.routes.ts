import express from 'express';
import {
  uploadPhoto,
  getPhotos,
  getPhotoById,
  deletePhoto,
} from '../controllers/photo.controller';
import { authenticate } from '../middleware/auth.middleware';
import { upload } from '../middleware/upload.middleware';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

router.post('/upload', upload.single('photo'), uploadPhoto);
router.get('/', getPhotos);
router.get('/:id', getPhotoById);
router.delete('/:id', deletePhoto);

export default router;

