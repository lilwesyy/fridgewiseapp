import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { User } from '../models/User';
import { Recipe } from '../models/Recipe';
import { Analysis } from '../models/Analysis';
import { APIResponse } from '../types';
import { emailService } from '../services/emailService';
import { cloudinaryService } from '../services/cloudinaryService';
import { getUserLocale } from '../utils/localeHelper';

const signToken = (id: string): string => {
  return jwt.sign({ id }, process.env.JWT_SECRET!, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  } as jwt.SignOptions);
};

const sendTokenResponse = (user: any, statusCode: number, res: Response): void => {
  const token = signToken(user._id);
  
  res.status(statusCode).json({
    success: true,
    data: {
      user,
      token
    }
  });
};

export const register = async (req: Request, res: Response<APIResponse<any>>): Promise<void> => {
  try {
    const { email, password, name, preferredLanguage, dietaryRestrictions } = req.body;
    console.log('🚀 Registration request:', { email, password: '***', name, preferredLanguage });
    console.log('📧 Email validation test:', /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email));

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      res.status(400).json({
        success: false,
        error: 'User already exists'
      });
      return;
    }

    // Create new user (not verified)
    const user = await User.create({
      email,
      password,
      name,
      preferredLanguage: preferredLanguage || 'en',
      dietaryRestrictions: dietaryRestrictions || [],
      isEmailVerified: false
    });

    // Don't auto-login, just confirm registration
    res.status(201).json({
      success: true,
      message: 'Registration successful. Please check your email to verify your account.',
      data: {
        email: user.email,
        name: user.name
      }
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: error.message || 'Registration failed'
    });
  }
};

export const login = async (req: Request, res: Response<APIResponse<any>>): Promise<void> => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      res.status(400).json({
        success: false,
        error: 'Please provide email and password'
      });
      return;
    }

    // Check if user exists
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      res.status(401).json({
        success: false,
        error: 'Invalid credentials'
      });
      return;
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      res.status(401).json({
        success: false,
        error: 'Invalid credentials'
      });
      return;
    }

    // Check if email is verified
    if (!user.isEmailVerified) {
      res.status(401).json({
        success: false,
        error: 'Please verify your email address before logging in',
        requireEmailVerification: true,
        email: user.email
      });
      return;
    }

    sendTokenResponse(user, 200, res);
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message || 'Login failed'
    });
  }
};

export const getMe = async (req: Request, res: Response<APIResponse<any>>): Promise<void> => {
  try {
    const user = (req as any).user;
    
    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get user'
    });
  }
};

export const updateProfile = async (req: Request, res: Response<APIResponse<any>>): Promise<void> => {
  try {
    const user = (req as any).user;
    const { name, preferredLanguage, dietaryRestrictions, avatar } = req.body;

    const updatedUser = await User.findByIdAndUpdate(
      user._id,
      {
        name,
        preferredLanguage,
        dietaryRestrictions,
        ...(avatar && { avatar })
      },
      {
        new: true,
        runValidators: true
      }
    );

    res.status(200).json({
      success: true,
      data: updatedUser
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: error.message || 'Profile update failed'
    });
  }
};

export const changePassword = async (req: Request, res: Response<APIResponse<any>>): Promise<void> => {
  try {
    const user = (req as any).user;
    const { currentPassword, newPassword } = req.body;

    // Validate input
    if (!currentPassword || !newPassword) {
      res.status(400).json({
        success: false,
        error: 'Please provide current and new password'
      });
      return;
    }

    // Get user with password field
    const userWithPassword = await User.findById(user._id).select('+password');
    if (!userWithPassword) {
      res.status(404).json({
        success: false,
        error: 'User not found'
      });
      return;
    }

    // Check current password
    const isMatch = await userWithPassword.comparePassword(currentPassword);
    if (!isMatch) {
      res.status(401).json({
        success: false,
        error: 'Current password is incorrect'
      });
      return;
    }

    // Update password
    userWithPassword.password = newPassword;
    await userWithPassword.save();

    res.status(200).json({
      success: true,
      message: 'Password updated successfully'
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message || 'Password change failed'
    });
  }
};

export const forgotPassword = async (req: Request, res: Response<APIResponse<any>>): Promise<void> => {
  try {
    const { email } = req.body;

    if (!email) {
      res.status(400).json({
        success: false,
        error: 'Please provide email address'
      });
      return;
    }

    // Check if user exists
    const user = await User.findOne({ email });
    if (!user) {
      res.status(404).json({
        success: false,
        error: 'User not found'
      });
      return;
    }

    // Generate reset code (6 digits)
    const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
    const resetTokenExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Update user with reset code
    user.resetPasswordToken = resetCode;
    user.resetPasswordExpiry = resetTokenExpiry;
    await user.save();

    // Send email with reset code
    try {
      const userLocale = getUserLocale(user.preferredLanguage, req);
      await emailService.sendPasswordResetCode(email, resetCode, userLocale);
      console.log('Password reset code sent to email:', email, 'in locale:', userLocale);
    } catch (emailError) {
      console.error('Failed to send reset email:', emailError);
      // Return the actual error to help debug
      res.status(500).json({
        success: false,
        error: `Email sending failed: ${emailError instanceof Error ? emailError.message : 'Unknown error'}`
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Password reset code sent to email'
      // Note: Don't return the resetCode in production for security
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message || 'Password reset failed'
    });
  }
};

export const resetPassword = async (req: Request, res: Response<APIResponse<any>>): Promise<void> => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      res.status(400).json({
        success: false,
        error: 'Please provide token and new password'
      });
      return;
    }

    // Find user with valid reset token
    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpiry: { $gt: new Date() }
    });

    if (!user) {
      res.status(400).json({
        success: false,
        error: 'Invalid or expired reset token'
      });
      return;
    }

    // Update password and remove reset token
    user.password = newPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpiry = undefined;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Password reset successfully'
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message || 'Password reset failed'
    });
  }
};

export const deleteAccount = async (req: Request, res: Response<APIResponse<any>>): Promise<void> => {
  try {
    const user = (req as any).user;
    const { password } = req.body;

    // Validate password input
    if (!password) {
      res.status(400).json({
        success: false,
        error: 'Please provide your password to confirm account deletion'
      });
      return;
    }

    // Get user with password field for verification
    const userWithPassword = await User.findById(user._id).select('+password');
    if (!userWithPassword) {
      res.status(404).json({
        success: false,
        error: 'User not found'
      });
      return;
    }

    // Verify password
    const isMatch = await userWithPassword.comparePassword(password);
    if (!isMatch) {
      res.status(401).json({
        success: false,
        error: 'Incorrect password'
      });
      return;
    }

    // Get all user recipes to clean up associated images
    const userRecipes = await Recipe.find({ userId: user._id });
    
    // Clean up Cloudinary images for recipes (dish photos)
    for (const recipe of userRecipes) {
      if (recipe.dishPhotos && recipe.dishPhotos.length > 0) {
        for (const photo of recipe.dishPhotos) {
          try {
            await cloudinaryService.deleteImage(photo.publicId);
          } catch (error) {
            console.error(`Failed to delete recipe image ${photo.publicId}:`, error);
            // Continue with deletion even if image cleanup fails
          }
        }
      }
    }

    // Clean up user avatar if exists
    if (userWithPassword.avatar && userWithPassword.avatar.publicId) {
      try {
        await cloudinaryService.deleteImage(userWithPassword.avatar.publicId);
      } catch (error) {
        console.error(`Failed to delete user avatar ${userWithPassword.avatar.publicId}:`, error);
        // Continue with deletion even if avatar cleanup fails
      }
    }

    // Delete all user-related data
    await Recipe.deleteMany({ userId: user._id });
    await Analysis.deleteMany({ userId: user._id });
    await User.findByIdAndDelete(user._id);

    res.status(200).json({
      success: true,
      message: 'Account deleted successfully'
    });
  } catch (error: any) {
    console.error('Delete account error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Account deletion failed'
    });
  }
};

export const sendEmailVerification = async (req: Request, res: Response<APIResponse<any>>): Promise<void> => {
  try {
    const { email } = req.body;

    if (!email) {
      res.status(400).json({
        success: false,
        error: 'Please provide email address'
      });
      return;
    }

    // Check if user exists
    const user = await User.findOne({ email });
    if (!user) {
      res.status(404).json({
        success: false,
        error: 'User not found'
      });
      return;
    }

    // Check if already verified
    if (user.isEmailVerified) {
      res.status(400).json({
        success: false,
        error: 'Email already verified'
      });
      return;
    }

    // Generate verification code (6 digits)
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    const verificationTokenExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Update user with verification code
    user.emailVerificationToken = verificationCode;
    user.emailVerificationExpiry = verificationTokenExpiry;
    await user.save();

    // Send email with verification code
    try {
      const userLocale = getUserLocale(user.preferredLanguage, req);
      await emailService.sendEmailVerificationCode(email, verificationCode, userLocale);
      console.log('Email verification code sent to:', email, 'in locale:', userLocale);
    } catch (emailError) {
      console.error('Failed to send verification email:', emailError);
      // Don't fail the request if email fails, just log it
    }

    res.status(200).json({
      success: true,
      message: 'Email verification code sent'
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to send verification code'
    });
  }
};

export const verifyEmail = async (req: Request, res: Response<APIResponse<any>>): Promise<void> => {
  try {
    const { email, token } = req.body;

    if (!email || !token) {
      res.status(400).json({
        success: false,
        error: 'Please provide email and verification token'
      });
      return;
    }

    // Find user with valid verification token
    const user = await User.findOne({
      email,
      emailVerificationToken: token,
      emailVerificationExpiry: { $gt: new Date() }
    });

    if (!user) {
      res.status(400).json({
        success: false,
        error: 'Invalid or expired verification token'
      });
      return;
    }

    // Mark email as verified and remove verification token
    user.isEmailVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpiry = undefined;
    await user.save();

    // Auto-login the user after successful email verification
    sendTokenResponse(user, 200, res);
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message || 'Email verification failed'
    });
  }
};