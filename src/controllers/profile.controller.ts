import { Request, Response, NextFunction } from 'express';
import ProfileService from '../services/profile.service';
import { FirestoreProfileService } from '../firestore';
import { ApiResponseHandler } from '../utils/api-response';
import { AuthenticatedRequest } from '../types/request';
import { UpdateProfileDTO } from '../types/dto/user.dto';
import { AppError } from '../utils/app-error';

export class ProfileController {
  static async updateProfile(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const updateData: UpdateProfileDTO = req.body;
      
      // const result = await ProfileService.updateProfile(userId, updateData);
      const result = await FirestoreProfileService.updateProfile(userId, updateData);
      
      if (result instanceof AppError) {
        throw result;
      }
      
      ApiResponseHandler.success(res, result.message, result.profile);
    } catch (error) {
      next(error);
    }
  }

  static async getProfileByUsername(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const username = Array.isArray(req.params.username) ? req.params.username[0] : req.params.username;
      // const profile = await ProfileService.getProfileByUsername(username);
      const profile = await FirestoreProfileService.getProfileByUsername(username);
      
      ApiResponseHandler.success(res, 'Profile retrieved successfully', profile);
    } catch (error) {
      next(error);
    }
  }

  static async getMyProfile(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      // const profile = await ProfileService.getProfileByUserId(userId);
      const profile = await FirestoreProfileService.getProfileByUserId(userId);
      
      ApiResponseHandler.success(res, 'Profile retrieved successfully', profile);
    } catch (error) {
      next(error);
    }
  }

  static async uploadAvatar(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const file = req.file;
      
      if (!file) {
        return ApiResponseHandler.error(res, 'No file uploaded', 400);
      }
      
      // const result = await ProfileService.uploadAvatar(userId, file);
      const result = await FirestoreProfileService.uploadAvatar(userId, file);
      
      ApiResponseHandler.success(res, result.message, { avatarUrl: result.avatarUrl });
    } catch (error) {
      next(error);
    }
  }
  
  static async removeAvatar(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      // const result = await ProfileService.removeAvatar(userId);
      const result = await FirestoreProfileService.removeAvatar(userId);
      
      ApiResponseHandler.success(res, result.message);
    } catch (error) {
      next(error);
    }
  }

  static async checkUsername(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const username = Array.isArray(req.params.username) ? req.params.username[0] : req.params.username;
      // const result = await ProfileService.checkUsernameAvailability(username);
      const result = await FirestoreProfileService.checkUsernameAvailability(username);
      
      ApiResponseHandler.success(res, 'Username availability checked', result);
    } catch (error) {
      next(error);
    }
  }
}

export default ProfileController;
