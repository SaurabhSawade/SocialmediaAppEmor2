import FirebaseService from '../../config/firebase';

interface FollowData {
  followerId: number;
  followingId: number;
}

interface FollowDocument extends FollowData {
  id: string;
  createdAt: any;
  follower?: {
    id: number;
    profile?: {
      username?: string;
      fullName?: string;
      avatarUrl?: string;
      bio?: string;
      isPrivate?: boolean;
    };
    followers?: Array<{ followerId: number }>;
  };
  following?: {
    id: number;
    profile?: {
      username?: string;
      fullName?: string;
      avatarUrl?: string;
      bio?: string;
      isPrivate?: boolean;
    };
    followers?: Array<{ followerId: number }>;
  };
}

export class FirestoreFollowRepository {
  private static instance: FirestoreFollowRepository;
  private collectionName = 'follows';

  private constructor() {}

  static getInstance(): FirestoreFollowRepository {
    if (!FirestoreFollowRepository.instance) {
      FirestoreFollowRepository.instance = new FirestoreFollowRepository();
    }
    return FirestoreFollowRepository.instance;
  }

  private generateId(): string {
    return `follow_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  async follow(followerId: number, followingId: number) {
    const id = this.generateId();
    const now = new Date().toISOString();

    const followData = {
      id,
      followerId,
      followingId,
      createdAt: now,
    };

    await FirebaseService.setDocument(this.collectionName, id, followData);

    const userRepo = await import('./user.repository');
    const FirestoreUserRepository = userRepo.default;
    await FirestoreUserRepository.incrementField(followerId, 'following', 1);
    await FirestoreUserRepository.incrementField(followingId, 'followers', 1);

    const follower = await FirestoreUserRepository.findById(followerId);
    const following = await FirestoreUserRepository.findById(followingId);

    return {
      id: parseInt(id.split('_')[1]),
      followerId,
      followingId,
      createdAt: now,
      follower: follower ? {
        id: follower.id,
        profile: follower.profile,
      } : undefined,
      following: following ? {
        id: following.id,
        profile: following.profile,
      } : undefined,
    };
  }

  async unfollow(followerId: number, followingId: number) {
    const follows = await FirebaseService.getDocuments<FollowDocument>(this.collectionName, {
      limit: 10000,
    });

    const follow = follows.data.find(f => f.followerId === followerId && f.followingId === followingId);

    if (follow) {
      await FirebaseService.deleteDocument(this.collectionName, follow.id);

      const userRepo = await import('./user.repository');
      const FirestoreUserRepository = userRepo.default;
      await FirestoreUserRepository.incrementField(followerId, 'following', -1);
      await FirestoreUserRepository.incrementField(followingId, 'followers', -1);
    }

    return { count: follow ? 1 : 0 };
  }

  async findFollow(followerId: number, followingId: number) {
    const follows = await FirebaseService.getDocuments<FollowDocument>(this.collectionName, {
      limit: 10000,
    });

    const follow = follows.data.find(f => f.followerId === followerId && f.followingId === followingId);

    if (!follow) return null;

    return {
      id: parseInt(follow.id.split('_')[1]),
      followerId: follow.followerId,
      followingId: follow.followingId,
      createdAt: follow.createdAt,
    };
  }

  async getFollowers(userId: number, page: number = 1, limit: number = 20, currentUserId?: number) {
    const follows = await FirebaseService.getDocuments<FollowDocument>(this.collectionName, {
      limit: 10000,
    });

    const allFollows = follows.data.filter(f => f.followingId === userId);
    const skip = (page - 1) * limit;
    const paginatedFollows = allFollows.slice(skip, skip + limit);

    const userRepo = await import('./user.repository');
    const FirestoreUserRepository = userRepo.default;

    const users = await Promise.all(
      paginatedFollows.map(async (f) => {
        const user = await FirestoreUserRepository.findById(f.followerId);
        return {
          id: f.followerId,
          username: user?.profile?.username,
          fullName: user?.profile?.fullName,
          avatarUrl: user?.profile?.avatarUrl,
          bio: user?.profile?.bio,
          isPrivate: user?.profile?.isPrivate || false,
          isFollowedByCurrentUser: false,
          followedAt: f.createdAt,
        };
      })
    );

    return {
      users,
      total: allFollows.length,
      page,
      limit,
      totalPages: Math.ceil(allFollows.length / limit),
    };
  }

  async getFollowing(userId: number, page: number = 1, limit: number = 20, currentUserId?: number) {
    const follows = await FirebaseService.getDocuments<FollowDocument>(this.collectionName, {
      limit: 10000,
    });

    const allFollows = follows.data.filter(f => f.followerId === userId);
    const skip = (page - 1) * limit;
    const paginatedFollows = allFollows.slice(skip, skip + limit);

    const userRepo = await import('./user.repository');
    const FirestoreUserRepository = userRepo.default;

    const users = await Promise.all(
      paginatedFollows.map(async (f) => {
        const user = await FirestoreUserRepository.findById(f.followingId);
        return {
          id: f.followingId,
          username: user?.profile?.username,
          fullName: user?.profile?.fullName,
          avatarUrl: user?.profile?.avatarUrl,
          bio: user?.profile?.bio,
          isPrivate: user?.profile?.isPrivate || false,
          isFollowedByCurrentUser: false,
          followedAt: f.createdAt,
        };
      })
    );

    return {
      users,
      total: allFollows.length,
      page,
      limit,
      totalPages: Math.ceil(allFollows.length / limit),
    };
  }

  async getFollowStats(userId: number) {
    const follows = await FirebaseService.getDocuments<FollowDocument>(this.collectionName, {
      limit: 10000,
    });

    const followersCount = follows.data.filter(f => f.followingId === userId).length;
    const followingCount = follows.data.filter(f => f.followerId === userId).length;

    return { followersCount, followingCount };
  }

  async checkFollowStatus(followerId: number, followingId: number) {
    const follow = await this.findFollow(followerId, followingId);
    return !!follow;
  }

  async getMutualFollowers(userId: number, targetUserId: number) {
    const follows = await FirebaseService.getDocuments<FollowDocument>(this.collectionName, {
      limit: 10000,
    });

    const userFollowing = follows.data.filter(f => f.followerId === userId).map(f => f.followingId);
    const mutualFollows = follows.data.filter(
      f => f.followerId === targetUserId && userFollowing.includes(f.followingId)
    );

    const userRepo = await import('./user.repository');
    const FirestoreUserRepository = userRepo.default;

    const mutualFollowers = await Promise.all(
      mutualFollows.map(async (f) => {
        const user = await FirestoreUserRepository.findById(f.followingId);
        return {
          id: f.followingId,
          username: user?.profile?.username,
          fullName: user?.profile?.fullName,
          avatarUrl: user?.profile?.avatarUrl,
        };
      })
    );

    return mutualFollowers;
  }

  async checkUserExists(userId: number): Promise<boolean> {
    const userRepo = await import('./user.repository');
    const FirestoreUserRepository = userRepo.default;
    const user = await FirestoreUserRepository.findById(userId, true);
    return !!user;
  }
}

export default FirestoreFollowRepository.getInstance();
