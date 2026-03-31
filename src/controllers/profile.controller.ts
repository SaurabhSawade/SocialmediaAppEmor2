import { Request, Response, NextFunction } from 'express';
import ProfileService from '../services/profile.service';
import { ApiResponseHandler } from '../utils/api-response';
import { AuthenticatedRequest } from '../types/request';
import { UpdateProfileDTO } from '../types/dto/user.dto';

export class ProfileController {
  /**
   * Update user profile
   * PUT /api/v1/profile
   */
  static async updateProfile(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const updateData: UpdateProfileDTO = req.body;
      
      const result = await ProfileService.updateProfile(userId, updateData);
      
      ApiResponseHandler.success(res, result.message, result.profile);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get profile by username
   * GET /api/v1/profile/:username
   */
  static async getProfileByUsername(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const username = Array.isArray(req.params.username) ? req.params.username[0] : req.params.username;
      const profile = await ProfileService.getProfileByUsername(username);
      
      ApiResponseHandler.success(res, 'Profile retrieved successfully', profile);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get current user's profile
   * GET /api/v1/profile/me
   */
  static async getMyProfile(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const profile = await ProfileService.getProfileByUserId(userId);
      
      ApiResponseHandler.success(res, 'Profile retrieved successfully', profile);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Check username availability
   * GET /api/v1/profile/check-username/:username
   */
  static async checkUsername(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const username = Array.isArray(req.params.username) ? req.params.username[0] : req.params.username;
      const ProfileRepository = (await import('../repositories/profile.repository')).default;
      const isAvailable = await ProfileRepository.checkUsernameAvailability(username);
      
      ApiResponseHandler.success(res, 'Username availability checked', {
        username,
        isAvailable,
      });
    } catch (error) {
      next(error);
    }
  }
}

export default ProfileController;