import { v2 as cloudinary } from 'cloudinary';
import { UploadApiResponse, UploadApiErrorResponse } from 'cloudinary';

export class CloudinaryService {
  constructor() {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });
  }

  async uploadImage(
    filePath: string,
    options: {
      folder?: string;
      public_id?: string;
      transformation?: any;
      resource_type?: 'image' | 'video' | 'raw' | 'auto';
    } = {}
  ): Promise<UploadApiResponse> {
    try {
      const defaultOptions = {
        folder: 'fridgewiseai',
        resource_type: 'image' as const,
        quality: 'auto' as const,
        // Rimuovo format: 'auto' che causa l'errore
        ...options,
      };

      const result = await cloudinary.uploader.upload(filePath, defaultOptions);
      return result;
    } catch (error) {
      console.log('Cloudinary upload error:', error);
      throw new Error('Failed to upload image to Cloudinary');
    }
  }

  async uploadBuffer(
    buffer: Buffer,
    options: {
      folder?: string;
      public_id?: string;
      transformation?: any;
      resource_type?: 'image' | 'video' | 'raw' | 'auto';
    } = {}
  ): Promise<UploadApiResponse> {
    try {
      const defaultOptions = {
        folder: 'fridgewiseai',
        resource_type: 'image' as const,
        quality: 'auto' as const,
        // Rimuovo format: 'auto' che causa l'errore
        ...options,
      };

      return new Promise((resolve, reject) => {
        cloudinary.uploader.upload_stream(
          defaultOptions,
          (error: UploadApiErrorResponse | undefined, result: UploadApiResponse | undefined) => {
            if (error) {
              reject(error);
            } else if (result) {
              resolve(result);
            } else {
              reject(new Error('Unknown error occurred during upload'));
            }
          }
        ).end(buffer);
      });
    } catch (error) {
      console.log('Cloudinary buffer upload error:', error);
      throw new Error('Failed to upload image buffer to Cloudinary');
    }
  }

  async deleteImage(publicId: string): Promise<any> {
    try {
      const result = await cloudinary.uploader.destroy(publicId);
      return result;
    } catch (error) {
      console.log('Cloudinary delete error:', error);
      throw new Error('Failed to delete image from Cloudinary');
    }
  }

  generateUrl(publicId: string, transformation?: any): string {
    return cloudinary.url(publicId, {
      transformation,
      secure: true,
    });
  }

  generateTransformationUrl(
    publicId: string,
    width?: number,
    height?: number,
    crop?: string
  ): string {
    return cloudinary.url(publicId, {
      transformation: {
        width,
        height,
        crop: crop || 'fill',
        quality: 'auto' as const,
        // Rimuovo format: 'auto' che causa problemi
      },
      secure: true,
    });
  }
}

export const cloudinaryService = new CloudinaryService();