import { Response, NextFunction } from 'express';
import FollowService from '../services/follow.service';
import { ApiResponseHandler } from '../utils/api-response';
import { AuthenticatedRequest } from '../types/request';
// import logger from '../config/logger';

export class FollowController {
  /**
   * Follow/Unfollow a user
   * POST /api/v1/users/:userId/follow
   */
  static async followUser(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const followerId = req.user!.id;
      const followingId = parseInt(req.params.userId as string);
      
      const result = await FollowService.followUser(followerId, followingId);
      
      ApiResponseHandler.success(res, result.message, {
        followed: result.followed,
        userId: followingId,
      });
    } catch (error) {
      next(error);
    }
  }
  
  /**
   * Get user's followers
   * GET /api/v1/users/:userId/followers
   */
  static async getFollowers(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userId = parseInt(req.params.userId as string);
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const currentUserId = req.user?.id;
      
      const result = await FollowService.getFollowers(userId, page, limit, currentUserId);
      
      ApiResponseHandler.success(res, 'Followers retrieved successfully', result);
    } catch (error) {
      next(error);
    }
  }
  
  /**
   * Get users that a user is following
   * GET /api/v1/users/:userId/following
   */
  static async getFollowing(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userId = parseInt(req.params.userId as string );
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const currentUserId = req.user?.id;
      
      const result = await FollowService.getFollowing(userId, page, limit, currentUserId);
      
      ApiResponseHandler.success(res, 'Following retrieved successfully', result);
    } catch (error) {
      next(error);
    }
  }
  
  /**
   * Get follow statistics (followers/following count)
   * GET /api/v1/users/:userId/stats
   */
  static async getFollowStats(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userId = parseInt(req.params.userId as string);
      
      const stats = await FollowService.getFollowStats(userId);
      
      ApiResponseHandler.success(res, 'Follow stats retrieved successfully', stats);
    } catch (error) {
      next(error);
    }
  }
  
  /**
   * Check if current user follows a specific user
   * GET /api/v1/users/:userId/follow-status
   */
  static async checkFollowStatus(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const followerId = req.user!.id;
      const followingId = parseInt(req.params.userId as string);
      
      const result = await FollowService.checkFollowStatus(followerId, followingId);
      
      ApiResponseHandler.success(res, 'Follow status retrieved', result);
    } catch (error) {
      next(error);
    }
  }
  
  /**
   * Get mutual followers between current user and another user
   * GET /api/v1/users/:userId/mutual-followers
   */
  static async getMutualFollowers(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const targetUserId = parseInt(req.params.userId as string);
      
      const result = await FollowService.getMutualFollowers(userId, targetUserId);
      
      ApiResponseHandler.success(res, 'Mutual followers retrieved successfully', result);
    } catch (error) {
      next(error);
    }
  }
  
  /**
   * Get follow suggestions for current user
   * GET /api/v1/users/suggestions/follow
   */
  static async getFollowSuggestions(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const limit = parseInt(req.query.limit as string) || 10;
      
      const result = await FollowService.getFollowSuggestions(userId, limit);
      
      ApiResponseHandler.success(res, 'Follow suggestions retrieved successfully', result);
    } catch (error) {
      next(error);
    }
  }
}

export default FollowController;