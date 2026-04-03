import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import logger from '../config/logger';
import { AppError } from "./app-error";
import { Messages } from '../constants/messages';

export class ImageProcessor {
  /**
   * Process avatar image - resize and optimize
   */
  static async processAvatar(inputPath: string, outputPath: string): Promise<string> {
    try {
      await sharp(inputPath)
        .resize(400, 400, {
          fit: 'cover',
          position: 'center',
        })
        .jpeg({ quality: 85 })
        .toFile(outputPath);
      
      // Remove original file
      fs.unlinkSync(inputPath);
      
      return outputPath;
    } catch (error) {
      logger.error('Error processing avatar:', error);
      throw new AppError(Messages.AVATAR_UPLOAD_FAILED, { cause: error });
    }
  }
  
  /**
   * Process post image - create multiple sizes
   */
  static async processPostImage(
    inputPath: string,
    outputDir: string,
    filename: string
  ): Promise<{
    original: string;
    thumbnail: string;
    medium: string;
  }> {
    try {
      const baseName = path.parse(filename).name;
      const ext = '.jpg';
      
      const originalPath = path.join(outputDir, `${baseName}_original${ext}`);
      const thumbnailPath = path.join(outputDir, `${baseName}_thumb${ext}`);
      const mediumPath = path.join(outputDir, `${baseName}_medium${ext}`);
      
      // Original (max 1080px)
      await sharp(inputPath)
        .resize(1080, 1080, { fit: 'inside', withoutEnlargement: true })
        .jpeg({ quality: 85 })
        .toFile(originalPath);
      
      // Thumbnail (150px)
      await sharp(inputPath)
        .resize(150, 150, { fit: 'cover' })
        .jpeg({ quality: 70 })
        .toFile(thumbnailPath);
      
      // Medium (600px)
      await sharp(inputPath)
        .resize(600, 600, { fit: 'inside', withoutEnlargement: true })
        .jpeg({ quality: 80 })
        .toFile(mediumPath);
      
      // Remove original
      fs.unlinkSync(inputPath);
      
      return {
        original: `/uploads/posts/${baseName}_original${ext}`,
        thumbnail: `/uploads/posts/${baseName}_thumb${ext}`,
        medium: `/uploads/posts/${baseName}_medium${ext}`,
      };
    } catch (error) {
      logger.error('Error processing post image:', error);
      throw new AppError(Messages.POST_IMAGE_PROCESS_FAILED, { cause: error });
    }
  }
  
  /**
   * Process video - generate thumbnail
   */
  static async generateVideoThumbnail(
    videoPath: string,
    outputPath: string
  ): Promise<string> {
    // Note: For video thumbnail generation, you might want to use ffmpeg
    // This is a placeholder - implement with ffmpeg or use a library like fluent-ffmpeg
    return outputPath;
  }
  
  /**
   * Delete file
   */
  static async deleteFile(filePath: string): Promise<void> {
    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    } catch (error) {
      logger.error('Error deleting file:', error);
    }
  }
}