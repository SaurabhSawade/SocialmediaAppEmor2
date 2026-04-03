import { Response, NextFunction } from 'express';
import prisma from '../prisma/client';
import { ApiResponseHandler } from '../utils/api-response';
import { AuthenticatedRequest } from '../types/request';
// import logger from '../config/logger';

export class AdminUserController {
  /**
   * Get all admin users
   * GET /api/v1/admin/users/admins
   */
  static async getAdminUsers(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const admins = await prisma.user.findMany({
        where: { role: 'ADMIN', deletedAt: null },
        select: {
          id: true,
          email: true,
        //   username: true,
        //   fullName: true,
          role: true,
          createdAt: true,
        },
      });
      
      ApiResponseHandler.success(res, 'Admin users retrieved successfully', admins);
    } catch (error) {
      next(error);
    }
  }
  
  /**
   * Make a user admin
   * PUT /api/v1/admin/users/:userId/make-admin
   */
  static async makeAdmin(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userId = parseInt(req.params.userId as string);
      
      const user = await prisma.user.update({
        where: { id: userId },
        data: { role: 'ADMIN' },
        select: {
          id: true,
          email: true,
        //   username: true,
        //   fullName: true,
        //   role: true,
        },
      });
      
      ApiResponseHandler.success(res, 'User promoted to admin successfully', user);
    } catch (error) {
      next(error);
    }
  }
  
  /**
   * Remove admin role from user
   * PUT /api/v1/admin/users/:userId/remove-admin
   */
  static async removeAdmin(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userId = parseInt(req.params.userId as string);
      
      // Don't allow removing your own admin role
      if (userId === req.user!.id) {
        return ApiResponseHandler.error(res, 'You cannot remove your own admin role', 400);
      }
      
      const user = await prisma.user.update({
        where: { id: userId },
        data: { role: 'USER' },
        select: {
          id: true,
          email: true,
        //   username: true,
        //   fullName: true,
        //   role: true,
        },
      });
      
      ApiResponseHandler.success(res, 'Admin role removed successfully', user);
    } catch (error) {
      next(error);
    }
  }
}