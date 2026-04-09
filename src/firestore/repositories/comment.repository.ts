import FirebaseService from '../../config/firebase';
import logger from '../../config/logger';
import { AppError } from "../../utils/app-error";
import { Messages } from '../../constants/messages';

interface CommentData {
  postId: number;
  userId: number;
  content: string;
  parentId?: number;
}

interface CommentDocument extends CommentData {
  id: string;
  createdAt: string;
  updatedAt?: string;
}

interface LikeDocument {
  id: string;
  userId: number;
  postId?: number | null;
  commentId?: number | null;
  createdAt: string;
}

export class FirestoreCommentRepository {
  private static instance: FirestoreCommentRepository;
  private collectionName = 'comments';
  private likeCollectionName = 'likes';

  private constructor() {}

  static getInstance(): FirestoreCommentRepository {
    if (!FirestoreCommentRepository.instance) {
      FirestoreCommentRepository.instance = new FirestoreCommentRepository();
    }
    return FirestoreCommentRepository.instance;
  }

  private generateId(): string {
    return `comment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private extractNumericId(docId: string): number {
    return parseInt(docId.split('_')[1], 10);
  }

  private async getUserData(userId: number) {
    const userRepo = await import('./user.repository');
    const FirestoreUserRepository = userRepo.default;
    const user = await FirestoreUserRepository.findById(userId);

    if (!user) {
      return undefined;
    }

    return {
      id: user.id,
      profile: user.profile,
    };
  }

  private async getCommentLikes(commentId: number): Promise<LikeDocument[]> {
    const likes = await FirebaseService.getDocuments<LikeDocument>(this.likeCollectionName, {
      limit: 10000,
    });

    return likes.data.filter((like) => like.commentId === commentId && !like.postId);
  }

  private async mapComment(
    comment: CommentDocument,
    userId?: number,
    replies: Array<{
      id: number;
      userId: number;
      content: string;
      parentId?: number;
      createdAt: string;
      updatedAt?: string;
      user?: {
        id: number;
        profile?: {
          username?: string;
          fullName?: string;
          avatarUrl?: string;
        };
      };
      _count: {
        likes: number;
      };
      isLiked: boolean;
    }> = []
  ) {
    const numericId = this.extractNumericId(comment.id);
    const likes = await this.getCommentLikes(numericId);
    const user = await this.getUserData(comment.userId);

    return {
      ...comment,
      id: numericId,
      user,
      _count: {
        likes: likes.length,
        replies: replies.length,
      },
      isLiked: userId ? likes.some((l) => l.userId === userId) : false,
      replies,
    };
  }

  async create(data: CommentData) {
    try {
      const id = this.generateId();
      const now = new Date().toISOString();

      const commentData: CommentDocument = {
        id,
        postId: data.postId,
        userId: data.userId,
        content: data.content,
        parentId: data.parentId || undefined,
        createdAt: now,
        updatedAt: now,
      };

      await FirebaseService.setDocument(this.collectionName, id, commentData);

      return this.mapComment(commentData);
    } catch (error) {
      logger.error('Error in FirestoreCommentRepository.create:', error);
      throw error;
    }
  }

  async findByPostId(postId: number, userId?: number) {
    try {
      const allComments = await FirebaseService.getDocuments<CommentDocument>(this.collectionName, {
        limit: 10000,
      });

      const rootComments = allComments.data.filter((c) => c.postId === postId && !c.parentId);
      const replyComments = allComments.data.filter((c) => c.postId === postId && !!c.parentId);

      const mapped = await Promise.all(
        rootComments.map(async (comment) => {
          const numericId = this.extractNumericId(comment.id);

          const replies = await Promise.all(
            replyComments
              .filter((reply) => reply.parentId === numericId)
              .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
              .map(async (reply) => {
                const replyNumericId = this.extractNumericId(reply.id);
                const replyLikes = await this.getCommentLikes(replyNumericId);
                const replyUser = await this.getUserData(reply.userId);

                return {
                  ...reply,
                  id: replyNumericId,
                  user: replyUser,
                  _count: {
                    likes: replyLikes.length,
                  },
                  isLiked: userId ? replyLikes.some((l) => l.userId === userId) : false,
                };
              })
          );

          return this.mapComment(comment, userId, replies);
        })
      );

      return mapped.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } catch (error) {
      logger.error('Error in FirestoreCommentRepository.findByPostId:', error);
      throw error;
    }
  }

  async findById(id: number, userId?: number) {
    try {
      const allComments = await FirebaseService.getDocuments<CommentDocument>(this.collectionName, {
        limit: 10000,
      });

      const comment = allComments.data.find((c) => this.extractNumericId(c.id) === id);

      if (!comment) {
        return null;
      }

      return this.mapComment(comment, userId);
    } catch (error) {
      logger.error('Error in FirestoreCommentRepository.findById:', error);
      throw error;
    }
  }

  async update(id: number, content: string, userId: number) {
    try {
      const allComments = await FirebaseService.getDocuments<CommentDocument>(this.collectionName, {
        limit: 10000,
      });

      const comment = allComments.data.find((c) => this.extractNumericId(c.id) === id);

      if (!comment || comment.userId !== userId) {
        throw new AppError(Messages.COMMENT_UNAUTHORIZED);
      }

      await FirebaseService.updateDocument(this.collectionName, comment.id, {
        content,
        updatedAt: new Date().toISOString(),
      });

      const updated = await this.findById(id, userId);

      if (!updated) {
        throw new AppError(Messages.COMMENT_NOT_FOUND);
      }

      return updated;
    } catch (error) {
      logger.error('Error in FirestoreCommentRepository.update:', error);
      throw error;
    }
  }

  async delete(id: number, userId: number) {
    try {
      const allComments = await FirebaseService.getDocuments<CommentDocument>(this.collectionName, {
        limit: 10000,
      });

      const comment = allComments.data.find((c) => this.extractNumericId(c.id) === id);

      if (!comment || comment.userId !== userId) {
        throw new AppError(Messages.COMMENT_UNAUTHORIZED);
      }

      await FirebaseService.deleteDocument(this.collectionName, comment.id);

      return {
        id,
        postId: comment.postId,
        userId: comment.userId,
        content: comment.content,
      };
    } catch (error) {
      logger.error('Error in FirestoreCommentRepository.delete:', error);
      throw error;
    }
  }

  async getCommentCount(postId: number): Promise<number> {
    try {
      const allComments = await FirebaseService.getDocuments<CommentDocument>(this.collectionName, {
        limit: 10000,
      });

      return allComments.data.filter((c) => c.postId === postId).length;
    } catch (error) {
      logger.error('Error in FirestoreCommentRepository.getCommentCount:', error);
      throw error;
    }
  }
}

export default FirestoreCommentRepository.getInstance();
