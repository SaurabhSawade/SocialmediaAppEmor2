import { Router } from 'express';
import { NotificationController } from '../../controllers/notification.controller';
import { AuthMiddleware } from '../../middlewares/auth.middleware';

const router = Router();

router.get(
  '/notifications',
  AuthMiddleware.authenticate,
  NotificationController.getNotifications
);

router.get(
  '/notifications/unread-count',
  AuthMiddleware.authenticate,
  NotificationController.getUnreadCount
);

router.put(
  '/notifications/:notificationId/read',
  AuthMiddleware.authenticate,
  NotificationController.markAsRead
);

router.put(
  '/notifications/read-all',
  AuthMiddleware.authenticate,
  NotificationController.markAllAsRead
);

router.delete(
  '/notifications/:notificationId',
  AuthMiddleware.authenticate,
  NotificationController.deleteNotification
);

router.delete(
  '/notifications/clear-all',
  AuthMiddleware.authenticate,
  NotificationController.clearAllNotifications
);

export default router;