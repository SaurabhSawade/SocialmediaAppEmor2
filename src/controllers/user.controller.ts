import { Response, NextFunction } from "express";
import UserService from "../services/user.service";
import { ApiResponseHandler } from "../utils/api-response";
import { AuthenticatedRequest } from "../types/request";
import logger from "../config/logger";

export class UserController {
  /**
   * Get user profile
   * GET /api/v1/users/profile
   */
  static async getProfile(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const userId = req.user!.id;
      const profile = await UserService.getUserProfile(userId);

      ApiResponseHandler.success(
        res,
        "Profile retrieved successfully",
        profile,
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * Soft delete user account
   * DELETE /api/v1/users/account
   */
  static async deleteAccount(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const userId = req.user!.id;
      const result = await UserService.softDeleteUser(userId);

      ApiResponseHandler.success(res, result.message);
    } catch (error) {
      next(error);
    }
  }
}
