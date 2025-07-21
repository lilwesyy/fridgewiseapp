import { Request, Response } from 'express';
import { User } from '../models/User';
import { Recipe } from '../models/Recipe';
import { cloudinaryService } from '../services/cloudinaryService';
import { APIResponse, DishPhotoUploadResponse } from '../types';
import sharp from 'sharp';

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

// Helper function to compress and optimize image for mobile
const compressImageForMobile = async (buffer: Buffer): Promise<Buffer> => {
  try {
    // Get image metadata
    const metadata = await sharp(buffer).metadata();
    
    // Determine optimal dimensions (max 1200px width, maintain aspect ratio)
    const maxWidth = 1200;
    const maxHeight = 1200;
    
    let width = metadata.width || maxWidth;
    let height = metadata.height || maxHeight;
    
    if (width > maxWidth || height > maxHeight) {
      const aspectRatio = width / height;
      if (width > height) {
        width = maxWidth;
        height = Math.round(maxWidth / aspectRatio);
      } else {
        height = maxHeight;
        width = Math.round(maxHeight * aspectRatio);
      }
    }

    // Compress and optimize the image
    const compressedBuffer = await sharp(buffer)
      .resize(width, height, {
        fit: 'inside',
        withoutEnlargement: true
      })
      .jpeg({
        quality: 85,
        progressive: true,
        mozjpeg: true
      })
      .toBuffer();

    return compressedBuffer;
  } catch (error) {
    console.error('Image compression error:', error);
    throw new Error('Failed to compress image');
  }
};

// Validate image file format and size
const validateImageFile = (file: Express.Multer.File): { isValid: boolean; error?: string } => {
  // Check file format
  const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png'];
  if (!allowedMimeTypes.includes(file.mimetype)) {
    return {
      isValid: false,
      error: 'Invalid file format. Only JPEG and PNG files are allowed.'
    };
  }

  // Check file size (max 10MB)
  const maxSize = 10 * 1024 * 1024; // 10MB
  if (file.size > maxSize) {
    return {
      isValid: false,
      error: 'File size too large. Maximum size allowed is 10MB.'
    };
  }

  return { isValid: true };
};

export const uploadDishPhoto = async (req: Request, res: Response<APIResponse<DishPhotoUploadResponse>>): Promise<void> => {
  try {
    const user = (req as any).user;
    const { recipeId } = req.body;

    // Validate required fields
    if (!req.file && !req.body.image) {
      res.status(400).json({
        success: false,
        error: 'No image provided'
      });
      return;
    }

    // Validate recipe ID if provided
    if (recipeId) {
      const recipe = await Recipe.findOne({ _id: recipeId, userId: user._id });
      if (!recipe) {
        res.status(404).json({
          success: false,
          error: 'Recipe not found or access denied'
        });
        return;
      }
    }

    let imageBuffer: Buffer;
    let originalSize: number = 0;

    // Handle file upload from multipart/form-data
    if (req.file) {
      // Validate file
      const validation = validateImageFile(req.file);
      if (!validation.isValid) {
        res.status(400).json({
          success: false,
          error: validation.error
        });
        return;
      }

      imageBuffer = req.file.buffer;
      originalSize = req.file.size;
    } 
    // Handle base64 image upload
    else if (req.body.image) {
      try {
        const base64Data = req.body.image.replace(/^data:image\/\w+;base64,/, '');
        imageBuffer = Buffer.from(base64Data, 'base64');
        originalSize = imageBuffer.length;

        // Validate size for base64 images
        const maxSize = 10 * 1024 * 1024; // 10MB
        if (originalSize > maxSize) {
          res.status(400).json({
            success: false,
            error: 'Image size too large. Maximum size allowed is 10MB.'
          });
          return;
        }
      } catch (error) {
        res.status(400).json({
          success: false,
          error: 'Invalid base64 image data'
        });
        return;
      }
    } else {
      res.status(400).json({
        success: false,
        error: 'No image provided'
      });
      return;
    }

    // Compress and optimize image
    let compressedBuffer: Buffer;
    let retryCount = 0;
    const maxRetries = 3;

    while (retryCount < maxRetries) {
      try {
        compressedBuffer = await compressImageForMobile(imageBuffer!);
        break;
      } catch (error) {
        retryCount++;
        if (retryCount >= maxRetries) {
          console.error('Image compression failed after retries:', error);
          res.status(500).json({
            success: false,
            error: 'Failed to process image. Please try again.'
          });
          return;
        }
        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
      }
    }

    // Upload to Cloudinary with retry logic
    let uploadResult;
    retryCount = 0;

    while (retryCount < maxRetries) {
      try {
        uploadResult = await cloudinaryService.uploadBuffer(compressedBuffer!, {
          folder: 'fridgewiseai/dish-photos',
          public_id: `dish_${user._id}_${Date.now()}`,
          transformation: {
            quality: 'auto',
            fetch_format: 'auto'
          }
        });
        break;
      } catch (error) {
        retryCount++;
        if (retryCount >= maxRetries) {
          console.error('Cloudinary upload failed after retries:', error);
          res.status(500).json({
            success: false,
            error: 'Failed to upload image. Please check your connection and try again.'
          });
          return;
        }
        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, 2000 * retryCount));
      }
    }

    if (!uploadResult) {
      res.status(500).json({
        success: false,
        error: 'Failed to upload image'
      });
      return;
    }

    // Get image dimensions for response
    const metadata = await sharp(compressedBuffer!).metadata();

    // Update recipe with dish photo URL if recipeId is provided
    if (recipeId) {
      try {
        // Check current number of photos and update atomically
        const updatedRecipe = await Recipe.findOneAndUpdate(
          { 
            _id: recipeId, 
            userId: user._id,
            $expr: { $lt: [{ $size: "$dishPhotos" }, 3] } // Only update if less than 3 photos
          },
          { 
            $push: {
              dishPhotos: {
                url: uploadResult.secure_url,
                publicId: uploadResult.public_id
              }
            },
            cookedAt: new Date() // Mark as cooked when photo is added
          },
          { new: true }
        );

        if (!updatedRecipe) {
          // Either recipe not found or already has 3 photos
          const existingRecipe = await Recipe.findOne({ _id: recipeId, userId: user._id });
          if (!existingRecipe) {
            // Delete uploaded image since we can't use it
            try {
              await cloudinaryService.deleteImage(uploadResult.public_id);
            } catch (deleteError) {
              console.error('Failed to cleanup uploaded image:', deleteError);
            }
            
            res.status(404).json({
              success: false,
              error: 'Recipe not found'
            });
            return;
          } else if (existingRecipe.dishPhotos.length >= 3) {
            // Delete uploaded image since we can't use it
            try {
              await cloudinaryService.deleteImage(uploadResult.public_id);
            } catch (deleteError) {
              console.error('Failed to cleanup uploaded image:', deleteError);
            }
            
            res.status(400).json({
              success: false,
              error: 'Maximum 3 photos allowed per recipe',
              code: 'PHOTO_LIMIT_EXCEEDED',
              currentCount: existingRecipe.dishPhotos.length,
              maxAllowed: 3
            });
            return;
          }
        }
        
        console.log(`Added dish photo to recipe ${recipeId}: ${uploadResult.secure_url}`);
      } catch (error) {
        console.error('Failed to update recipe with dish photo:', error);
        
        // Delete uploaded image since we can't use it
        try {
          await cloudinaryService.deleteImage(uploadResult.public_id);
        } catch (deleteError) {
          console.error('Failed to cleanup uploaded image:', deleteError);
        }
        
        res.status(400).json({
          success: false,
          error: error instanceof Error ? error.message : 'Failed to add photo to recipe'
        });
        return;
      }
    }

    // Prepare response data
    const responseData = {
      url: uploadResult.secure_url,
      publicId: uploadResult.public_id,
      originalSize,
      compressedSize: compressedBuffer!.length,
      dimensions: {
        width: metadata.width || 0,
        height: metadata.height || 0
      }
    };

    res.status(200).json({
      success: true,
      data: responseData,
      message: 'Dish photo uploaded successfully'
    });
  } catch (error: any) {
    console.error('Dish photo upload error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to upload dish photo'
    });
  }
};