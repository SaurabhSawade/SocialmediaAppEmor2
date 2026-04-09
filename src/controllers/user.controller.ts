import { Response, NextFunction } from 'express';
import UserService from '../services/user.service';
import { FirestoreUserService } from '../firestore';
import { ApiResponseHandler } from '../utils/api-response';
import { AuthenticatedRequest } from '../types/request';
import { UpdateProfileDTO, UpdateSettingsDTO } from '../types/dto/user.dto';
import { AppError } from '../utils/app-error';

export class UserController {
  static async getProfile(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      // const profile = await UserService.getUserProfile(userId);
      const profile = await FirestoreUserService.getUserProfile(userId);
      
      if (profile instanceof AppError) {
        throw profile;
      }
      
      ApiResponseHandler.success(res, 'Profile retrieved successfully', profile);
    } catch (error) {
      next(error);
    }
  }

  static async updateProfile(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const updateData: UpdateProfileDTO = req.body;
      
      // const result = await UserService.updateProfile(userId, updateData);
      const result = await FirestoreUserService.updateProfile(userId, updateData);
      
      if (result instanceof AppError) {
        throw result;
      }
      
      ApiResponseHandler.success(res, result.message, result.profile);
    } catch (error) {
      next(error);
    }
  }

  static async updateAvatar(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const { avatarUrl, avatarKey } = req.body;
      
      if (!avatarUrl) {
        void ApiResponseHandler.error(res, 'Avatar URL is required', 400);
        return;
      }
      
      // const result = await UserService.updateAvatar(userId, avatarUrl, avatarKey);
      const result = await FirestoreUserService.updateAvatar(userId, avatarUrl, avatarKey);
      
      ApiResponseHandler.success(res, result.message, { avatarUrl: result.avatarUrl });
    } catch (error) {
      next(error);
    }
  }

  static async removeAvatar(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      // const result = await UserService.removeAvatar(userId);
      const result = await FirestoreUserService.removeAvatar(userId);
      
      ApiResponseHandler.success(res, result.message);
    } catch (error) {
      next(error);
    }
  }

  static async updateSettings(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const settingsData: UpdateSettingsDTO = req.body;
      
      // const result = await UserService.updateSettings(userId, settingsData);
      const result = await FirestoreUserService.updateSettings(userId, settingsData);
      
      ApiResponseHandler.success(res, result.message, result.settings);
    } catch (error) {
      next(error);
    }
  }

  static async changeEmail(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const { newEmail, password, otp } = req.body;
      
      // const result = await UserService.changeEmail(userId, newEmail, password, otp);
      const result = await FirestoreUserService.changeEmail(userId, newEmail, password, otp);
      
      ApiResponseHandler.success(res, result.message);
    } catch (error) {
      next(error);
    }
  }

  static async changePhone(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const { newPhone, password, otp } = req.body;
      
      // const result = await UserService.changePhone(userId, newPhone, password, otp);
      const result = await FirestoreUserService.changePhone(userId, newPhone, password, otp);
      
      ApiResponseHandler.success(res, result.message);
    } catch (error) {
      next(error);
    }
  }

  static async deleteAccount(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const { password } = req.body;
      
      if (!password) {
        void ApiResponseHandler.error(res, 'Password is required to delete account', 400);
        return;
      }
      
      // const result = await UserService.deleteAccount(userId, password);
      const result = await FirestoreUserService.deleteAccount(userId, password);
      
      ApiResponseHandler.success(res, result.message);
    } catch (error) {
      next(error);
    }
  }

  static async getPublicProfile(req: any, res: Response, next: NextFunction): Promise<void> {
    try {
      const username = Array.isArray(req.params.username) ? req.params.username[0] : req.params.username;
      const currentUserId = req.user?.id;
      
      // const profile = await UserService.getPublicProfile(username, currentUserId);
      const profile = await FirestoreUserService.getPublicProfile(username, currentUserId);
      
      if (profile instanceof AppError) {
        throw profile;
      }
      
      ApiResponseHandler.success(res, 'Profile retrieved successfully', profile);
    } catch (error) {
      next(error);
    }
  }

  static async getUserStats(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userIdParam = Array.isArray(req.params.userId) ? req.params.userId[0] : req.params.userId;
      const userId = parseInt(userIdParam);
      
      // const stats = await UserService.getUserStats(userId);
      const stats = await FirestoreUserService.getUserStats(userId);
      
       ApiResponseHandler.success(res, 'User stats retrieved successfully', stats);
    } catch (error) {
      next(error);
    }
  }
}

export default UserController;
