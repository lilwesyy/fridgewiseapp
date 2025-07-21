import { Router } from 'express';
import multer from 'multer';
import { uploadAvatar, deleteAvatar, uploadDishPhoto } from '../controllers/uploadController';
import { protect } from '../middleware/auth';

const router = Router();

// Configure multer for memory storage
const storage = multer.memoryStorage();

// Multer config for avatars (smaller size limit)
const avatarUpload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  },
});

// Multer config for dish photos (larger size limit)
const dishPhotoUpload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit for dish photos
  },
  fileFilter: (req, file, cb) => {
    const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png'];
    if (allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only JPEG and PNG files are allowed for dish photos'));
    }
  },
});

// Routes
router.post('/avatar', protect, avatarUpload.single('avatar'), uploadAvatar);
router.delete('/avatar', protect, deleteAvatar);
router.post('/dish-photo', protect, dishPhotoUpload.single('dishPhoto'), uploadDishPhoto);

export { router as uploadRoutes };