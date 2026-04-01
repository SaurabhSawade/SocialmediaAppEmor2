import prisma from '../prisma/client';
import logger from '../config/logger';

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
      const comment = await prisma.comment.findFirst({
        where: { id, userId },
      });
      
      if (!comment) {
        throw new Error('Comment not found or unauthorized');
      }
      
      return await prisma.comment.update({
        where: { id },
        data: { content },
        include: {
          user: {
            include: { profile: true },
          },
        },
      });
    } catch (error) {
      logger.error('Error in CommentRepository.update:', error);
      throw error;
    }
  }
  
  async delete(id: number, userId: number) {
    try {
      const comment = await prisma.comment.findFirst({
        where: { id, userId },
      });
      
      if (!comment) {
        throw new Error('Comment not found or unauthorized');
      }
      
      return await prisma.comment.delete({
        where: { id },
      });
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