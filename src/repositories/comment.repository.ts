import prisma from '../prisma/client';
import logger from '../config/logger';
import { AppError } from "../utils/app-error";
import { Messages } from '../constants/messages';
import { http } from 'winston';
import { HttpStatus } from "../constants/http-status";

export class CommentRepository {
  private static instance: CommentRepository;
  
  private constructor() {}
  
  static getInstance(): CommentRepository {
    if (!CommentRepository.instance) {
      CommentRepository.instance = new CommentRepository();
    }
    return CommentRepository.instance;
  }
  
  async create(data: {
    postId: number;
    userId: number;
    content: string;
    parentId?: number;
  }) {
    try {
      const comment = await prisma.comment.create({
        data: {
          postId: data.postId,
          userId: data.userId,
          content: data.content,
          parentId: data.parentId,
        },
        include: {
          user: {
            include: { profile: true },
          },
          _count: {
            select: { likes: true, replies: true },
          },
        },
      });
      
      return comment;
    } catch (error) {
      logger.error('Error in CommentRepository.create:', error);
      throw error;
    }
  }
  
  async findByPostId(postId: number, userId?: number) {
    try {
      const comments = await prisma.comment.findMany({
        where: {
          postId,
          parentId: null,
        },
        include: {
          user: {
            include: { profile: true },
          },
          _count: {
            select: { likes: true, replies: true },
          },
          likes: userId ? {
            where: { userId },
            take: 1,
          } : false,
          replies: {
            include: {
              user: {
                include: { profile: true },
              },
              _count: {
                select: { likes: true },
              },
              likes: userId ? {
                where: { userId },
                take: 1,
              } : false,
            },
            orderBy: { createdAt: 'asc' },
          },
        },
        orderBy: { createdAt: 'desc' },
      });
      
      return comments.map(comment => ({
        ...comment,
        isLiked: comment.likes?.length > 0,
        replies: comment.replies.map(reply => ({
          ...reply,
          isLiked: reply.likes?.length > 0,
        })),
      }));
    } catch (error) {
      logger.error('Error in CommentRepository.findByPostId:', error);
      throw error;
    }
  }
  
  async findById(id: number, userId?: number) {
    try {
      return await prisma.comment.findUnique({
        where: { id },
        include: {
          user: {
            include: { profile: true },
          },
          _count: {
            select: { likes: true, replies: true },
          },
          likes: userId ? {
            where: { userId },
            take: 1,
          } : false,
        },
      });
    } catch (error) {
      logger.error('Error in CommentRepository.findById:', error);
      throw error;
    }
  }
  
  async update(id: number, content: string, userId: number) {
    try {
      logger.debug(`🔍 Finding comment ${id} for user ${userId}`);
      const comment = await prisma.comment.findFirst({
        where: { id, userId },
      });
      
      if (!comment) {
        logger.warn(`⚠️ Comment ${id} not found or unauthorized for user ${userId}`);
        throw new AppError(Messages.COMMENT_UNAUTHORIZED);
      }
      
      logger.debug(`✏️ Updating comment ${id} in database`);
      const updated = await prisma.comment.update({
        where: { id },
        data: { content },
        include: {
          user: {
            include: { profile: true },
          },
        },
      });
      
      logger.debug(`✅ Comment ${id} updated in database`);
      return updated;
    } catch (error) {
      logger.error('Error in CommentRepository.update:', error);
      throw error;
    }
  }
  
  async delete(id: number, userId: number) {
    try {
      logger.debug(`🔍 Finding comment ${id} for deletion by user ${userId}`);
      const comment = await prisma.comment.findFirst({
        where: { id, userId },
      });
      
      if (!comment) {
        logger.warn(`⚠️ Comment ${id} not found or unauthorized for deletion by user ${userId}`);
        throw new AppError(Messages.COMMENT_UNAUTHORIZED);
      }
      
      logger.debug(`🗑️ Deleting comment ${id} from database`);
      const deleted = await prisma.comment.delete({
        where: { id },
      });
      
      logger.debug(`✅ Comment ${id} deleted from database`);
      return deleted;
    } catch (error) {
      logger.error('Error in CommentRepository.delete:', error);
      throw error;
    }
  }
  
  async getCommentCount(postId: number): Promise<number> {
    try {
      return await prisma.comment.count({
        where: { postId },
      });
    } catch (error) {
      logger.error('Error in CommentRepository.getCommentCount:', error);
      throw error;
    }
  }
}

export default CommentRepository.getInstance();