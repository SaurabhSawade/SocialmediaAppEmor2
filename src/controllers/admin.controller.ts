import { Response, NextFunction } from 'express';
import AdminService from '../services/admin.service';
import { FirestoreAdminService } from '../firestore';
import { ApiResponseHandler } from '../utils/api-response';
import { AuthenticatedRequest } from '../types/request';
import { GetUsersQueryDTO } from '../types/dto/admin.dto';
import logger from '../config/logger';
import excelService from '../services/excel.service';
import { HttpStatus } from '../constants/http-status';

export class AdminController {
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
      
      // const result = await AdminService.getAllUsers(query);
      const result = await FirestoreAdminService.getAllUsers(query);
      
      return ApiResponseHandler.success(res, 'Users retrieved successfully', result);
    } catch (error) {
      logger.error('Error in getAllUsers:', error);
      next(error);
    }
  }

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

      // const { filePath, filename } = await AdminService.exportUsersToExcel(query);
      const { filePath, filename } = await FirestoreAdminService.exportUsersToExcel(query);

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');

      return res.download(filePath, filename, (err) => {
        if (err) {
          logger.error("File download error:", err);
          next(err);
        }
      });

    } catch (error) {
      logger.error('Error in exportUsersToCSV:', error);
      next(error);
    }
  }

  static async exportUsersToExcel(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const query: GetUsersQueryDTO = {
        search: req.query.search as string,
        status: req.query.status as any,
        startDate: req.query.startDate as string,
        endDate: req.query.endDate as string,
        orderBy: req.query.orderBy as string,
        orderType: req.query.orderType as any,
      };
      
      const { filePath, filename } = await excelService.exportUsersToExcel(query);
      
      return res.download(filePath, filename, (err) => {
        if (err) {
          logger.error('Error downloading file:', err);
          next(err);
        }
      });
    } catch (error) {
      logger.error('Error in exportUsersToExcel:', error);
      next(error);
    }
  }
  
  static async importUsersFromExcel(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.file) {
        return ApiResponseHandler.error(res, 'Please upload an Excel file', HttpStatus.BAD_REQUEST);
      }
      
      const result = await excelService.importUsersFromExcel(req.file.path);
      
      return ApiResponseHandler.success(res, 'Import completed', { fileUrl: result.fileUrl });
    } catch (error) {
      logger.error('Error in importUsersFromExcel:', error);
      next(error);
    }
  }
  
  static async downloadImportTemplate(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { filePath, filename } = await excelService.downloadImportTemplate();
      
    return res.download(filePath, filename, (err) => {
        if (err) {
          logger.error('Error downloading template:', err);
          next(err);
        }
      });
    } catch (error) {
      logger.error('Error in downloadImportTemplate:', error);
      next(error);
    }
  }

  static async getAdminStats(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      // const stats = await AdminService.getAdminStats();
      const stats = await FirestoreAdminService.getAdminStats();
      
      return ApiResponseHandler.success(res, 'Admin stats retrieved successfully', stats);
    } catch (error) {
      logger.error('Error in getAdminStats:', error);
      next(error);
    }
  }
  
  static async getUserById(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userId = parseInt(req.params.userId as string);
      // const user = await AdminService.getUserById(userId);
      const user = await FirestoreAdminService.getUserById(userId);
      
      return ApiResponseHandler.success(res, 'User retrieved successfully', user);
    } catch (error) {
      logger.error('Error in getUserById:', error);
      next(error);
    }
  }
  
  static async updateUserRole(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userId = parseInt(req.params.userId as string);
      const { role } = req.body;
      
      if (!role || !['USER', 'ADMIN'].includes(role)) {
        return ApiResponseHandler.error(res, 'Invalid role. Must be USER or ADMIN', 400);
      }
      
      // const user = await AdminService.updateUserRole(userId, role, req.user!.id);
      const user = await FirestoreAdminService.updateUserRole(userId, role, req.user!.id);
      
      return  ApiResponseHandler.success(res, `User role updated to ${role} successfully`, user);
    } catch (error) {
      logger.error('Error in updateUserRole:', error);
      next(error);
    }
  }
  
  static async deleteUserPermanently(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userId = parseInt(req.params.userId as string);
      
      // await AdminService.deleteUserPermanently(userId, req.user!.id);
      await FirestoreAdminService.deleteUserPermanently(userId, req.user!.id);
      
      return  ApiResponseHandler.success(res, 'User permanently deleted successfully');
    } catch (error) {
      logger.error('Error in deleteUserPermanently:', error);
      next(error);
    }
  }
}

export default AdminController;
