import { Response, NextFunction } from 'express';
import UserService from '../services/user.service';
import { ApiResponseHandler } from '../utils/api-response';
import { AuthenticatedRequest } from '../types/request';
import { UpdateProfileDTO, UpdateSettingsDTO } from '../types/dto/user.dto';
import { AppError } from '../utils/app-error';

export class UserController {
  /**
   * Get user profile
   * GET /api/v1/users/profile
   */
  static async getProfile(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const profile = await UserService.getUserProfile(userId);
      
      if (profile instanceof AppError) {
        throw profile;
      }
      
      ApiResponseHandler.success(res, 'Profile retrieved successfully', profile);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update user profile
   * PUT /api/v1/users/profile
   */
  static async updateProfile(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const updateData: UpdateProfileDTO = req.body;
      
      const result = await UserService.updateProfile(userId, updateData);
      
      if (result instanceof AppError) {
        throw result;
      }
      
      ApiResponseHandler.success(res, result.message, result.profile);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update avatar
   * POST /api/v1/users/avatar
   */
  static async updateAvatar(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const { avatarUrl, avatarKey } = req.body;
      
      if (!avatarUrl) {
        void ApiResponseHandler.error(res, 'Avatar URL is required', 400);
        return;
      }
      
      const result = await UserService.updateAvatar(userId, avatarUrl, avatarKey);
      
      ApiResponseHandler.success(res, result.message, { avatarUrl: result.avatarUrl });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Remove avatar
   * DELETE /api/v1/users/avatar
   */
  static async removeAvatar(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const result = await UserService.removeAvatar(userId);
      
      ApiResponseHandler.success(res, result.message);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update user settings
   * PUT /api/v1/users/settings
   */
  static async updateSettings(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const settingsData: UpdateSettingsDTO = req.body;
      
      const result = await UserService.updateSettings(userId, settingsData);
      
      ApiResponseHandler.success(res, result.message, result.settings);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Change email
   * POST /api/v1/users/change-email
   */
  static async changeEmail(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const { newEmail, password, otp } = req.body;
      
      const result = await UserService.changeEmail(userId, newEmail, password, otp);
      
      ApiResponseHandler.success(res, result.message);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Change phone number
   * POST /api/v1/users/change-phone
   */
  static async changePhone(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const { newPhone, password, otp } = req.body;
      
      const result = await UserService.changePhone(userId, newPhone, password, otp);
      
      ApiResponseHandler.success(res, result.message);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete account (soft delete)
   * DELETE /api/v1/users/account
   */
  static async deleteAccount(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const { password } = req.body;
      
      if (!password) {
        void ApiResponseHandler.error(res, 'Password is required to delete account', 400);
        return;
      }
      
      const result = await UserService.deleteAccount(userId, password);
      
      ApiResponseHandler.success(res, result.message);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get public profile by username
   * GET /api/v1/users/:username
   */
  static async getPublicProfile(req: any, res: Response, next: NextFunction): Promise<void> {
    try {
      const username = Array.isArray(req.params.username) ? req.params.username[0] : req.params.username;
      const currentUserId = req.user?.id;
      
      const profile = await UserService.getPublicProfile(username, currentUserId);
      
      if (profile instanceof AppError) {
        throw profile;
      }
      
      ApiResponseHandler.success(res, 'Profile retrieved successfully', profile);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get user stats
   * GET /api/v1/users/:userId/stats
   */
  static async getUserStats(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userIdParam = Array.isArray(req.params.userId) ? req.params.userId[0] : req.params.userId;
      const userId = parseInt(userIdParam);
      
      const stats = await UserService.getUserStats(userId);
      
      ApiResponseHandler.success(res, 'User stats retrieved successfully', stats);
    } catch (error) {
      next(error);
    }
  }
}

export default UserController;