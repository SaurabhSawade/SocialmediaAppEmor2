import { Response, NextFunction } from 'express';
import AdminService from '../services/admin.service';
import { ApiResponseHandler } from '../utils/api-response';
import { AuthenticatedRequest } from '../types/request';
import { GetUsersQueryDTO } from '../types/dto/admin.dto';
import logger from '../config/logger';

export class AdminController {
  /**
   * Get all users with filters and hierarchy
   * GET /api/v1/admin/users
   */
  static async getAllUsers(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const query: GetUsersQueryDTO = {
        page: req.query.page ? parseInt(req.query.page as string) : 1,
        limit: req.query.limit ? parseInt(req.query.limit as string) : 20,
        search: req.query.search as string,
        status: req.query.status as any,
        startDate: req.query.startDate as string,
        endDate: req.query.endDate as string,
        orderBy: req.query.orderBy as string,
        orderType: req.query.orderType as any,
      };
      
      const result = await AdminService.getAllUsers(query);
      
      return ApiResponseHandler.success(res, 'Users retrieved successfully', result);
    } catch (error) {
      logger.error('Error in getAllUsers:', error);
      next(error);
    }
  }
  
  /**
   * Export users to CSV
   * GET /api/v1/admin/users/export
   */
  static async exportUsersToCSV(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const query: GetUsersQueryDTO = {
        search: req.query.search as string,
        status: req.query.status as any,
        startDate: req.query.startDate as string,
        endDate: req.query.endDate as string,
        orderBy: req.query.orderBy as string,
        orderType: req.query.orderType as any,
      };
      
      // const { csv, filename } = await AdminService.exportUsersToCSV(query);
      const {filePath, filename} = await AdminService.exportUsersToCSV(query);
      //how to return here
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
      res.sendFile(filePath);
      res.download(filePath, filename);
    } catch (error) {
      logger.error('Error in exportUsersToCSV:', error);
      next(error);
    }
  }
  
  /**
   * Get admin dashboard statistics
   * GET /api/v1/admin/stats
   */
  static async getAdminStats(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const stats = await AdminService.getAdminStats();
      
      return ApiResponseHandler.success(res, 'Admin stats retrieved successfully', stats);
    } catch (error) {
      logger.error('Error in getAdminStats:', error);
      next(error);
    }
  }
  
  /**
   * Get single user by ID
   * GET /api/v1/admin/users/:userId
   */
  static async getUserById(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userId = parseInt(req.params.userId as string);
      const result = await AdminService.getAllUsers({ page: 1, limit: 1, search: String(userId) });
      
      if (!result.users || result.users.length === 0) {
        return ApiResponseHandler.error(res, 'User not found', 404);
      }
      
      return ApiResponseHandler.success(res, 'User retrieved successfully', result.users[0]);
    } catch (error) {
      logger.error('Error in getUserById:', error);
      next(error);
    }
  }
  
  /**
   * Update user role
   * PUT /api/v1/admin/users/:userId/role
   */
  static async updateUserRole(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userId = parseInt(req.params.userId as string);
      const { role } = req.body;
      
      if (!role || !['USER', 'ADMIN'].includes(role)) {
        return ApiResponseHandler.error(res, 'Invalid role. Must be USER or ADMIN', 400);
      }
      
      if (userId === req.user!.id) {
        return ApiResponseHandler.error(res, 'You cannot change your own role', 400);
      }
      
      const prisma = (await import('../prisma/client')).default;
      const user = await prisma.user.update({
        where: { id: userId },
        data: { role },
        select: {
          id: true,
          email: true,
        //   username: true,
        //   fullName: true,
          role: true,
        },
      });
      
      return  ApiResponseHandler.success(res, `User role updated to ${role} successfully`, user);
    } catch (error) {
      logger.error('Error in updateUserRole:', error);
      next(error);
    }
  }
  
  /**
   * Permanently delete user
   * DELETE /api/v1/admin/users/:userId
   */
  static async deleteUserPermanently(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userId = parseInt(req.params.userId as string);
      
      if (userId === req.user!.id) {
        return ApiResponseHandler.error(res, 'You cannot delete your own account', 400);
      }
      
      const prisma = (await import('../prisma/client')).default;
      
      await prisma.$transaction([
        prisma.savedPost.deleteMany({ where: { userId } }),
        prisma.like.deleteMany({ where: { userId } }),
        prisma.comment.deleteMany({ where: { userId } }),
        prisma.post.deleteMany({ where: { authorId: userId } }),
        prisma.follow.deleteMany({ where: { followerId: userId } }),
        prisma.follow.deleteMany({ where: { followingId: userId } }),
        prisma.token.deleteMany({ where: { userId } }),
        prisma.session.deleteMany({ where: { userId } }),
        prisma.oTP.deleteMany({ where: { userId } }),
        prisma.user.delete({ where: { id: userId } }),
      ]);
      
     return  ApiResponseHandler.success(res, 'User permanently deleted successfully');
    } catch (error) {
      logger.error('Error in deleteUserPermanently:', error);
      next(error);
    }
  }
}

export default AdminController;