import { Request, Response } from 'express';
import { uploadDishPhoto } from '../uploadController';
import { Recipe } from '../../models/Recipe';
import { cloudinaryService } from '../../services/cloudinaryService';
import sharp from 'sharp';

// Mock dependencies
jest.mock('../../models/Recipe');
jest.mock('../../services/cloudinaryService');
jest.mock('sharp');

const mockRecipe = Recipe as jest.Mocked<typeof Recipe>;
const mockCloudinaryService = cloudinaryService as jest.Mocked<typeof cloudinaryService>;
const mockSharp = sharp as jest.MockedFunction<typeof sharp>;

describe('uploadDishPhoto', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockJson: jest.Mock;
  let mockStatus: jest.Mock;

  beforeEach(() => {
    mockJson = jest.fn();
    mockStatus = jest.fn().mockReturnValue({ json: mockJson });
    
    mockReq = {
      user: { _id: 'user123' },
      body: {},
      file: undefined
    } as any;
    
    mockRes = {
      status: mockStatus,
      json: mockJson
    };

    // Reset all mocks
    jest.clearAllMocks();
  });

  describe('Input Validation', () => {
    it('should return 400 if no image is provided', async () => {
      await uploadDishPhoto(mockReq as Request, mockRes as Response);

      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        error: 'No image provided'
      });
    });

    it('should return 404 if recipe not found when recipeId provided', async () => {
      mockReq.body = { recipeId: 'recipe123' };
      mockReq.file = {
        buffer: Buffer.from('fake-image-data'),
        mimetype: 'image/jpeg',
        size: 1024
      } as Express.Multer.File;

      mockRecipe.findOne.mockResolvedValue(null);

      await uploadDishPhoto(mockReq as Request, mockRes as Response);

      expect(mockStatus).toHaveBeenCalledWith(404);
      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        error: 'Recipe not found or access denied'
      });
    });

    it('should return 400 if recipe already has 3 photos', async () => {
      mockReq.body = { recipeId: 'recipe123' };
      mockReq.file = {
        buffer: Buffer.from('fake-image-data'),
        mimetype: 'image/jpeg',
        size: 1024
      } as Express.Multer.File;

      // Mock recipe with 3 photos already
      const mockRecipeWithMaxPhotos = {
        _id: 'recipe123',
        userId: 'user123',
        dishPhotos: [
          { url: 'photo1.jpg', publicId: 'id1' },
          { url: 'photo2.jpg', publicId: 'id2' },
          { url: 'photo3.jpg', publicId: 'id3' }
        ]
      };

      mockRecipe.findOne.mockResolvedValue(mockRecipeWithMaxPhotos);

      // Mock sharp operations
      const mockSharpInstance = {
        metadata: jest.fn().mockResolvedValue({ width: 800, height: 600 }),
        resize: jest.fn().mockReturnThis(),
        jpeg: jest.fn().mockReturnThis(),
        toBuffer: jest.fn().mockResolvedValue(Buffer.from('compressed-data'))
      };
      mockSharp.mockReturnValue(mockSharpInstance as any);

      // Mock Cloudinary upload
      mockCloudinaryService.uploadBuffer.mockResolvedValue({
        secure_url: 'https://cloudinary.com/image.jpg',
        public_id: 'dish_123'
      } as any);

      // Mock findOneAndUpdate to return null (indicating photo limit reached)
      mockRecipe.findOneAndUpdate.mockResolvedValue(null);

      await uploadDishPhoto(mockReq as Request, mockRes as Response);

      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        error: 'Maximum 3 photos allowed per recipe'
      });

      // Verify that Cloudinary cleanup was called
      expect(mockCloudinaryService.deleteImage).toHaveBeenCalledWith('dish_123');
    });

    it('should validate file format - reject non-JPEG/PNG', async () => {
      mockReq.file = {
        buffer: Buffer.from('fake-image-data'),
        mimetype: 'image/gif',
        size: 1024
      } as Express.Multer.File;

      await uploadDishPhoto(mockReq as Request, mockRes as Response);

      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        error: 'Invalid file format. Only JPEG and PNG files are allowed.'
      });
    });

    it('should validate file size - reject files over 10MB', async () => {
      mockReq.file = {
        buffer: Buffer.from('fake-image-data'),
        mimetype: 'image/jpeg',
        size: 11 * 1024 * 1024 // 11MB
      } as Express.Multer.File;

      await uploadDishPhoto(mockReq as Request, mockRes as Response);

      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        error: 'File size too large. Maximum size allowed is 10MB.'
      });
    });

    it('should accept valid JPEG files', async () => {
      const mockBuffer = Buffer.from('fake-jpeg-data');
      mockReq.file = {
        buffer: mockBuffer,
        mimetype: 'image/jpeg',
        size: 1024
      } as Express.Multer.File;

      // Mock sharp operations
      const mockSharpInstance = {
        metadata: jest.fn().mockResolvedValue({ width: 800, height: 600 }),
        resize: jest.fn().mockReturnThis(),
        jpeg: jest.fn().mockReturnThis(),
        toBuffer: jest.fn().mockResolvedValue(Buffer.from('compressed-data'))
      };
      mockSharp.mockReturnValue(mockSharpInstance as any);

      // Mock Cloudinary upload
      mockCloudinaryService.uploadBuffer.mockResolvedValue({
        secure_url: 'https://cloudinary.com/image.jpg',
        public_id: 'dish_123'
      } as any);

      await uploadDishPhoto(mockReq as Request, mockRes as Response);

      expect(mockStatus).toHaveBeenCalledWith(200);
      expect(mockJson).toHaveBeenCalledWith({
        success: true,
        data: expect.objectContaining({
          url: 'https://cloudinary.com/image.jpg',
          publicId: 'dish_123'
        }),
        message: 'Dish photo uploaded successfully'
      });
    });

    it('should accept valid PNG files', async () => {
      const mockBuffer = Buffer.from('fake-png-data');
      mockReq.file = {
        buffer: mockBuffer,
        mimetype: 'image/png',
        size: 1024
      } as Express.Multer.File;

      // Mock sharp operations
      const mockSharpInstance = {
        metadata: jest.fn().mockResolvedValue({ width: 800, height: 600 }),
        resize: jest.fn().mockReturnThis(),
        jpeg: jest.fn().mockReturnThis(),
        toBuffer: jest.fn().mockResolvedValue(Buffer.from('compressed-data'))
      };
      mockSharp.mockReturnValue(mockSharpInstance as any);

      // Mock Cloudinary upload
      mockCloudinaryService.uploadBuffer.mockResolvedValue({
        secure_url: 'https://cloudinary.com/image.jpg',
        public_id: 'dish_123'
      } as any);

      await uploadDishPhoto(mockReq as Request, mockRes as Response);

      expect(mockStatus).toHaveBeenCalledWith(200);
    });
  });

  describe('Base64 Image Handling', () => {
    it('should handle valid base64 image data', async () => {
      const base64Data = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/2wBDAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwA/8A';
      
      mockReq.body = { image: base64Data };

      // Mock sharp operations
      const mockSharpInstance = {
        metadata: jest.fn().mockResolvedValue({ width: 800, height: 600 }),
        resize: jest.fn().mockReturnThis(),
        jpeg: jest.fn().mockReturnThis(),
        toBuffer: jest.fn().mockResolvedValue(Buffer.from('compressed-data'))
      };
      mockSharp.mockReturnValue(mockSharpInstance as any);

      // Mock Cloudinary upload
      mockCloudinaryService.uploadBuffer.mockResolvedValue({
        secure_url: 'https://cloudinary.com/image.jpg',
        public_id: 'dish_123'
      } as any);

      await uploadDishPhoto(mockReq as Request, mockRes as Response);

      expect(mockStatus).toHaveBeenCalledWith(200);
      expect(mockJson).toHaveBeenCalledWith({
        success: true,
        data: expect.objectContaining({
          url: 'https://cloudinary.com/image.jpg',
          publicId: 'dish_123'
        }),
        message: 'Dish photo uploaded successfully'
      });
    });

    it('should reject invalid base64 data', async () => {
      mockReq.body = { image: 'invalid-base64-data' };

      // Mock sharp to throw an error for invalid data
      const mockSharpInstance = {
        metadata: jest.fn().mockRejectedValue(new Error('Invalid image data')),
        resize: jest.fn().mockReturnThis(),
        jpeg: jest.fn().mockReturnThis(),
        toBuffer: jest.fn().mockResolvedValue(Buffer.from('compressed-data'))
      };
      mockSharp.mockReturnValue(mockSharpInstance as any);

      await uploadDishPhoto(mockReq as Request, mockRes as Response);

      expect(mockStatus).toHaveBeenCalledWith(500);
      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        error: 'Failed to process image. Please try again.'
      });
    });

    it('should reject base64 images over 10MB', async () => {
      // Create a large base64 string (over 10MB)
      const largeData = 'A'.repeat(11 * 1024 * 1024);
      const base64Data = `data:image/jpeg;base64,${Buffer.from(largeData).toString('base64')}`;
      
      mockReq.body = { image: base64Data };

      await uploadDishPhoto(mockReq as Request, mockRes as Response);

      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        error: 'Image size too large. Maximum size allowed is 10MB.'
      });
    });
  });

  describe('Image Compression', () => {
    it('should compress images larger than 1200px', async () => {
      const mockBuffer = Buffer.from('large-image-data');
      mockReq.file = {
        buffer: mockBuffer,
        mimetype: 'image/jpeg',
        size: 1024
      } as Express.Multer.File;

      // Mock sharp operations for large image
      const mockSharpInstance = {
        metadata: jest.fn().mockResolvedValue({ width: 2400, height: 1800 }),
        resize: jest.fn().mockReturnThis(),
        jpeg: jest.fn().mockReturnThis(),
        toBuffer: jest.fn().mockResolvedValue(Buffer.from('compressed-data'))
      };
      mockSharp.mockReturnValue(mockSharpInstance as any);

      // Mock Cloudinary upload
      mockCloudinaryService.uploadBuffer.mockResolvedValue({
        secure_url: 'https://cloudinary.com/image.jpg',
        public_id: 'dish_123'
      } as any);

      await uploadDishPhoto(mockReq as Request, mockRes as Response);

      expect(mockSharpInstance.resize).toHaveBeenCalledWith(1200, 900, {
        fit: 'inside',
        withoutEnlargement: true
      });
      expect(mockSharpInstance.jpeg).toHaveBeenCalledWith({
        quality: 85,
        progressive: true,
        mozjpeg: true
      });
    });

    it('should maintain aspect ratio when resizing', async () => {
      const mockBuffer = Buffer.from('wide-image-data');
      mockReq.file = {
        buffer: mockBuffer,
        mimetype: 'image/jpeg',
        size: 1024
      } as Express.Multer.File;

      // Mock sharp operations for wide image
      const mockSharpInstance = {
        metadata: jest.fn().mockResolvedValue({ width: 3000, height: 1000 }),
        resize: jest.fn().mockReturnThis(),
        jpeg: jest.fn().mockReturnThis(),
        toBuffer: jest.fn().mockResolvedValue(Buffer.from('compressed-data'))
      };
      mockSharp.mockReturnValue(mockSharpInstance as any);

      // Mock Cloudinary upload
      mockCloudinaryService.uploadBuffer.mockResolvedValue({
        secure_url: 'https://cloudinary.com/image.jpg',
        public_id: 'dish_123'
      } as any);

      await uploadDishPhoto(mockReq as Request, mockRes as Response);

      expect(mockSharpInstance.resize).toHaveBeenCalledWith(1200, 400, {
        fit: 'inside',
        withoutEnlargement: true
      });
    });

    it('should retry compression on failure', async () => {
      const mockBuffer = Buffer.from('problematic-image-data');
      mockReq.file = {
        buffer: mockBuffer,
        mimetype: 'image/jpeg',
        size: 1024
      } as Express.Multer.File;

      // Mock sharp to fail twice then succeed
      const mockSharpInstance = {
        metadata: jest.fn().mockResolvedValue({ width: 800, height: 600 }),
        resize: jest.fn().mockReturnThis(),
        jpeg: jest.fn().mockReturnThis(),
        toBuffer: jest.fn()
          .mockRejectedValueOnce(new Error('Compression failed'))
          .mockRejectedValueOnce(new Error('Compression failed'))
          .mockResolvedValueOnce(Buffer.from('compressed-data'))
      };
      mockSharp.mockReturnValue(mockSharpInstance as any);

      // Mock Cloudinary upload
      mockCloudinaryService.uploadBuffer.mockResolvedValue({
        secure_url: 'https://cloudinary.com/image.jpg',
        public_id: 'dish_123'
      } as any);

      await uploadDishPhoto(mockReq as Request, mockRes as Response);

      expect(mockSharpInstance.toBuffer).toHaveBeenCalledTimes(3);
      expect(mockStatus).toHaveBeenCalledWith(200);
    });

    it('should fail after max compression retries', async () => {
      const mockBuffer = Buffer.from('problematic-image-data');
      mockReq.file = {
        buffer: mockBuffer,
        mimetype: 'image/jpeg',
        size: 1024
      } as Express.Multer.File;

      // Mock sharp to always fail
      const mockSharpInstance = {
        metadata: jest.fn().mockResolvedValue({ width: 800, height: 600 }),
        resize: jest.fn().mockReturnThis(),
        jpeg: jest.fn().mockReturnThis(),
        toBuffer: jest.fn().mockRejectedValue(new Error('Compression failed'))
      };
      mockSharp.mockReturnValue(mockSharpInstance as any);

      await uploadDishPhoto(mockReq as Request, mockRes as Response);

      expect(mockSharpInstance.toBuffer).toHaveBeenCalledTimes(3);
      expect(mockStatus).toHaveBeenCalledWith(500);
      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        error: 'Failed to process image. Please try again.'
      });
    });
  });

  describe('Cloudinary Upload', () => {
    it('should upload to correct folder with proper naming', async () => {
      const mockBuffer = Buffer.from('image-data');
      mockReq.file = {
        buffer: mockBuffer,
        mimetype: 'image/jpeg',
        size: 1024
      } as Express.Multer.File;

      // Mock sharp operations
      const mockSharpInstance = {
        metadata: jest.fn().mockResolvedValue({ width: 800, height: 600 }),
        resize: jest.fn().mockReturnThis(),
        jpeg: jest.fn().mockReturnThis(),
        toBuffer: jest.fn().mockResolvedValue(Buffer.from('compressed-data'))
      };
      mockSharp.mockReturnValue(mockSharpInstance as any);

      // Mock Cloudinary upload
      mockCloudinaryService.uploadBuffer.mockResolvedValue({
        secure_url: 'https://cloudinary.com/image.jpg',
        public_id: 'dish_user123_1234567890'
      } as any);

      // Mock Date.now for consistent testing
      const mockDate = 1234567890;
      jest.spyOn(Date, 'now').mockReturnValue(mockDate);

      await uploadDishPhoto(mockReq as Request, mockRes as Response);

      expect(mockCloudinaryService.uploadBuffer).toHaveBeenCalledWith(
        Buffer.from('compressed-data'),
        {
          folder: 'fridgewiseai/dish-photos',
          public_id: `dish_user123_${mockDate}`,
          transformation: {
            quality: 'auto',
            fetch_format: 'auto'
          }
        }
      );
    });

    it('should retry upload on failure', async () => {
      const mockBuffer = Buffer.from('image-data');
      mockReq.file = {
        buffer: mockBuffer,
        mimetype: 'image/jpeg',
        size: 1024
      } as Express.Multer.File;

      // Mock sharp operations
      const mockSharpInstance = {
        metadata: jest.fn().mockResolvedValue({ width: 800, height: 600 }),
        resize: jest.fn().mockReturnThis(),
        jpeg: jest.fn().mockReturnThis(),
        toBuffer: jest.fn().mockResolvedValue(Buffer.from('compressed-data'))
      };
      mockSharp.mockReturnValue(mockSharpInstance as any);

      // Mock Cloudinary to fail twice then succeed
      mockCloudinaryService.uploadBuffer
        .mockRejectedValueOnce(new Error('Upload failed'))
        .mockRejectedValueOnce(new Error('Upload failed'))
        .mockResolvedValueOnce({
          secure_url: 'https://cloudinary.com/image.jpg',
          public_id: 'dish_123'
        } as any);

      await uploadDishPhoto(mockReq as Request, mockRes as Response);

      expect(mockCloudinaryService.uploadBuffer).toHaveBeenCalledTimes(3);
      expect(mockStatus).toHaveBeenCalledWith(200);
    });

    it('should fail after max upload retries', async () => {
      const mockBuffer = Buffer.from('image-data');
      mockReq.file = {
        buffer: mockBuffer,
        mimetype: 'image/jpeg',
        size: 1024
      } as Express.Multer.File;

      // Mock sharp operations
      const mockSharpInstance = {
        metadata: jest.fn().mockResolvedValue({ width: 800, height: 600 }),
        resize: jest.fn().mockReturnThis(),
        jpeg: jest.fn().mockReturnThis(),
        toBuffer: jest.fn().mockResolvedValue(Buffer.from('compressed-data'))
      };
      mockSharp.mockReturnValue(mockSharpInstance as any);

      // Mock Cloudinary to always fail
      mockCloudinaryService.uploadBuffer.mockRejectedValue(new Error('Upload failed'));

      await uploadDishPhoto(mockReq as Request, mockRes as Response);

      expect(mockCloudinaryService.uploadBuffer).toHaveBeenCalledTimes(3);
      expect(mockStatus).toHaveBeenCalledWith(500);
      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        error: 'Failed to upload image. Please check your connection and try again.'
      });
    });
  });

  describe('Response Data', () => {
    it('should return complete upload metadata', async () => {
      const mockBuffer = Buffer.from('image-data');
      const originalSize = 2048;
      const compressedSize = 1024;
      
      mockReq.file = {
        buffer: mockBuffer,
        mimetype: 'image/jpeg',
        size: originalSize
      } as Express.Multer.File;

      // Mock sharp operations
      const compressedBuffer = Buffer.alloc(compressedSize);
      const mockSharpInstance = {
        metadata: jest.fn().mockResolvedValue({ width: 800, height: 600 }),
        resize: jest.fn().mockReturnThis(),
        jpeg: jest.fn().mockReturnThis(),
        toBuffer: jest.fn().mockResolvedValue(compressedBuffer)
      };
      mockSharp.mockReturnValue(mockSharpInstance as any);

      // Mock Cloudinary upload
      mockCloudinaryService.uploadBuffer.mockResolvedValue({
        secure_url: 'https://cloudinary.com/image.jpg',
        public_id: 'dish_123'
      } as any);

      await uploadDishPhoto(mockReq as Request, mockRes as Response);

      expect(mockJson).toHaveBeenCalledWith({
        success: true,
        data: {
          url: 'https://cloudinary.com/image.jpg',
          publicId: 'dish_123',
          originalSize,
          compressedSize,
          dimensions: {
            width: 800,
            height: 600
          }
        },
        message: 'Dish photo uploaded successfully'
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle general errors gracefully', async () => {
      mockReq.file = {
        buffer: Buffer.from('image-data'),
        mimetype: 'image/jpeg',
        size: 1024
      } as Express.Multer.File;

      // Mock sharp to throw an unexpected error
      mockSharp.mockImplementation(() => {
        throw new Error('Unexpected error');
      });

      await uploadDishPhoto(mockReq as Request, mockRes as Response);

      expect(mockStatus).toHaveBeenCalledWith(500);
      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        error: 'Failed to process image. Please try again.'
      });
    });
  });
});