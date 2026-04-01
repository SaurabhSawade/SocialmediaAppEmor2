import prisma from '../prisma/client';
import logger from '../config/logger';
import { MediaType } from '../constants/enums';

export class PostRepository {
  private static instance: PostRepository;
  
  private constructor() {}
  
  static getInstance(): PostRepository {
    if (!PostRepository.instance) {
      PostRepository.instance = new PostRepository();
    }
    return PostRepository.instance;
  }
  
  async create(data: {
    authorId: number;
    caption?: string;
    location?: string;
    media: {
      url: string;
      thumbnailUrl?: string;
      type: MediaType;
      order?: number;
      fileSize?: number;
      mimeType?: string;
    }[];
  }) {
    try {
      return await prisma.$transaction(async (tx) => {
        const post = await tx.post.create({
          data: {
            authorId: data.authorId,
            caption: data.caption,
            location: data.location,
            media: {
              create: data.media.map((m, index) => ({
                url: m.url,
                thumbnailUrl: m.thumbnailUrl,
                type: m.type,
                order: m.order ?? index,
                fileSize: m.fileSize,
                mimeType: m.mimeType,
              })),
            },
          },
          include: {
            author: {
              include: { profile: true },
            },
            media: true,
            _count: {
              select: { likes: true, comments: true },
            },
          },
        });
        
        return post;
      });
    } catch (error) {
      logger.error('Error in PostRepository.create:', error);
      throw error;
    }
  }
  
  async findById(id: number, userId?: number) {
    try {
      const post = await prisma.post.findUnique({
        where: { id, isArchived: false },
        include: {
          author: {
            include: { profile: true },
          },
          media: {
            orderBy: { order: 'asc' },
          },
          _count: {
            select: { likes: true, comments: true },
          },
          likes: userId ? {
            where: { userId },
            take: 1,
          } : false,
          savedBy: userId ? {
            where: { userId },
            take: 1,
          } : false,
        },
      });
      
      if (!post) return null;
      
      return {
        ...post,
        isLiked: post.likes?.length > 0,
        isSaved: post.savedBy?.length > 0,
      };
    } catch (error) {
      logger.error('Error in PostRepository.findById:', error);
      throw error;
    }
  }
  
  async getUserFeed(userId: number, page: number = 1, limit: number = 10) {
    try {
      const skip = (page - 1) * limit;
      
      const following = await prisma.follow.findMany({
        where: { followerId: userId },
        select: { followingId: true },
      });
      
      const followingIds = following.map(f => f.followingId);
      
      const posts = await prisma.post.findMany({
        where: {
          authorId: { in: [...followingIds, userId] },
          isArchived: false,
        },
        include: {
          author: {
            include: { profile: true },
          },
          media: {
            orderBy: { order: 'asc' },
          },
          _count: {
            select: { likes: true, comments: true },
          },
          likes: {
            where: { userId },
            take: 1,
          },
          savedBy: {
            where: { userId },
            take: 1,
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      });
      
      const total = await prisma.post.count({
        where: {
          authorId: { in: [...followingIds, userId] },
          isArchived: false,
        },
      });
      
      return {
        posts: posts.map(post => ({
          ...post,
          isLiked: post.likes?.length > 0,
          isSaved: post.savedBy?.length > 0,
        })),
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      };
    } catch (error) {
      logger.error('Error in PostRepository.getUserFeed:', error);
      throw error;
    }
  }
  
  async update(id: number, data: { caption?: string; location?: string }) {
    try {
      return await prisma.post.update({
        where: { id },
        data,
        include: {
          media: true,
        },
      });
    } catch (error) {
      logger.error('Error in PostRepository.update:', error);
      throw error;
    }
  }
  
  async delete(id: number) {
    try {
      return await prisma.post.delete({
        where: { id },
      });
    } catch (error) {
      logger.error('Error in PostRepository.delete:', error);
      throw error;
    }
  }
  
  async archive(id: number) {
    try {
      return await prisma.post.update({
        where: { id },
        data: { isArchived: true },
      });
    } catch (error) {
      logger.error('Error in PostRepository.archive:', error);
      throw error;
    }
  }
}

export default PostRepository.getInstance();