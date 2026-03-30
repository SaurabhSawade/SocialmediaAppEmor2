export interface UpdateProfileDTO {
  username?: string;
  fullName?: string;
  bio?: string;
  avatarUrl?: string;
}

export interface ProfileResponseDTO {
  id: number;
  userId: number;
  username: string;
  fullName?: string | null;
  bio?: string | null;
  avatarUrl?: string | null;
  createdAt: Date;
  updatedAt: Date;
}
