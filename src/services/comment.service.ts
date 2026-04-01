import CommentRepository from '../repositories/comment.repository';
import LikeRepository from '../repositories/like.repository';
import { CreateCommentDTO, UpdateCommentDTO, CommentResponseDTO } from '../types/dto/comment.dto';
import logger from '../config/logger';

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
    if (!data.content || data.content.trim().length === 0) {
      throw new Error('Comment content cannot be empty');
    }
    
    if (data.content.length > 500) {
      throw new Error('Comment cannot exceed 500 characters');
    }
    
    const comment = await CommentRepository.create({
      postId,
      userId,
      content: data.content,
      parentId: data.parentId,
    });
    
    return this.formatCommentResponse(comment, userId);
  }
  
  async getPostComments(postId: number, userId?: number): Promise<CommentResponseDTO[]> {
    const comments = await CommentRepository.findByPostId(postId, userId);
    
    return comments.map(comment => this.formatCommentResponse(comment, userId));
  }
  
  async updateComment(
    userId: number,
    commentId: number,
    data: UpdateCommentDTO
  ): Promise<CommentResponseDTO> {
    if (!data.content || data.content.trim().length === 0) {
      throw new Error('Comment content cannot be empty');
    }
    
    const updatedComment = await CommentRepository.update(commentId, data.content, userId);
    
    return this.formatCommentResponse(updatedComment, userId);
  }
  
  async deleteComment(userId: number, commentId: number): Promise<{ message: string }> {
    await CommentRepository.delete(commentId, userId);
    
    return { message: 'Comment deleted successfully' };
  }
  
  async likeComment(userId: number, commentId: number): Promise<{ liked: boolean; likesCount: number }> {
    const { liked } = await LikeRepository.toggleCommentLike(userId, commentId);
    
    // Get updated likes count
    const comment = await CommentRepository.findById(commentId);
    const likesCount = comment?._count?.likes || 0;
    
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