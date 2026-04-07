export interface GetUsersQueryDTO {
  page?: number;
  limit?: number;
  search?: string;
  status?: 'active' | 'deleted' | 'all';
  startDate?: string;
  endDate?: string;
  orderBy?: string;
  orderType?: 'asc' | 'desc';
}

export interface UserListResponseDTO {
  users: UserHierarchyDTO[];
  // pagination: {
  //   page: number;
  //   limit: number;
  //   total: number;
  //   totalPages: number;
  //   hasNext: boolean;
  //   hasPrev: boolean;
  // };
  // filters: {
  //   search?: string;
  //   status?: string;
  //   dateRange?: {
  //     startDate?: string;
  //     endDate?: string;
  //   };
  // };
}

export interface UserHierarchyDTO {
  id: number;
  email?: string;
  phone?: string;
  username: string;
  fullName?: string;
  bio?: string;
  avatarUrl?: string;
  role: string;
  isVerified: boolean;
  isActive: boolean;
  isPrivate: boolean;
  status: 'active' | 'deleted';
  // stats: {
  //   postsCount: number;
  //   commentsCount: number;
  //   likesReceived: number;
  //   likesGiven: number;
  //   followersCount: number;
  //   followingCount: number;
  //   totalEngagement: number;
  // };
  posts: PostHierarchyDTO[];
  createdAt: string;
  // deletedAt?: string;
  lastLoginAt?: string;
  page: number;
  // limit: number;
  total: number;
  totalPages: number;
  // hasNext: boolean;
  // hasPrev: boolean;
}

export interface PostHierarchyDTO {
  id: number;
  caption?: string;
  location?: string;
  mediaCount: number;
  likesCount: number;
  commentsCount: number;
  isArchived: boolean;
  createdAt: string;
  comments: CommentHierarchyDTO[];
}

export interface CommentHierarchyDTO {
  id: number;
  content: string;
  author?: {
    username: string;
    fullName?: string;
  };
  likesCount: number;
  replyCount: number;
  createdAt: string;
  replies?: CommentHierarchyDTO[];
}

export interface CSVExportData {
  userId: number;
  username: string;
  fullName: string;
  email: string;
  phone: string;
  bio: string;
  status: string;
  isVerified: boolean;
  isPrivate: boolean;
  postsCount: number;
  commentsCount: number;
  totalLikesReceived: number;
  totalLikesGiven: number;
  followersCount: number;
  followingCount: number;
  totalEngagement: number;
  accountCreated: string;
  lastLogin: string;
  accountDeleted: string;
  postsData: string;
  commentsData: string;
}

export interface AdminStatsDTO {
  totalUsers: number;
  activeUsers: number;
  deletedUsers: number;
  verifiedUsers: number;
  adminUsers: number;
  totalPosts: number;
  totalComments: number;
  totalLikes: number;
  engagementRate: number;
  newUsersToday: number;
  newUsersThisWeek: number;
  newUsersThisMonth: number;
  topUsers: {
    id: number;
    username: string;
    fullName: string;
    avatarUrl?: string;
    postsCount: number;
    totalLikes: number;
    totalComments: number;
  }[];
}
export interface BulkImportUserDTO {
  email?: string;
  phone?: string;
  username: string;
  fullName?: string;
  bio?: string;
  role?: string;
  isVerified?: boolean;
  isPrivate?: boolean;
}

export interface BulkImportResultDTO {
  total: number;
  created: number;
  updated: number;
  failed: number;
  errors: {
    row: number;
    email?: string;
    username?: string;
    error: string;
  }[];
  fileUrl: string;
  filename: string;
}

export interface GetUsersQueryDTO {
  page?: number;
  limit?: number;
  search?: string;
  status?: 'active' | 'deleted' | 'all';
  startDate?: string;
  endDate?: string;
  orderBy?: string;
  orderType?: 'asc' | 'desc';
}
