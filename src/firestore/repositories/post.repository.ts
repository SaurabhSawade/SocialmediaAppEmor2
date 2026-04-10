import FirebaseService from '../../config/firebase';
import { MediaType } from '../../constants/enums';
import FirestoreLikeRepository from './like.repository';

interface PostMedia {
  url: string;
  thumbnailUrl?: string;
  type: MediaType;
  order?: number;
  fileSize?: number;
  mimeType?: string;
}

interface PostData {
  authorId: number;
  caption?: string;
  location?: string;
  media: PostMedia[];
}

interface PostDocument extends PostData {
  id: string;
  isArchived: boolean;
  createdAt: any;
  updatedAt: any;
  author?: {
    id: number;
    profile?: {
      username?: string;
      fullName?: string;
      avatarUrl?: string;
    };
  };
  _count?: {
    likes?: number;
    comments?: number;
  };
  isLiked?: boolean;
  isSaved?: boolean;
}

export class FirestorePostRepository {
  private static instance: FirestorePostRepository;
  private collectionName = 'posts';

  private constructor() {}

  static getInstance(): FirestorePostRepository {
    if (!FirestorePostRepository.instance) {
      FirestorePostRepository.instance = new FirestorePostRepository();
    }
    return FirestorePostRepository.instance;
  }

  private generateId(): string {
    return `post_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private extractPostId(id: string): number {
    const parts = id.split('_');
    if (parts.length >= 2) {
      const parsed = parseInt(parts[1], 10);
      return isNaN(parsed) ? 0 : parsed;
    }
    return 0;
  }

  async create(data: PostData) {
    const id = this.generateId();
    const now = new Date();
    
    const postData = {
      ...data,
      isArchived: false,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    };

    await FirebaseService.setDocument(this.collectionName, id, postData);

    return {
      id: this.extractPostId(id),
      ...postData,
      author: { id: data.authorId, profile: {} },
      media: data.media.map((m, index) => ({
        ...m,
        order: m.order ?? index,
      })),
      _count: { likes: 0, comments: 0 },
    };
  }

  async findById(id: number, userId?: number) {
    const posts = await FirebaseService.getDocuments<PostDocument>(this.collectionName, {
      where: [
        { field: 'isArchived', operator: '==', value: false },
      ],
      limit: 1000,
    });

    const post = posts.data.find(p => this.extractPostId(p.id) === id);

    if (!post) return null;

    const likesCount = await FirestoreLikeRepository.getPostLikeCount(this.extractPostId(post.id));
    const isLiked = userId ? (await FirestoreLikeRepository.getPostLikeCount(this.extractPostId(post.id))) > 0 && 
      (await this.checkIfUserLikedPost(userId, this.extractPostId(post.id))) : false;

    return {
      ...post,
      id: this.extractPostId(post.id),
      likesCount,
      isLiked,
      isSaved: false,
    };
  }

  private async checkIfUserLikedPost(userId: number, postId: number): Promise<boolean> {
    const allLikes = await FirebaseService.getDocuments<any>('likes', { limit: 10000 });
    return allLikes.data.some(l => l.userId === userId && l.postId === postId && !l.commentId);
  }

  async findByIdSimple(id: number) {
    const post = await this.findById(id);
    if (!post) return null;
    
    return {
      id: post.id,
      authorId: post.authorId,
      media: post.media,
    };
  }

  async getUserFeed(userId: number, page: number = 1, limit: number = 10) {
    const posts = await FirebaseService.getDocuments<PostDocument>(this.collectionName, {
      limit: 1000,
    });

    const allPosts = posts.data
      .filter(p => !p.isArchived)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const skip = (page - 1) * limit;
    const paginatedPosts = allPosts.slice(skip, skip + limit);

    return {
      posts: paginatedPosts.map(post => ({
        ...post,
        id: this.extractPostId(post.id),
        isLiked: false,
        isSaved: false,
      })),
      total: allPosts.length,
      page,
      limit,
      totalPages: Math.ceil(allPosts.length / limit),
    };
  }

  async update(id: number, data: { caption?: string; location?: string }) {
    const posts = await FirebaseService.getDocuments<PostDocument>(this.collectionName, { limit: 10000 });
    const postDoc = posts.data.find(p => this.extractPostId(p.id) === id);
    if (!postDoc) return null;

    const updateData = {
      ...data,
      updatedAt: new Date().toISOString(),
    };

    await FirebaseService.updateDocument(this.collectionName, postDoc.id, updateData);

    const post = await this.findById(id);
    return post;
  }

  async delete(id: number) {
    const posts = await FirebaseService.getDocuments<PostDocument>(this.collectionName, { limit: 10000 });
    const postDoc = posts.data.find(p => this.extractPostId(p.id) === id);
    if (postDoc) {
      await FirebaseService.deleteDocument(this.collectionName, postDoc.id);
    }
  }

  async archive(id: number) {
    const posts = await FirebaseService.getDocuments<PostDocument>(this.collectionName, { limit: 10000 });
    const postDoc = posts.data.find(p => this.extractPostId(p.id) === id);
    if (postDoc) {
      await FirebaseService.updateDocument(this.collectionName, postDoc.id, {
        isArchived: true,
        updatedAt: new Date().toISOString(),
      });
    }
  }

  async getMediaUrls(id: number) {
    const post = await this.findById(id);
    return post?.media.map(m => m.url) || [];
  }

  async deleteWithMedia(id: number) {
    const mediaUrls = await this.getMediaUrls(id);
    await this.delete(id);
    return mediaUrls;
  }
}

export default FirestorePostRepository.getInstance();
