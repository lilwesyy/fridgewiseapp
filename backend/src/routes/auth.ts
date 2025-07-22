import { Router } from 'express';
import { register, login, getMe, updateProfile, changePassword, forgotPassword, resetPassword, deleteAccount, sendEmailVerification, verifyEmail } from '../controllers/authController';
import { protect } from '../middleware/auth';

const router = Router();

router.post('/register', register);
router.post('/send-email-verification', sendEmailVerification);
router.post('/verify-email', verifyEmail);
router.post('/login', login);
router.get('/me', protect, getMe);
router.put('/profile', protect, updateProfile);
router.put('/change-password', protect, changePassword);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.delete('/delete-account', protect, deleteAccount);

export { router as authRoutes };