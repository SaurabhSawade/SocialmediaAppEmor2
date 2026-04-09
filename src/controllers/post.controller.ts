import { Response, NextFunction } from 'express';
import PostService from '../services/post.service';
import { FirestorePostService } from '../firestore';
import { ApiResponseHandler } from '../utils/api-response';
import { AuthenticatedRequest } from '../types/request';
import { CreatePostDTO, UpdatePostDTO } from '../types/dto/post.dto';

export class PostController {
  static async createPost(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const postData: CreatePostDTO = JSON.parse(req.body.data || '{}');
      const files = req.files as Express.Multer.File[];
      
      // const post = await PostService.createPost(userId, postData, files);
      const post = await FirestorePostService.createPost(userId, postData, files);
      
      return ApiResponseHandler.created(res, 'Post created successfully', post);
    } catch (error) {
      next(error);
    }
  }
  
  static async getPost(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const postIdParam = Array.isArray(req.params.postId) ? req.params.postId[0] : req.params.postId;
      const postId = parseInt(postIdParam, 10);
      const userId = req.user?.id;
      
      // const post = await PostService.getPost(postId, userId);
      const post = await FirestorePostService.getPost(postId, userId);
      
      return ApiResponseHandler.success(res, 'Post retrieved successfully', post);
    } catch (error) {
      next(error);
    }
  }
  
  static async getFeed(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const pageParam = Array.isArray(req.query.page) ? req.query.page[0] : req.query.page;
      const limitParam = Array.isArray(req.query.limit) ? req.query.limit[0] : req.query.limit;
      const page = parseInt(pageParam as string, 10) || 1;
      const limit = parseInt(limitParam as string, 10) || 10;
      
      // const feed = await PostService.getUserFeed(userId, page, limit);
      const feed = await FirestorePostService.getUserFeed(userId, page, limit);
      
      return ApiResponseHandler.success(res, 'Feed retrieved successfully', feed);
    } catch (error) {
      next(error);
    }
  }
  
  static async updatePost(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const postId = parseInt(req.params.postId as string);
      const updateData: UpdatePostDTO = req.body;
      
      // const post = await PostService.updatePost(userId, postId, updateData);
      const post = await FirestorePostService.updatePost(userId, postId, updateData);
      
      return ApiResponseHandler.success(res, 'Post updated successfully', post);
    } catch (error) {
      next(error);
    }
  }
  
  static async deletePost(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const postId = parseInt(req.params.postId as string);
      
      // const result = await PostService.deletePost(userId, postId);
      const result = await FirestorePostService.deletePost(userId, postId);
      
      return ApiResponseHandler.success(res, result.message);
    } catch (error) {
      next(error);
    }
  }
  
  static async archivePost(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const postId = parseInt(req.params.postId as string);
      
      // const result = await PostService.archivePost(userId, postId);
      const result = await FirestorePostService.archivePost(userId, postId);
      
      return ApiResponseHandler.success(res, result.message);
    } catch (error) {
      next(error);
    }
  }
  
  static async likePost(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const postId = parseInt(req.params.postId as string);
      
      // const result = await PostService.likePost(userId, postId);
      const result = await FirestorePostService.likePost(userId, postId);
      
      const message = result.liked ? 'Post liked' : 'Post unliked';
      return ApiResponseHandler.success(res, message, result);
    } catch (error) {
      next(error);
    }
  }
}
