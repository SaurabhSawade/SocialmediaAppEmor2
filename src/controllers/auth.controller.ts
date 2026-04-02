import { Request, Response, NextFunction } from "express";
import AuthService from "../services/auth.service";
import { ApiResponseHandler } from "../utils/api-response";
import { HttpStatus } from "../constants/http-status";
import { Messages } from "../constants/messages";
import { AuthenticatedRequest } from "../types/request";
import { AppError } from "../utils/app-error";
import {
  RegisterDTO,
  LoginDTO,
  LogoutDTO,
  VerifyOTPDTO,
  ForgotPasswordDTO,
  ResetPasswordDTO,
  ChangePasswordDTO,
  RefreshTokenDTO,
  AuthResponseDTO,
} from "../types/dto/auth.dto";

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
      return next(error);
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
      if(!result) {
        ApiResponseHandler.error(res, 'Unable to resend OTP. Please try again later.', HttpStatus.INTERNAL_SERVER_ERROR);
        return;
      }
      const message = typeof result === 'object' ? result.message : 'OTP resent successfully';
      ApiResponseHandler.success(res, message);
    } catch (error) {
      return next(error);
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
      return next(error);
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
      return next(error);
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
      console.log('ResetPassword called with:', {
        body: req.body,
        path: req.path,
        method: req.method,
        headers: req.headers,
      });

      const { identifier, otp, newPassword }: ResetPasswordDTO = req.body;

      if (!identifier || !otp || !newPassword) {
        throw new AppError('Missing required fields: identifier, otp, and newPassword are required');
      }

      const result = await AuthService.resetPassword(
        identifier,
        otp,
        newPassword,
      );

      ApiResponseHandler.success(res, result.message);
    } catch (error) {
      console.error('ResetPassword error:', error);
      return next(error);
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
      return next(error);
    }
  }

  /**
   * Change email for authenticated user
   * POST /api/v1/auth/change-email
   */
  static async changeEmail(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const userId = req.user!.id;
      const { newEmail, password }: { newEmail: string; password: string } = req.body;
      const result = await AuthService.changeEmail(userId, password, newEmail);

      ApiResponseHandler.success(res, result.message);
    } catch (error) {
      return next(error);
    }
  }

  /**
   * Refresh access token
   * POST /api/v1/auth/refresh-token
   */
  static async refreshToken(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { refreshToken }: RefreshTokenDTO = req.body;
      
      const reqInfo = {
        ip: req.ip,
        userAgent: req.get('user-agent'),
      };
      
      const result = await AuthService.refreshToken(refreshToken, reqInfo);
      
      ApiResponseHandler.success(res, 'Token refreshed successfully', result.tokens);
    } catch (error) {
      next(error);
    }
  }
  

  /**
   * Logout user
   * POST /api/v1/auth/logout
   */
   static async logout(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { refreshToken, logoutAll = false }: LogoutDTO = req.body;
      
      if (!refreshToken) {
        ApiResponseHandler.error(res, 'Refresh token required', HttpStatus.BAD_REQUEST);
        return;
      }

      // Extract access token from Authorization header
      const authHeader = req.headers.authorization;
      const accessToken = authHeader?.startsWith('Bearer ') 
        ? authHeader.split(' ')[1] 
        : undefined;
      
      const result = await AuthService.logout(refreshToken, logoutAll, accessToken);
      
      ApiResponseHandler.success(res, result.message, { revokedTokens: result.revokedTokens });
    } catch (error) {
      next(error);
    }
  }

    static async getSessions(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const refreshToken = req.headers['x-refresh-token'] as string;
      
      const sessions = await AuthService.getSessions(userId, refreshToken);
      
      ApiResponseHandler.success(res, 'Sessions retrieved successfully', sessions);
    } catch (error) {
      next(error);
    }
  }

    static async revokeSession(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const sessionId = Array.isArray(req.params.sessionId) ? req.params.sessionId[0] : req.params.sessionId;
      const refreshToken = req.headers['x-refresh-token'] as string;
      
      const result = await AuthService.revokeSession(userId, sessionId, refreshToken);
      
      ApiResponseHandler.success(res, result.message);
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
      return next(error);
    }
  }
}