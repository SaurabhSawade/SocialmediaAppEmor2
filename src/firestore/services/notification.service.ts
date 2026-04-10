import FirebaseRTDBService from '../../config/firebase-rtdb';
import { NotificationType, NotificationStatus } from '../../constants/enums';

interface NotificationData {
  id?: string;
  recipientId: number;
  senderId: number;
  type: NotificationType;
  message: string;
  referenceId?: number;
  referenceType?: string;
  status: NotificationStatus;
  createdAt: string;
  readAt?: string;
}

export class NotificationService {
  private static instance: NotificationService;

  private constructor() {}

  static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  private generateId(): string {
    return `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  async createNotification(
    recipientId: number,
    senderId: number,
    type: NotificationType,
    message: string,
    referenceId?: number,
    referenceType?: string
  ): Promise<NotificationData> {
    if (!FirebaseRTDBService.isReady()) {
      console.log('Firebase RTDB not configured, skipping notification');
      return {} as NotificationData;
    }

    const id = this.generateId();
    const now = new Date().toISOString();

    const notification: NotificationData = {
      id,
      recipientId,
      senderId,
      type,
      message,
      referenceId,
      referenceType,
      status: NotificationStatus.UNREAD,
      createdAt: now,
    };

    await FirebaseRTDBService.set(`notifications/${recipientId}/${id}`, notification);

    return notification;
  }

  async getNotifications(userId: number, limit: number = 50): Promise<NotificationData[]> {
    if (!FirebaseRTDBService.isReady()) {
      return [];
    }

    const snapshot = await FirebaseRTDBService.get(`notifications/${userId}`);
    if (!snapshot.exists()) {
      return [];
    }

    const notifications: NotificationData[] = [];
    snapshot.forEach((child: any) => {
      notifications.push({ id: child.key, ...child.val() });
    });

    return notifications
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, limit);
  }

  async getUnreadCount(userId: number): Promise<number> {
    if (!FirebaseRTDBService.isReady()) {
      return 0;
    }

    const snapshot = await FirebaseRTDBService.get(`notifications/${userId}`);
    if (!snapshot.exists()) {
      return 0;
    }

    let count = 0;
    snapshot.forEach((child: any) => {
      if (child.val().status === NotificationStatus.UNREAD) {
        count++;
      }
    });

    return count;
  }

  async markAsRead(userId: number, notificationId: string): Promise<void> {
    if (!FirebaseRTDBService.isReady()) {
      return;
    }
    await FirebaseRTDBService.update(`notifications/${userId}/${notificationId}`, {
      status: NotificationStatus.READ,
      readAt: new Date().toISOString(),
    });
  }

  async markAllAsRead(userId: number): Promise<void> {
    if (!FirebaseRTDBService.isReady()) {
      return;
    }

    const snapshot = await FirebaseRTDBService.get(`notifications/${userId}`);
    if (!snapshot.exists()) {
      return;
    }

    const updates: Record<string, any> = {};
    const now = new Date().toISOString();

    snapshot.forEach((child: any) => {
      if (child.val().status === NotificationStatus.UNREAD) {
        updates[`${child.key}/status`] = NotificationStatus.READ;
        updates[`${child.key}/readAt`] = now;
      }
    });

    await FirebaseRTDBService.update(`notifications/${userId}`, updates);
  }

  async deleteNotification(userId: number, notificationId: string): Promise<void> {
    if (!FirebaseRTDBService.isReady()) {
      return;
    }
    await FirebaseRTDBService.remove(`notifications/${userId}/${notificationId}`);
  }

  async clearAllNotifications(userId: number): Promise<void> {
    if (!FirebaseRTDBService.isReady()) {
      return;
    }
    await FirebaseRTDBService.remove(`notifications/${userId}`);
  }
}

export default NotificationService.getInstance();