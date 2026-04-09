import { Response, NextFunction } from 'express';
import FollowService from '../services/follow.service';
import { FirestoreFollowService } from '../firestore';
import { ApiResponseHandler } from '../utils/api-response';
import { AuthenticatedRequest } from '../types/request';

export class FollowController {
  static async followUser(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const followerId = req.user!.id;
      const followingId = parseInt(req.params.userId as string);
      
      // const result = await FollowService.followUser(followerId, followingId);
      const result = await FirestoreFollowService.followUser(followerId, followingId);
      
      ApiResponseHandler.success(res, result.message, {
        followed: result.followed,
        userId: followingId,
      });
    } catch (error) {
      next(error);
    }
  }
  
  static async getFollowers(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userId = parseInt(req.params.userId as string);
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const currentUserId = req.user?.id;
      
      // const result = await FollowService.getFollowers(userId, page, limit, currentUserId);
      const result = await FirestoreFollowService.getFollowers(userId, page, limit, currentUserId);
      
      ApiResponseHandler.success(res, 'Followers retrieved successfully', result);
    } catch (error) {
      next(error);
    }
  }
  
  static async getFollowing(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userId = parseInt(req.params.userId as string );
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const currentUserId = req.user?.id;
      
      // const result = await FollowService.getFollowing(userId, page, limit, currentUserId);
      const result = await FirestoreFollowService.getFollowing(userId, page, limit, currentUserId);
      
      ApiResponseHandler.success(res, 'Following retrieved successfully', result);
    } catch (error) {
      next(error);
    }
  }
  
  static async getFollowStats(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userId = parseInt(req.params.userId as string);
      
      // const stats = await FollowService.getFollowStats(userId);
      const stats = await FirestoreFollowService.getFollowStats(userId);
      
      ApiResponseHandler.success(res, 'Follow stats retrieved successfully', stats);
    } catch (error) {
      next(error);
    }
  }
  
  static async checkFollowStatus(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const followerId = req.user!.id;
      const followingId = parseInt(req.params.userId as string);
      
      // const result = await FollowService.checkFollowStatus(followerId, followingId);
      const result = await FirestoreFollowService.checkFollowStatus(followerId, followingId);
      
      ApiResponseHandler.success(res, 'Follow status retrieved', result);
    } catch (error) {
      next(error);
    }
  }
  
  static async getMutualFollowers(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const targetUserId = parseInt(req.params.userId as string);
      
      // const result = await FollowService.getMutualFollowers(userId, targetUserId);
      const result = await FirestoreFollowService.getMutualFollowers(userId, targetUserId);
      
      ApiResponseHandler.success(res, 'Mutual followers retrieved successfully', result);
    } catch (error) {
      next(error);
    }
  }
  
  static async getFollowSuggestions(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const limit = parseInt(req.query.limit as string) || 10;
      
      // const result = await FollowService.getFollowSuggestions(userId, limit);
      const result = await FirestoreFollowService.getFollowSuggestions(userId, limit);
      
      ApiResponseHandler.success(res, 'Follow suggestions retrieved successfully', result);
    } catch (error) {
      next(error);
    }
  }
}

export default FollowController;
