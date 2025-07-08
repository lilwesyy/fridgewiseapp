import { Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { AuthRequest } from '../middleware/auth';
import { Analysis } from '../models/Analysis';
import { RecognizeService } from '../services/recognizeService';
import { APIResponse } from '@/types';

// Configure multer for image uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'image-' + uniqueSuffix + path.extname(file.originalname));
  }
});

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
    if (!req.file) {
      res.status(400).json({
        success: false,
        error: 'No image file provided'
      });
      return;
    }

    const user = req.user!;
    const imagePath = req.file.path;
    const imageUrl = `/uploads/${req.file.filename}`;

    // Create analysis record
    const analysis = new Analysis({
      imageUrl,
      userId: user._id,
      status: 'pending',
      processingTime: 0,
      ingredients: []
    });

    await analysis.save();

    // Perform image analysis
    const startTime = Date.now();
    const recognizeService = new RecognizeService();

    try {
      const ingredients = await recognizeService.analyzeImage(imagePath);
      const processingTime = Date.now() - startTime;

      // Update analysis with results
      analysis.ingredients = ingredients;
      analysis.status = 'completed';
      analysis.processingTime = processingTime;
      await analysis.save();

      res.status(200).json({
        success: true,
        data: {
          analysisId: analysis._id,
          ingredients,
          imageUrl,
          processingTime
        }
      });
    } catch (error: any) {
      console.error('Image analysis failed:', error);
      
      // Update analysis with error
      analysis.status = 'failed';
      analysis.errorMessage = error.message;
      analysis.processingTime = Date.now() - startTime;
      await analysis.save();

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

    // Delete image file
    const imagePath = path.join(__dirname, '../../uploads', path.basename(analysis.imageUrl));
    if (fs.existsSync(imagePath)) {
      fs.unlinkSync(imagePath);
    }

    // Delete analysis record
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