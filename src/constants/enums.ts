export enum OTPType {
  EMAIL_VERIFICATION = "EMAIL_VERIFICATION",
  PHONE_VERIFICATION = "PHONE_VERIFICATION",
  PASSWORD_RESET = "PASSWORD_RESET",
}

export enum AccountStatus {
  ACTIVE = "ACTIVE",
  SUSPENDED = "SUSPENDED",
  DELETED = "DELETED",
}

export enum MediaType {
  IMAGE = "IMAGE",
  VIDEO = "VIDEO",
}

export enum MessageType {
  TEXT = "TEXT",
  IMAGE = "IMAGE",
  VIDEO = "VIDEO",
}

export enum TokenType {
  ACCESS = "ACCESS",
  REFRESH = "REFRESH",
  PASSWORD_RESET = "PASSWORD_RESET",
  EMAIL_VERIFICATION = "EMAIL_VERIFICATION",
}

export enum NotificationType {
  FOLLOW = "FOLLOW",
  LIKE = "LIKE",
  COMMENT = "COMMENT",
  POST = "POST",
  MENTION = "MENTION",
}

export enum NotificationStatus {
  UNREAD = "UNREAD",
  READ = "READ",
}

export const OTP_EXPIRY_MINUTES = 10000;
export const OTP_LENGTH = 6;
