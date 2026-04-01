import prisma from '../prisma/client';
import logger from '../config/logger';

export class LikeRepository {
  private static instance: LikeRepository;

  private constructor() {}

  static getInstance(): LikeRepository {
    if (!LikeRepository.instance) {
      LikeRepository.instance = new LikeRepository();
    }
    return LikeRepository.instance;
  }

  async togglePostLike(userId: number, postId: number) {
    try {
      const existing = await prisma.like.findFirst({
        where: {
          userId,
          postId,
          commentId: null,
        },
      });

      if (existing) {
        await prisma.like.delete({ where: { id: existing.id } });
        return { liked: false };
      }

      await prisma.like.create({
        data: {
          userId,
          postId,
        },
      });

      return { liked: true };
    } catch (error) {
      logger.error('Error in LikeRepository.togglePostLike:', error);
      throw error;
    }
  }

  async getPostLikeCount(postId: number) {
    try {
      return await prisma.like.count({ where: { postId, commentId: null } });
    } catch (error) {
      logger.error('Error in LikeRepository.getPostLikeCount:', error);
      throw error;
    }
  }

  async toggleCommentLike(userId: number, commentId: number) {
    try {
      const existing = await prisma.like.findFirst({
        where: {
          userId,
          commentId,
          postId: null,
        },
      });

      if (existing) {
        await prisma.like.delete({ where: { id: existing.id } });
        return { liked: false };
      }

      await prisma.like.create({
        data: {
          userId,
          commentId,
        },
      });

      return { liked: true };
    } catch (error) {
      logger.error('Error in LikeRepository.toggleCommentLike:', error);
      throw error;
    }
  }

  async getCommentLikeCount(commentId: number) {
    try {
      return await prisma.like.count({ where: { commentId, postId: null } });
    } catch (error) {
      logger.error('Error in LikeRepository.getCommentLikeCount:', error);
      throw error;
    }
  }
}

export default LikeRepository.getInstance();
