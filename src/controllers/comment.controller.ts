import { Request, Response, NextFunction } from 'express';
import CommentService from '../services/comment.service';
import { ApiResponseHandler } from '../utils/api-response';
import { AuthenticatedRequest } from '../types/request';
import { CreateCommentDTO, UpdateCommentDTO } from '../types/dto/comment.dto';

export class CommentController {
  static async addComment(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const postIdParam = Array.isArray(req.params.postId) ? req.params.postId[0] : req.params.postId;
      const postId = parseInt(postIdParam, 10);
      const commentData: CreateCommentDTO = req.body;
      
      const comment = await CommentService.addComment(userId, postId, commentData);
      
      ApiResponseHandler.created(res, 'Comment added successfully', comment);
    } catch (error) {
      next(error);
    }
  }
  
  static async getPostComments(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const postIdParam = Array.isArray(req.params.postId) ? req.params.postId[0] : req.params.postId;
      const postId = parseInt(postIdParam, 10);
      const userId = req.user?.id;
      
      const comments = await CommentService.getPostComments(postId, userId);
      
      ApiResponseHandler.success(res, 'Comments retrieved successfully', comments);
    } catch (error) {
      next(error);
    }
  }
  
  static async updateComment(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const commentIdParam = Array.isArray(req.params.commentId) ? req.params.commentId[0] : req.params.commentId;
      const commentId = parseInt(commentIdParam, 10);
      const updateData: UpdateCommentDTO = req.body;
      
      const comment = await CommentService.updateComment(userId, commentId, updateData);
      
      ApiResponseHandler.success(res, 'Comment updated successfully', comment);
    } catch (error) {
      next(error);
    }
  }
  
  static async deleteComment(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const commentIdParam = Array.isArray(req.params.commentId) ? req.params.commentId[0] : req.params.commentId;
      const commentId = parseInt(commentIdParam, 10);

      const result = await CommentService.deleteComment(userId, commentId);
      
      ApiResponseHandler.success(res, result.message);
    } catch (error) {
      next(error);
    }
  }
  
  static async likeComment(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const commentIdParam = Array.isArray(req.params.commentId) ? req.params.commentId[0] : req.params.commentId;
      const commentId = parseInt(commentIdParam, 10);

      const result = await CommentService.likeComment(userId, commentId);
      
      const message = result.liked ? 'Comment liked' : 'Comment unliked';
      ApiResponseHandler.success(res, message, result);
    } catch (error) {
      next(error);
    }
  }
}