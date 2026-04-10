import { Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { AuthenticatedRequest } from "../types/request";
import { ApiResponseHandler } from "../utils/api-response";
import { HttpStatus } from "../constants/http-status";
import { Messages } from "../constants/messages";
import env from "../config/env";
import logger from "../config/logger";
import { FirestoreTokenRepository } from "../firestore";

export class AuthMiddleware {
  static async authenticate(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const authHeader = req.headers.authorization;

      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return ApiResponseHandler.error(
          res,
          Messages.UNAUTHORIZED,
          HttpStatus.UNAUTHORIZED,
        );
      }

      const token = authHeader.split(" ")[1];
      console.log('[DEBUG Auth] Token received:', token ? token.substring(0, 20) + '...' : 'none');
      
      if (!token) {
        console.log('[DEBUG Auth] No token provided');
        return ApiResponseHandler.error(res, Messages.UNAUTHORIZED, HttpStatus.UNAUTHORIZED);
      }
      
      const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET) as any;
      console.log('[DEBUG Auth] Decoded token:', decoded);

      req.user = {
        id: decoded.userId,
        email: decoded.email,
        phone: decoded.phone,
        role: decoded.role || 'USER',
      };

      next();
    } catch (error: any) {
      console.log('[DEBUG Auth] Error:', error.message || error);
      console.log('[DEBUG Auth] Error name:', error.name);
      
      if (error.name === 'TokenExpiredError') {
        return ApiResponseHandler.error(
          res,
          "Token expired",
          HttpStatus.UNAUTHORIZED,
        );
      }

      if (error instanceof jwt.JsonWebTokenError) {
        return ApiResponseHandler.error(
          res,
          Messages.INVALID_TOKEN,
          HttpStatus.UNAUTHORIZED,
        );
      }

      return ApiResponseHandler.error(
        res,
        Messages.UNAUTHORIZED,
        HttpStatus.UNAUTHORIZED,
      );
    }
  }

  static optionalAuth(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ) {
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.split(" ")[1];
      try {
        const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET) as any;
        req.user = {
          id: decoded.userId,
          email: decoded.email,
          phone: decoded.phone,
        };
      } catch (error) {
        // Invalid token, but i  don't throw error for optional auth
        logger.debug("Optional auth token invalid");
      }
    }

    next();
  }
}
