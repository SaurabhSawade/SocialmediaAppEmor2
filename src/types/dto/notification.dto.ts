import { NotificationType, NotificationStatus } from '../../constants/enums';

export interface NotificationDTO {
  id: string;
  recipientId: number;
  senderId: number;
  senderUsername?: string;
  senderAvatar?: string;
  type: NotificationType;
  message: string;
  referenceId?: number;
  referenceType?: string;
  status: NotificationStatus;
  createdAt: string;
  readAt?: string;
}

export interface GetNotificationsQuery {
  page?: number;
  limit?: number;
}

export interface NotificationResponseDTO {
  notifications: NotificationDTO[];
  unreadCount: number;
  page: number;
  limit: number;
  total: number;
}

export interface MarkReadParams {
  notificationId: string;
}