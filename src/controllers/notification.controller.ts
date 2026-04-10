import { Request, Response, NextFunction } from 'express';
import NotificationService from '../firestore/services/notification.service';
import FirestoreUserRepository from '../firestore/repositories/user.repository';
import { ApiResponseHandler } from '../utils/api-response';
import { HttpStatus } from '../constants/http-status';
import { Messages } from '../constants/messages';
import { AuthenticatedRequest } from '../types/request';

export class NotificationController {
  static async getNotifications(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 50;

      const notifications = await NotificationService.getNotifications(userId, limit);
      
      const notificationsWithSender = await Promise.all(
        notifications.map(async (notif: any) => {
          const sender = await FirestoreUserRepository.findById(notif.senderId);
          return {
            ...notif,
            senderUsername: sender?.profile?.username || 'Unknown',
            senderAvatar: sender?.profile?.avatarUrl || null,
          };
        })
      );

      const unreadCount = await NotificationService.getUnreadCount(userId);

      return ApiResponseHandler.success(res, Messages.NOTIFICATIONS_RETRIEVED, {
        notifications: notificationsWithSender,
        unreadCount,
        page,
        limit,
        total: notifications.length,
      });
    } catch (error) {
      return next(error);
    }
  }

  static async getUnreadCount(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const count = await NotificationService.getUnreadCount(userId);

      return ApiResponseHandler.success(res, Messages.NOTIFICATIONS_RETRIEVED, { count });
    } catch (error) {
      return next(error);
    }
  }

  static async markAsRead(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const notificationId = Array.isArray(req.params.notificationId) 
        ? req.params.notificationId[0] 
        : req.params.notificationId;

      await NotificationService.markAsRead(userId, notificationId);

      return ApiResponseHandler.success(res, Messages.NOTIFICATION_MARKED_READ);
    } catch (error) {
      return next(error);
    }
  }

  static async markAllAsRead(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;

      await NotificationService.markAllAsRead(userId);

      return ApiResponseHandler.success(res, Messages.NOTIFICATIONS_MARKED_READ);
    } catch (error) {
      return next(error);
    }
  }

  static async deleteNotification(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const notificationId = Array.isArray(req.params.notificationId) 
        ? req.params.notificationId[0] 
        : req.params.notificationId;

      await NotificationService.deleteNotification(userId, notificationId);

      return ApiResponseHandler.success(res, Messages.NOTIFICATION_DELETED);
    } catch (error) {
      return next(error);
    }
  }

  static async clearAllNotifications(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;

      await NotificationService.clearAllNotifications(userId);

      return ApiResponseHandler.success(res, Messages.NOTIFICATIONS_CLEARED);
    } catch (error) {
      return next(error);
    }
  }
}