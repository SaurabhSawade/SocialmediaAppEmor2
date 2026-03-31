export interface UpdateProfileDTO {
  username?: string;
  fullName?: string;
  bio?: string;
  avatarUrl?: string;
  website?: string;
  gender?: string;
  isPrivate?: boolean;
}

export interface UpdateSettingsDTO {
  emailNotifications?: boolean;
  pushNotifications?: boolean;
}

export interface ChangeEmailDTO {
  newEmail: string;
  password: string;
  otp?: string;
}

export interface ChangePhoneDTO {
  newPhone: string;
  password: string;
  otp?: string;
}

export interface UserProfileResponseDTO {
  id: number;
  email?: string;
  phone?: string;
  username: string;
  fullName?: string;
  bio?: string;
  avatarUrl?: string;
  website?: string;
  gender?: string;
  isPrivate: boolean;
  isVerified: boolean;
  stats: {
    postsCount: number;
    followersCount: number;
    followingCount: number;
  };
  createdAt: Date;
  lastLoginAt?: Date;
}

export interface SessionResponseDTO {
  id: string;
  deviceInfo?: string;
  ipAddress?: string;
  lastActivity: Date;
  createdAt: Date;
  isCurrent: boolean;
}

export interface LogoutResponseDTO {
  message: string;
  revokedTokens: number;
}