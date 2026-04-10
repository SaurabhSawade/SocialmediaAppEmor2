import FirestoreFollowRepository from '../repositories/follow.repository';
import NotificationService from './notification.service';
import { NotificationType } from '../../constants/enums';
import { Messages } from '../../constants/messages';
import { AppError } from "../../utils/app-error";
import FirestoreUserRepository from '../repositories/user.repository';

export class FirestoreFollowService {
  private static instance: FirestoreFollowService;
  
  private constructor() {}
  
  static getInstance(): FirestoreFollowService {
    if (!FirestoreFollowService.instance) {
      FirestoreFollowService.instance = new FirestoreFollowService();
    }
    return FirestoreFollowService.instance;
  }
  
  async followUser(followerId: number, followingId: number): Promise<{ followed: boolean; message: string }> {
    if (followerId === followingId) {
      throw new AppError(Messages.CANNOT_FOLLOW_SELF);
    }
    
    const targetUserExists = await FirestoreFollowRepository.checkUserExists(followingId);
    if (!targetUserExists) {
      throw new AppError(Messages.USER_NOT_FOUND);
    }
    
    const existingFollow = await FirestoreFollowRepository.findFollow(followerId, followingId);
    
    if (existingFollow) {
      await FirestoreFollowRepository.unfollow(followerId, followingId);
      return { 
        followed: false, 
        message: Messages.UNFOLLOW_SUCCESS 
      };
    } else {
      await FirestoreFollowRepository.follow(followerId, followingId);
      
      const follower = await FirestoreUserRepository.findById(followerId);
      const followerName = follower?.profile?.username || 'Someone';
      
      await NotificationService.createNotification(
        followingId,
        followerId,
        NotificationType.FOLLOW,
        `${followerName} started following you`,
        followerId,
        'user'
      );
      
      return { 
        followed: true, 
        message: Messages.FOLLOW_SUCCESS 
      };
    }
  }
  
  async getFollowers(userId: number, page: number = 1, limit: number = 20, currentUserId?: number) {
    const userExists = await FirestoreFollowRepository.checkUserExists(userId);
    if (!userExists) {
      throw new AppError(Messages.USER_NOT_FOUND);
    }
    
    const result = await FirestoreFollowRepository.getFollowers(userId, page, limit, currentUserId);
    
    return {
      users: result.users,
      page: result.page,
      limit: result.limit,
      total: result.total,
      totalPages: result.totalPages,
      hasNext: result.page < result.totalPages,
      hasPrev: result.page > 1,
    };
  }
  
  async getFollowing(userId: number, page: number = 1, limit: number = 20, currentUserId?: number) {
    const userExists = await FirestoreFollowRepository.checkUserExists(userId);
    if (!userExists) {
      throw new AppError(Messages.USER_NOT_FOUND);
    }
    
    const result = await FirestoreFollowRepository.getFollowing(userId, page, limit, currentUserId);
    
    return {
      users: result.users,
      page: result.page,
      limit: result.limit,
      total: result.total,
      totalPages: result.totalPages,
      hasNext: result.page < result.totalPages,
      hasPrev: result.page > 1,
    };
  }
  
  async getFollowStats(userId: number) {
    const userExists = await FirestoreFollowRepository.checkUserExists(userId);
    if (!userExists) {
      throw new AppError(Messages.USER_NOT_FOUND);
    }
    
    const stats = await FirestoreFollowRepository.getFollowStats(userId);
    
    return stats;
  }
  
  async checkFollowStatus(followerId: number, followingId: number) {
    const [followerExists, followingExists] = await Promise.all([
      FirestoreFollowRepository.checkUserExists(followerId),
      FirestoreFollowRepository.checkUserExists(followingId),
    ]);
    
    if (!followerExists || !followingExists) {
      throw new AppError(Messages.USER_NOT_FOUND);
    }
    
    const isFollowing = await FirestoreFollowRepository.checkFollowStatus(followerId, followingId);
    
    return { isFollowing };
  }
  
  async getMutualFollowers(userId: number, targetUserId: number) {
    const [userExists, targetUserExists] = await Promise.all([
      FirestoreFollowRepository.checkUserExists(userId),
      FirestoreFollowRepository.checkUserExists(targetUserId),
    ]);
    
    if (!userExists || !targetUserExists) {
      throw new AppError(Messages.USER_NOT_FOUND);
    }
    
    const mutualFollowers = await FirestoreFollowRepository.getMutualFollowers(userId, targetUserId);
    
    return { mutualFollowers };
  }
  
  async getFollowSuggestions(userId: number, limit: number = 10) {
    const following = await FirestoreFollowRepository.getFollowing(userId, 1, 100);
    const followingIds = following.users.map(u => u.id);
    
    const suggestions = await FirestoreFollowRepository.getFollowing(followingIds[0] || 0, 1, limit);
    
    const filteredSuggestions = suggestions.users.filter(
      u => u.id !== userId && !followingIds.includes(u.id)
    );
    
    return {
      suggestions: filteredSuggestions.slice(0, limit),
      total: filteredSuggestions.length,
    };
  }
}

export default FirestoreFollowService.getInstance();
