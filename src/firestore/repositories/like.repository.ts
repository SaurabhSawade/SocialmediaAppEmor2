import FirebaseService from '../../config/firebase';

interface LikeData {
  userId: number;
  postId?: number;
  commentId?: number;
}

interface LikeDocument extends LikeData {
  id: string;
  createdAt: any;
}

export class FirestoreLikeRepository {
  private static instance: FirestoreLikeRepository;
  private collectionName = 'likes';

  private constructor() {}

  static getInstance(): FirestoreLikeRepository {
    if (!FirestoreLikeRepository.instance) {
      FirestoreLikeRepository.instance = new FirestoreLikeRepository();
    }
    return FirestoreLikeRepository.instance;
  }

  private generateId(): string {
    return `like_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  async togglePostLike(userId: number, postId: number) {
    const allLikes = await FirebaseService.getDocuments<LikeDocument>(this.collectionName, {
      limit: 10000,
    });

    const existing = allLikes.data.find(
      l => l.userId === userId && l.postId === postId && !l.commentId
    );

    if (existing) {
      await FirebaseService.deleteDocument(this.collectionName, existing.id);
      return { liked: false };
    }

    const id = this.generateId();
    const now = new Date().toISOString();

    const likeData = {
      id,
      userId,
      postId,
      commentId: null,
      createdAt: now,
    };

    await FirebaseService.setDocument(this.collectionName, id, likeData);

    return { liked: true };
  }

  async getPostLikeCount(postId: number) {
    const allLikes = await FirebaseService.getDocuments<LikeDocument>(this.collectionName, {
      limit: 10000,
    });

    return allLikes.data.filter(l => l.postId === postId && !l.commentId).length;
  }

  async toggleCommentLike(userId: number, commentId: number) {
    const allLikes = await FirebaseService.getDocuments<LikeDocument>(this.collectionName, {
      limit: 10000,
    });

    const existing = allLikes.data.find(
      l => l.userId === userId && l.commentId === commentId && !l.postId
    );

    if (existing) {
      await FirebaseService.deleteDocument(this.collectionName, existing.id);
      return { liked: false };
    }

    const id = this.generateId();
    const now = new Date().toISOString();

    const likeData = {
      id,
      userId,
      postId: null,
      commentId,
      createdAt: now,
    };

    await FirebaseService.setDocument(this.collectionName, id, likeData);

    return { liked: true };
  }

  async getCommentLikeCount(commentId: number) {
    const allLikes = await FirebaseService.getDocuments<LikeDocument>(this.collectionName, {
      limit: 10000,
    });

    return allLikes.data.filter(l => l.commentId === commentId && !l.postId).length;
  }
}

export default FirestoreLikeRepository.getInstance();
