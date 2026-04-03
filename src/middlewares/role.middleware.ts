import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types/request';
import { ApiResponseHandler } from '../utils/api-response';
import { HttpStatus } from '../constants/http-status';

export class RoleMiddleware {
  /**
   * Check if user has admin role
   */
  static isAdmin(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    if (!req.user) {
      return ApiResponseHandler.error(res, 'Unauthorized', HttpStatus.UNAUTHORIZED);
    }
    
    if (req.user.role !== 'ADMIN') {
      return ApiResponseHandler.error(res, 'Admin access required', HttpStatus.FORBIDDEN);
    }
    
    next();
  }
  
  /**
   * Check if user has specific role
   */
  static hasRole(roles: string[]) {
    return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
      if (!req.user) {
        return ApiResponseHandler.error(res, 'Unauthorized', HttpStatus.UNAUTHORIZED);
      }
      
      if (!roles.includes(req.user.role || 'USER')) {
        return ApiResponseHandler.error(res, `Access denied. Required role: ${roles.join(' or ')}`, HttpStatus.FORBIDDEN);
      }
      
      next();
    };
  }
  
  /**
   * Check if user is admin or the resource owner
   */
  static isAdminOrOwner(getUserIdFromParams: (req: AuthenticatedRequest) => number) {
    return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
      if (!req.user) {
        return ApiResponseHandler.error(res, 'Unauthorized', HttpStatus.UNAUTHORIZED);
      }
      
      const targetUserId = getUserIdFromParams(req);
      
      if (req.user.role === 'ADMIN' || req.user.id === targetUserId) {
        return next();
      }
      
      return ApiResponseHandler.error(res, 'Access denied. You can only access your own resources.', HttpStatus.FORBIDDEN);
    };
  }
}