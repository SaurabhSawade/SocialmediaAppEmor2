import { Request, Response, NextFunction } from "express";
import ProfileService from "../services/profile.service";
import { ApiResponseHandler } from "../utils/api-response";
import { AuthenticatedRequest } from "../types/request";
import { UpdateProfileDTO } from "../types/dto/profile.dto";
import logger from "../config/logger";

export class ProfileController {
  /**
   * Update user profile
   * PUT /api/v1/profile
   */
  static async updateProfile(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
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
  static async getProfileByUsername(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { username } = req.params;
      const profile = await ProfileService.getProfileByUsername(
        username as string,
      );

      ApiResponseHandler.success(
        res,
        "Profile retrieved successfully",
        profile,
      );
    } catch (error) {
      next(error);
    }
  }
}
