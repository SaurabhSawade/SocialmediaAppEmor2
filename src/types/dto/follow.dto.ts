export interface FollowResponseDTO {
  id: number;
  follower: {
    id: number;
    username: string;
    fullName?: string;
    avatarUrl?: string;
    isPrivate: boolean;
  };
  following: {
    id: number;
    username: string;
    fullName?: string;
    avatarUrl?: string;
    isPrivate: boolean;
  };
  createdAt: Date;
}

export interface FollowStatsDTO {
  followersCount: number;
  followingCount: number;
}

export interface FollowUserDTO {
  userId: number;
}

export interface GetFollowersDTO {
  userId: number;
  page?: number;
  limit?: number;
}

export interface FollowerListResponseDTO {
  users: {
    id: number;
    username: string;
    fullName?: string;
    avatarUrl?: string;
    bio?: string;
    isPrivate: boolean;
    isFollowedByCurrentUser: boolean;
    followedAt: Date;
  }[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}