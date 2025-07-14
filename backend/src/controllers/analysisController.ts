import { Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { AuthRequest } from '../middleware/auth';
import { Analysis } from '../models/Analysis';
import { USDARecognizeService } from '../services/usdaRecognizeService';
import { APIResponse } from '@/types';

// Configure multer for memory storage
const storage = multer.memoryStorage();

const fileFilter = (req: any, file: any, cb: any) => {
  const allowedMimes = ['image/jpeg', 'image/png', 'image/jpg'];
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPEG, PNG and JPG are allowed.'), false);
  }
};

export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE || '10485760') // 10MB default
  }
});

export const analyzeImage = async (req: AuthRequest, res: Response<APIResponse<any>>): Promise<void> => {
  try {
    console.log('🔍 analyzeImage called');
    console.log('📄 req.file:', req.file);
    console.log('📦 req.body:', req.body);
    console.log('📋 req.headers:', req.headers);
    
    if (!req.file) {
      console.log('❌ No file received');
      res.status(400).json({
        success: false,
        error: 'No image file provided'
      });
      return;
    }
    
    console.log('✅ File received:', req.file.originalname, req.file.size, 'bytes');

    const user = req.user!;
    
    // Create temporary file for recognition service
    const tempDir = path.join(__dirname, '../../temp');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
    
    const tempFilePath = path.join(tempDir, `temp_${Date.now()}.jpg`);
    fs.writeFileSync(tempFilePath, req.file.buffer);
    
    // Perform image analysis FIRST
    console.log('🔍 Starting USDA-enhanced image recognition...');
    const startTime = Date.now();
    const recognizeService = new USDARecognizeService();

    try {
      const ingredients = await recognizeService.analyzeImage(tempFilePath);
      
      // Clean up temporary file
      fs.unlinkSync(tempFilePath);
      const processingTime = Date.now() - startTime;

      // Return results directly without Cloudinary
      console.log('✅ Image analysis completed successfully');
      
      // Only create analysis record if ingredients were found
      if (ingredients && ingredients.length > 0) {
        console.log(`🎯 Found ${ingredients.length} ingredients - creating analysis record`);
        
        const analysis = new Analysis({
          userId: user._id,
          status: 'completed',
          processingTime,
          ingredients,
          // No imageUrl or cloudinaryPublicId anymore
        });

        await analysis.save();
        
        res.status(200).json({
          success: true,
          data: {
            analysisId: analysis._id,
            ingredients,
            processingTime
          }
        });
      } else {
        console.log('⚠️ No ingredients found in image');
        res.status(200).json({
          success: true,
          data: {
            ingredients: [],
            processingTime,
            message: 'No ingredients found in image'
          }
        });
      }
    } catch (error: any) {
      console.error('❌ Image analysis failed:', error);
      
      // Clean up temporary file if it exists
      if (fs.existsSync(tempFilePath)) {
        fs.unlinkSync(tempFilePath);
      }
      
      res.status(500).json({
        success: false,
        error: 'Image analysis failed'
      });
    }
  } catch (error: any) {
    console.error('Error in analyzeImage:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Server error'
    });
  }
};

export const getAnalyses = async (req: AuthRequest, res: Response<APIResponse<any>>): Promise<void> => {
  try {
    const user = req.user!;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const analyses = await Analysis.find({ userId: user._id })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Analysis.countDocuments({ userId: user._id });

    res.status(200).json({
      success: true,
      data: {
        analyses,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get analyses'
    });
  }
};

export const getAnalysis = async (req: AuthRequest, res: Response<APIResponse<any>>): Promise<void> => {
  try {
    const user = req.user!;
    const { id } = req.params;

    const analysis = await Analysis.findOne({ _id: id, userId: user._id });

    if (!analysis) {
      res.status(404).json({
        success: false,
        error: 'Analysis not found'
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: analysis
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get analysis'
    });
  }
};

export const deleteAnalysis = async (req: AuthRequest, res: Response<APIResponse<any>>): Promise<void> => {
  try {
    const user = req.user!;
    const { id } = req.params;

    const analysis = await Analysis.findOne({ _id: id, userId: user._id });

    if (!analysis) {
      res.status(404).json({
        success: false,
        error: 'Analysis not found'
      });
      return;
    }

    // Delete analysis record (no more Cloudinary cleanup needed)
    await Analysis.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: 'Analysis deleted successfully'
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to delete analysis'
    });
  }
};