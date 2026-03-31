export interface RegisterDTO {
  email?: string;
  phone?: string;
  password: string;
  username: string;
  fullName?: string;
}

export interface LoginDTO {
  identifier: string;
  password: string;
}

export interface VerifyOTPDTO {
  identifier: string;
  otp: string;
}

export interface ForgotPasswordDTO {
  identifier: string;
}

export interface ResetPasswordDTO {
  identifier: string;
  otp: string;
  newPassword: string;
  confirmPassword: string;
}

export interface ChangePasswordDTO {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}
export interface LogoutDTO {
  refreshToken: string;
  logoutAll?: boolean;
}

export interface RefreshTokenDTO {
  refreshToken: string;
}

export interface RevokeTokenDTO {
  token: string;
  revokeAll?: boolean;
}
export interface AuthResponseDTO {
  // user: {
  //   id: number;
  //   email?: string | null;
  //   phone?: string | null;
  //   username: string;
  //   fullName?: string | null;
  //   avatarUrl?: string | null;
  //   isVerified: boolean;
  // };
  tokens: {
    accessToken: string;
    refreshToken: string;
  };
}
