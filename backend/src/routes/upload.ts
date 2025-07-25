import { Router } from 'express';
import multer from 'multer';
import { uploadAvatar, deleteAvatar, uploadDishPhoto } from '../controllers/uploadController';
import { protect } from '../middleware/auth';
import { validationRules, handleValidationErrors, createRateLimit } from '../middleware/inputValidation';

const router = Router();

// Configure multer for memory storage with enhanced DoS protection
const storage = multer.memoryStorage();

// Enhanced file filter with stricter validation
const createSecureFileFilter = (allowedTypes: string[], maxSize: number) => {
  return (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    // Check file size before processing (additional protection)
    if (req.headers['content-length'] && parseInt(req.headers['content-length']) > maxSize) {
      return cb(new Error(`File too large. Maximum size: ${maxSize / (1024 * 1024)}MB`));
    }

    // Validate MIME type
    if (!allowedTypes.includes(file.mimetype)) {
      return cb(new Error(`Invalid file type. Allowed: ${allowedTypes.join(', ')}`));
    }

    // Additional filename validation to prevent path traversal
    if (file.originalname) {
      const filename = file.originalname.toLowerCase();
      if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
        return cb(new Error('Invalid filename'));
      }
      
      // Check for executable extensions
      const dangerousExtensions = ['.exe', '.bat', '.cmd', '.com', '.pif', '.scr', '.vbs', '.js', '.jar', '.php'];
      if (dangerousExtensions.some(ext => filename.endsWith(ext))) {
        return cb(new Error('Dangerous file type not allowed'));
      }
    }

    cb(null, true);
  };
};

// Multer config for avatars with enhanced DoS protection
const avatarUpload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
    files: 1, // Only one file
    fields: 5, // Limit form fields
    fieldNameSize: 100, // Limit field name size
    fieldSize: 1024 * 1024, // Limit field value size (1MB)
    headerPairs: 20 // Limit header pairs
  },
  fileFilter: createSecureFileFilter(['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'], 5 * 1024 * 1024),
});

// Multer config for dish photos with enhanced DoS protection
const dishPhotoUpload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit for dish photos
    files: 1, // Only one file
    fields: 10, // Limit form fields
    fieldNameSize: 100, // Limit field name size
    fieldSize: 1024 * 1024, // Limit field value size (1MB)
    headerPairs: 20 // Limit header pairs
  },
  fileFilter: createSecureFileFilter(['image/jpeg', 'image/jpg', 'image/png'], 10 * 1024 * 1024),
});

// Error handling middleware for multer
const handleMulterError = (error: any, req: any, res: any, next: any) => {
  if (error instanceof multer.MulterError) {
    switch (error.code) {
      case 'LIMIT_FILE_SIZE':
        return res.status(400).json({
          success: false,
          error: 'File too large',
          details: 'Maximum file size exceeded'
        });
      case 'LIMIT_FILE_COUNT':
        return res.status(400).json({
          success: false,
          error: 'Too many files',
          details: 'Only one file allowed per upload'
        });
      case 'LIMIT_FIELD_COUNT':
        return res.status(400).json({
          success: false,
          error: 'Too many fields',
          details: 'Form has too many fields'
        });
      case 'LIMIT_UNEXPECTED_FILE':
        return res.status(400).json({
          success: false,
          error: 'Unexpected file field',
          details: 'File field name not expected'
        });
      default:
        return res.status(400).json({
          success: false,
          error: 'Upload error',
          details: error.message
        });
    }
  }
  
  if (error.message) {
    return res.status(400).json({
      success: false,
      error: error.message
    });
  }
  
  next(error);
};

// Routes with enhanced error handling
router.post('/avatar', 
  protect, 
  createRateLimit(5, 60000), // Reduced to 5 avatar uploads per minute for DoS protection
  (req, res, next) => {
    avatarUpload.single('avatar')(req, res, (error) => {
      if (error) {
        return handleMulterError(error, req, res, next);
      }
      next();
    });
  },
  uploadAvatar
);

router.delete('/avatar', protect, deleteAvatar);

router.post('/dish-photo', 
  protect, 
  createRateLimit(10, 60000), // Reduced to 10 dish photos per minute for DoS protection
  (req, res, next) => {
    dishPhotoUpload.single('dishPhoto')(req, res, (error) => {
      if (error) {
        return handleMulterError(error, req, res, next);
      }
      next();
    });
  },
  uploadDishPhoto
);

export { router as uploadRoutes };