import { Request, Response } from 'express';
import { User } from '../models/User';
import { cloudinaryService } from '../services/cloudinaryService';
import { APIResponse } from '../types';

export const uploadAvatar = async (req: Request, res: Response<APIResponse<any>>): Promise<void> => {
  try {
    const user = (req as any).user;
    
    if (!req.file && !req.body.image) {
      res.status(400).json({
        success: false,
        error: 'No image provided'
      });
      return;
    }

    // Get current user to check for existing avatar
    const currentUser = await User.findById(user._id);
    if (!currentUser) {
      res.status(404).json({
        success: false,
        error: 'User not found'
      });
      return;
    }

    // Delete old avatar from Cloudinary if exists
    if (currentUser.avatar?.publicId) {
      try {
        await cloudinaryService.deleteImage(currentUser.avatar.publicId);
      } catch (error) {
        console.error('Error deleting old avatar:', error);
        // Continue with upload even if deletion fails
      }
    }

    let uploadResult;
    
    // Handle file upload from multipart/form-data
    if (req.file) {
      uploadResult = await cloudinaryService.uploadBuffer(req.file.buffer, {
        folder: 'fridgewiseai/avatars',
        public_id: `avatar_${user._id}_${Date.now()}`,
        transformation: {
          width: 300,
          height: 300,
          crop: 'fill',
          gravity: 'face',
          quality: 'auto'
        }
      });
    } 
    // Handle base64 image upload
    else if (req.body.image) {
      const base64Data = req.body.image.replace(/^data:image\/\w+;base64,/, '');
      const buffer = Buffer.from(base64Data, 'base64');
      
      uploadResult = await cloudinaryService.uploadBuffer(buffer, {
        folder: 'fridgewiseai/avatars',
        public_id: `avatar_${user._id}_${Date.now()}`,
        transformation: {
          width: 300,
          height: 300,
          crop: 'fill',
          gravity: 'face',
          quality: 'auto'
        }
      });
    }

    if (!uploadResult) {
      res.status(400).json({
        success: false,
        error: 'Failed to upload image'
      });
      return;
    }

    // Update user with new avatar
    const updatedUser = await User.findByIdAndUpdate(
      user._id,
      {
        avatar: {
          url: uploadResult.secure_url,
          publicId: uploadResult.public_id
        }
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
    console.error('Avatar upload error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to upload avatar'
    });
  }
};

export const deleteAvatar = async (req: Request, res: Response<APIResponse<any>>): Promise<void> => {
  try {
    const user = (req as any).user;

    // Get current user
    const currentUser = await User.findById(user._id);
    if (!currentUser) {
      res.status(404).json({
        success: false,
        error: 'User not found'
      });
      return;
    }

    // Check if user has avatar
    if (!currentUser.avatar?.publicId) {
      res.status(400).json({
        success: false,
        error: 'No avatar to delete'
      });
      return;
    }

    // Delete from Cloudinary
    await cloudinaryService.deleteImage(currentUser.avatar.publicId);

    // Remove avatar from user
    const updatedUser = await User.findByIdAndUpdate(
      user._id,
      {
        $unset: { avatar: 1 }
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
    console.error('Avatar deletion error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to delete avatar'
    });
  }
};