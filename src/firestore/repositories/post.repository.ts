import FirebaseService from '../../config/firebase';
import { MediaType } from '../../constants/enums';

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
      id: parseInt(id.split('_')[1]),
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

    const post = posts.data.find(p => p.id === id.toString() || parseInt(p.id) === id);

    if (!post) return null;

    return {
      ...post,
      id: parseInt(post.id),
      isLiked: false,
      isSaved: false,
    };
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
      where: [
        { field: 'isArchived', operator: '==', value: false },
      ],
      orderBy: [{ field: 'createdAt', direction: 'desc' }],
      limit: limit * page,
    });

    const allPosts = posts.data;
    const skip = (page - 1) * limit;
    const paginatedPosts = allPosts.slice(skip, skip + limit);

    return {
      posts: paginatedPosts.map(post => ({
        ...post,
        id: parseInt(post.id),
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
    const updateData = {
      ...data,
      updatedAt: new Date().toISOString(),
    };

    await FirebaseService.updateDocument(this.collectionName, id.toString(), updateData);

    const post = await this.findById(id);
    return post;
  }

  async delete(id: number) {
    await FirebaseService.deleteDocument(this.collectionName, id.toString());
  }

  async archive(id: number) {
    await FirebaseService.updateDocument(this.collectionName, id.toString(), {
      isArchived: true,
      updatedAt: new Date().toISOString(),
    });
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
