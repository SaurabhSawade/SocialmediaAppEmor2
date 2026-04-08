import FollowRepository from '../repositories/follow.repository';
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
    if (followerId === followingId) {
      throw new AppError(Messages.CANNOT_FOLLOW_SELF);
    }
    
    const targetUserExists = await FollowRepository.checkUserExists(followingId);
    if (!targetUserExists) {
      throw new AppError(Messages.USER_NOT_FOUND);
    }
    
    const existingFollow = await FollowRepository.findFollow(followerId, followingId);
    
    if (existingFollow) {
      await FollowRepository.unfollow(followerId, followingId);
      return { 
        followed: false, 
        message: Messages.UNFOLLOW_SUCCESS 
      };
    } else {
      await FollowRepository.follow(followerId, followingId);
      return { 
        followed: true, 
        message: Messages.FOLLOW_SUCCESS 
      };
    }
  }
  
  async getFollowers(userId: number, page: number = 1, limit: number = 20, currentUserId?: number) {
    const userExists = await FollowRepository.checkUserExists(userId);
    if (!userExists) {
      throw new AppError(Messages.USER_NOT_FOUND);
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
    const userExists = await FollowRepository.checkUserExists(userId);
    if (!userExists) {
      throw new AppError(Messages.USER_NOT_FOUND);
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
    const userExists = await FollowRepository.checkUserExists(userId);
    if (!userExists) {
      throw new AppError(Messages.USER_NOT_FOUND);
    }
    
    const stats = await FollowRepository.getFollowStats(userId);
    
    return stats;
  }
  
  async checkFollowStatus(followerId: number, followingId: number) {
    const [followerExists, followingExists] = await Promise.all([
      FollowRepository.checkUserExists(followerId),
      FollowRepository.checkUserExists(followingId),
    ]);
    
    if (!followerExists || !followingExists) {
      throw new AppError(Messages.USER_NOT_FOUND);
    }
    
    const isFollowing = await FollowRepository.checkFollowStatus(followerId, followingId);
    
    return { isFollowing };
  }
  
  async getMutualFollowers(userId: number, targetUserId: number) {
    const [userExists, targetUserExists] = await Promise.all([
      FollowRepository.checkUserExists(userId),
      FollowRepository.checkUserExists(targetUserId),
    ]);
    
    if (!userExists || !targetUserExists) {
      throw new AppError(Messages.USER_NOT_FOUND);
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