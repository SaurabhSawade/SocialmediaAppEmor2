import FollowRepository from '../repositories/follow.repository';
import UserRepository from '../repositories/user.repository';
import { Messages } from '../constants/messages';
import { AppError } from "../utils/app-error";
// import logger from '../config/logger';

export class FollowService {
  private static instance: FollowService;
  
  private constructor() {}
  
  static getInstance(): FollowService {
    if (!FollowService.instance) {
      FollowService.instance = new FollowService();
    }
    return FollowService.instance;
  }
  
  async followUser(followerId: number, followingId: number): Promise<{ followed: boolean; message: string }> {
    // Check if trying to follow self
    if (followerId === followingId) {
      throw new AppError(Messages.CANNOT_FOLLOW_SELF);
    }
    
    // Check if target user exists and is not deleted
    const targetUser = await UserRepository.findById(followingId);
    if (!targetUser) {
      throw new AppError(Messages.USER_NOT_FOUND);
    }
    
    // Check if already following
    const existingFollow = await FollowRepository.findFollow(followerId, followingId);
    
    if (existingFollow) {
      // Unfollow
      await FollowRepository.unfollow(followerId, followingId);
      return { 
        followed: false, 
        message: `Unfollowed ${targetUser.profile?.username || 'user'} successfully` 
      };
    } else {
      // Follow
      await FollowRepository.follow(followerId, followingId);
      return { 
        followed: true, 
        message: `Started following ${targetUser.profile?.username || 'user'}` 
      };
    }
  }
  
  async getFollowers(userId: number, page: number = 1, limit: number = 20, currentUserId?: number) {
    // Check if user exists
    const user = await UserRepository.findById(userId);
    if (!user) {
      return new AppError(Messages.USER_NOT_FOUND);
    }
    
    const result = await FollowRepository.getFollowers(userId, page, limit, currentUserId);
    
    return {
      users: result.users,
      pagination: {
        page: result.page,
        limit: result.limit,
        total: result.total,
        totalPages: result.totalPages,
        hasNext: result.page < result.totalPages,
        hasPrev: result.page > 1,
      },
    };
  }
  
  async getFollowing(userId: number, page: number = 1, limit: number = 20, currentUserId?: number) {
    // Check if user exists
    const user = await UserRepository.findById(userId);
    if (!user) {
      return new AppError(Messages.USER_NOT_FOUND);
    }
    
    const result = await FollowRepository.getFollowing(userId, page, limit, currentUserId);
    
    return {
      users: result.users,
      pagination: {
        page: result.page,
        limit: result.limit,
        total: result.total,
        totalPages: result.totalPages,
        hasNext: result.page < result.totalPages,
        hasPrev: result.page > 1,
      },
    };
  }
  
  async getFollowStats(userId: number) {
    // Check if user exists
    const user = await UserRepository.findById(userId);
    if (!user) {
      return new AppError(Messages.USER_NOT_FOUND);
    }
    
    const stats = await FollowRepository.getFollowStats(userId);
    
    return stats;
  }
  
  async checkFollowStatus(followerId: number, followingId: number) {
    // Check if users exist
    const [follower, following] = await Promise.all([
      UserRepository.findById(followerId),
      UserRepository.findById(followingId),
    ]);
    
    if (!follower || !following) {
      return new AppError(Messages.USER_NOT_FOUND);
    }
    
    const isFollowing = await FollowRepository.checkFollowStatus(followerId, followingId);
    
    return { isFollowing };
  }
  
  async getMutualFollowers(userId: number, targetUserId: number) {
    // Check if users exist
    const [user, targetUser] = await Promise.all([
      UserRepository.findById(userId),
      UserRepository.findById(targetUserId),
    ]);
    
    if (!user || !targetUser) {
      return new AppError(Messages.USER_NOT_FOUND);
    }
    
    const mutualFollowers = await FollowRepository.getMutualFollowers(userId, targetUserId);
    
    return { mutualFollowers };
  }
  
  async getFollowSuggestions(userId: number, limit: number = 10) {
    // Get users that current user follows
    const following = await FollowRepository.getFollowing(userId, 1, 100);
    const followingIds = following.users.map(u => u.id);
    
    // Get users that are followed by people current user follows
    const suggestions = await FollowRepository.getFollowing(followingIds[0] || 0, 1, limit);
    
    // Filter out already followed users and self
    const filteredSuggestions = suggestions.users.filter(
      u => u.id !== userId && !followingIds.includes(u.id)
    );
    
    return {
      suggestions: filteredSuggestions.slice(0, limit),
      total: filteredSuggestions.length,
    };
  }
}

export default FollowService.getInstance();