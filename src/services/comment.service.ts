import CommentRepository from '../repositories/comment.repository';
import LikeRepository from '../repositories/like.repository';
import { CreateCommentDTO, UpdateCommentDTO, CommentResponseDTO } from '../types/dto/comment.dto';
import logger from '../config/logger';
import { AppError } from "../utils/app-error";
import { Messages } from '../constants/messages';

export class CommentService {
  private static instance: CommentService;
  
  private constructor() {}
  
  static getInstance(): CommentService {
    if (!CommentService.instance) {
      CommentService.instance = new CommentService();
    }
    return CommentService.instance;
  }
  
  async addComment(
    userId: number,
    postId: number,
    data: CreateCommentDTO
  ): Promise<CommentResponseDTO> {
    logger.info(`📝 Adding comment to post ${postId} by user ${userId}`, { postId, userId });
    
    if (!data.content || data.content.trim().length === 0) {
      logger.warn(`❌ Comment validation failed: empty content`);
      throw new AppError(Messages.COMMENT_CONTENT_EMPTY);
    }
    
    if (data.content.length > 500) {
      logger.warn(`❌ Comment validation failed: content too long (${data.content.length} chars)`);
      throw new AppError(Messages.COMMENT_TOO_LONG);
    }
    
    const comment = await CommentRepository.create({
      postId,
      userId,
      content: data.content,
      parentId: data.parentId,
    });
    
    logger.info(`✅ Comment created successfully`, { commentId: comment.id, postId });
    return this.formatCommentResponse(comment, userId);
  }
  
  async getPostComments(postId: number, userId?: number): Promise<CommentResponseDTO[]> {
    logger.info(`📖 Fetching comments for post ${postId}`, { postId, userId });
    const comments = await CommentRepository.findByPostId(postId, userId);
    logger.info(`✅ Retrieved ${comments.length} comments`, { postId, count: comments.length });
    return comments.map(comment => this.formatCommentResponse(comment, userId));
  }
  
  async getComment(commentId: number, userId?: number): Promise<CommentResponseDTO> {
    logger.info(`📖 Fetching comment ${commentId}`, { commentId, userId });
    const comment = await CommentRepository.findById(commentId, userId);
    
    if (!comment) {
      logger.warn(`❌ Comment ${commentId} not found`);
      throw new AppError(Messages.COMMENT_NOT_FOUND);
    }
    
    logger.info(`✅ Comment retrieved successfully`, { commentId });
    return this.formatCommentResponse(comment, userId);
  }
  
  async updateComment(
    userId: number,
    commentId: number,
    data: UpdateCommentDTO
  ): Promise<CommentResponseDTO> {
    logger.info(`✏️ Updating comment ${commentId} by user ${userId}`, { commentId, userId });
    
    if (!data.content || data.content.trim().length === 0) {
      logger.warn(`❌ Comment validation failed: empty content`);
      throw new AppError(Messages.COMMENT_CONTENT_EMPTY);
    }
    
    const updatedComment = await CommentRepository.update(commentId, data.content, userId);
    logger.info(`✅ Comment updated successfully`, { commentId });
    return this.formatCommentResponse(updatedComment, userId);
  }
  
  async deleteComment(userId: number, commentId: number): Promise<{ message: string }> {
    logger.info(`🗑️ Deleting comment ${commentId} by user ${userId}`, { commentId, userId });
    await CommentRepository.delete(commentId, userId);
    logger.info(`✅ Comment deleted successfully`, { commentId });
    return { message: 'Comment deleted successfully' };
  }
  
  async likeComment(userId: number, commentId: number): Promise<{ liked: boolean; likesCount: number }> {
    logger.info(`❤️ Toggling like on comment ${commentId} by user ${userId}`, { commentId, userId });
    const { liked } = await LikeRepository.toggleCommentLike(userId, commentId);
    
    // Get updated likes count
    const comment = await CommentRepository.findById(commentId);
    const likesCount = comment?._count?.likes || 0;
    
    logger.info(`✅ Like toggled successfully`, { commentId, liked, likesCount });
    return { liked, likesCount };
  }
  
  private formatCommentResponse(comment: any, currentUserId?: number): CommentResponseDTO {
    return {
      id: comment.id,
      author: {
        id: comment.user.id,
        username: comment.user.profile?.username,
        fullName: comment.user.profile?.fullName,
        avatarUrl: comment.user.profile?.avatarUrl,
      },
      content: comment.content,
      likesCount: comment._count?.likes || 0,
      isLiked: comment.isLiked || false,
      replies: comment.replies?.map((reply: any) => this.formatCommentResponse(reply, currentUserId)),
      createdAt: comment.createdAt,
      updatedAt: comment.updatedAt,
    };
  }
}

export default CommentService.getInstance();