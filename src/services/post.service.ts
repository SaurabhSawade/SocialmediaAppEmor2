import PostRepository from '../repositories/post.repository';
import LikeRepository from '../repositories/like.repository';
import { CreatePostDTO, UpdatePostDTO, PostResponseDTO } from '../types/dto/post.dto';
import { Messages } from '../constants/messages';
import { MediaType } from '../constants/enums';
import logger from '../config/logger';
import path from 'path';
import fs from 'fs';

export class PostService {
  private static instance: PostService;
  
  private constructor() {}
  
  static getInstance(): PostService {
    if (!PostService.instance) {
      PostService.instance = new PostService();
    }
    return PostService.instance;
  }
  
  async createPost(userId: number, data: CreatePostDTO, files?: Express.Multer.File[]): Promise<PostResponseDTO> {
    // Validate media
    if ((!data.media || data.media.length === 0) && (!files || files.length === 0)) {
      throw new Error('At least one media file is required');
    }
    
    const mediaItems = [];
    
    // Process uploaded files
    if (files && files.length > 0) {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const isVideo = file.mimetype.startsWith('video/');
        const fileUrl = `/uploads/posts/${file.filename}`;
        
        mediaItems.push({
          url: fileUrl,
          type: isVideo ? MediaType.VIDEO : MediaType.IMAGE,
          order: data.media?.[i]?.order ?? i,
          fileSize: file.size,
          mimeType: file.mimetype,
        });
      }
    }
    
    // Add manually provided media URLs
    if (data.media && data.media.length > 0) {
      for (let i = 0; i < data.media.length; i++) {
        const media = data.media[i];
        mediaItems.push({
          url: media.url,
          type: media.type as MediaType,
          order: media.order ?? (mediaItems.length + i),
        });
      }
    }
    
    if (mediaItems.length > 10) {
      throw new Error('Maximum 10 media files per post');
    }
    
    const post = await PostRepository.create({
      authorId: userId,
      caption: data.caption,
      location: data.location,
      media: mediaItems,
    });
    
    return this.formatPostResponse(post, userId);
  }
  
  async getPost(postId: number, userId?: number): Promise<PostResponseDTO> {
    const post = await PostRepository.findById(postId, userId);
    
    if (!post) {
      throw new Error('Post not found');
    }
    
    return this.formatPostResponse(post, userId);
  }
  
  async getUserFeed(userId: number, page: number = 1, limit: number = 10) {
    const feed = await PostRepository.getUserFeed(userId, page, limit);
    
    return {
      posts: feed.posts.map(post => this.formatPostResponse(post, userId)),
      pagination: {
        page: feed.page,
        limit: feed.limit,
        total: feed.total,
        totalPages: feed.totalPages,
        hasNext: feed.page < feed.totalPages,
        hasPrev: feed.page > 1,
      },
    };
  }
  
  async updatePost(userId: number, postId: number, data: UpdatePostDTO): Promise<PostResponseDTO> {
    const post = await PostRepository.findById(postId);
    
    if (!post) {
      throw new Error('Post not found');
    }
    
    if (post.authorId !== userId) {
      throw new Error('Unauthorized to update this post');
    }
    
    const updatedPost = await PostRepository.update(postId, data);
    
    return this.formatPostResponse(updatedPost, userId);
  }
  
  async deletePost(userId: number, postId: number): Promise<{ message: string }> {
    const post = await PostRepository.findById(postId);
    
    if (!post) {
      throw new Error('Post not found');
    }
    
    // Delete associated media files
    if (post.media && post.media.length > 0) {
      for (const media of post.media) {
        const filePath = path.join(process.cwd(), media.url);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      }
    }
    
    await PostRepository.delete(postId);
    
    return { message: Messages.DELETED };
  }
  
  async archivePost(userId: number, postId: number): Promise<{ message: string }> {
    const post = await PostRepository.findById(postId);
    
    if (!post) {
      throw new Error('Post not found');
    }
    
    if (post.authorId !== userId) {
      throw new Error('Unauthorized to archive this post');
    }
    
    await PostRepository.archive(postId);
    
    return { message: 'Post archived successfully' };
  }
  
  async likePost(userId: number, postId: number): Promise<{ liked: boolean; likesCount: number }> {
    const post = await PostRepository.findById(postId);
    
    if (!post) {
      throw new Error('Post not found');
    }
    
    const { liked } = await LikeRepository.togglePostLike(userId, postId);
    const likesCount = await LikeRepository.getPostLikeCount(postId);
    
    return { liked, likesCount };
  }
  
  private formatPostResponse(post: any, currentUserId?: number): PostResponseDTO {
    return {
      id: post.id,
      author: {
        id: post.author.id,
        username: post.author.profile?.username,
        fullName: post.author.profile?.fullName,
        avatarUrl: post.author.profile?.avatarUrl,
      },
      caption: post.caption,
      location: post.location,
      media: post.media.map((m: any) => ({
        url: m.url,
        thumbnailUrl: m.thumbnailUrl,
        type: m.type,
        order: m.order,
      })),
      likesCount: post._count?.likes || 0,
      commentsCount: post._count?.comments || 0,
      isLiked: post.isLiked || false,
      isSaved: post.isSaved || false,
      createdAt: post.createdAt,
      updatedAt: post.updatedAt,
    };
  }
}

export default PostService.getInstance();