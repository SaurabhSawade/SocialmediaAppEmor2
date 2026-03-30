import { Request, Response, NextFunction } from "express";
import AuthService from "../services/auth.service";
import { ApiResponseHandler } from "../utils/api-response";
import { HttpStatus } from "../constants/http-status";
import { Messages } from "../constants/messages";
import { AuthenticatedRequest } from "../types/request";
import {
  RegisterDTO,
  LoginDTO,
  VerifyOTPDTO,
  ForgotPasswordDTO,
  ResetPasswordDTO,
  ChangePasswordDTO,
  RefreshTokenDTO,
  AuthResponseDTO,
} from "../types/dto/auth.dto";
import logger from "../config/logger";

export class AuthController {
  /**
   * Register a new user
   * POST /api/v1/auth/register
   */
  static async register(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const registerData: RegisterDTO = req.body;
      const result = await AuthService.register(registerData);

      ApiResponseHandler.created<AuthResponseDTO>(
        res,
        Messages.REGISTER_SUCCESS,
        result,
      );
    } catch (error) {
     return next(error);
    }
  }

  /**
   * Login user
   * POST /api/v1/auth/login
   */
  static async login(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const loginData: LoginDTO = req.body;
      const result = await AuthService.login(loginData);
      
      ApiResponseHandler.success<AuthResponseDTO>(
        res,
        Messages.LOGIN_SUCCESS,
        result,
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * Resend OTP for email verification
   * POST /api/v1/auth/resend-otp
   */
  static async resendOTP(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { identifier }: { identifier: string } = req.body;
      const result = await AuthService.resendOTP(identifier);

      ApiResponseHandler.success(res, result.message);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Verify OTP for email verification
   * POST /api/v1/auth/verify-otp
   */
  static async verifyOTP(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { identifier, otp }: VerifyOTPDTO = req.body;
      const result = await AuthService.verifyOTP(identifier, otp);

      ApiResponseHandler.success(res, result.message, {
        tokens: result.tokens,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Forgot password - send reset OTP
   * POST /api/v1/auth/forgot-password
   */
  static async forgotPassword(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { identifier }: ForgotPasswordDTO = req.body;
      const result = await AuthService.forgotPassword(identifier);

      ApiResponseHandler.success(res, result.message);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Reset password using OTP
   * POST /api/v1/auth/reset-password
   */
  static async resetPassword(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { identifier, otp, newPassword }: ResetPasswordDTO = req.body;
      const result = await AuthService.resetPassword(
        identifier,
        otp,
        newPassword,
      );

      ApiResponseHandler.success(res, result.message);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Change password for authenticated user
   * POST /api/v1/auth/change-password
   */
  static async changePassword(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const userId = req.user!.id;
      const { currentPassword, newPassword }: ChangePasswordDTO = req.body;
      const result = await AuthService.changePassword(
        userId,
        currentPassword,
        newPassword,
      );

      ApiResponseHandler.success(res, result.message);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Refresh access token
   * POST /api/v1/auth/refresh-token
   */
  static async refreshToken(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { refreshToken }: RefreshTokenDTO = req.body;
      const result = await AuthService.refreshToken(refreshToken);

      ApiResponseHandler.success(
        res,
        "Token refreshed successfully",
        result.tokens,
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * Logout user
   * POST /api/v1/auth/logout
   */
  static async logout(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const userId = req.user!.id;
      await AuthService.logout(userId);

      ApiResponseHandler.success(res, Messages.LOGOUT_SUCCESS);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get current authenticated user
   * GET /api/v1/auth/me
   */
  static async getMe(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const userId = req.user!.id;
      const user = await AuthService.getCurrentUser(userId);

      ApiResponseHandler.success(res, "User retrieved successfully", user);
    } catch (error) {
      next(error);
    }
  }
}
