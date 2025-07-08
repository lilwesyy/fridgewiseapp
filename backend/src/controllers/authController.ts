import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { User } from '../models/User';
import { APIResponse } from '@/types';

const signToken = (id: string): string => {
  return jwt.sign({ id }, process.env.JWT_SECRET!, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  });
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
    const { email, password, name, preferredLanguage } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      res.status(400).json({
        success: false,
        error: 'User already exists'
      });
      return;
    }

    // Create new user
    const user = await User.create({
      email,
      password,
      name,
      preferredLanguage: preferredLanguage || 'en'
    });

    sendTokenResponse(user, 201, res);
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
    const { name, preferredLanguage, dietaryRestrictions } = req.body;

    const updatedUser = await User.findByIdAndUpdate(
      user._id,
      {
        name,
        preferredLanguage,
        dietaryRestrictions
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