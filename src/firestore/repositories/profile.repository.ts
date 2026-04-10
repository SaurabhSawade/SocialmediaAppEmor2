import FirebaseService from '../../config/firebase';
import logger from '../../config/logger';
import { AppError } from "../../utils/app-error";
import { Messages } from '../../constants/messages';

interface ProfileData {
  username?: string;
  fullName?: string;
  bio?: string;
  avatarUrl?: string | null;
  avatarKey?: string;
  website?: string;
  gender?: string;
  isPrivate?: boolean;
  emailNotifications?: boolean;
  pushNotifications?: boolean;
}

interface ProfileDocument extends ProfileData {
  id: string;
  userId: number;
  createdAt: any;
  updatedAt?: any;
  user?: {
    id: number;
    email?: string;
    phone?: string;
    isVerified?: boolean;
    isActive?: boolean;
    createdAt: any;
    lastLoginAt?: any;
    _count?: {
      posts?: number;
      followers?: number;
      following?: number;
    };
  };
}

export class FirestoreProfileRepository {
  private static instance: FirestoreProfileRepository;
  private collectionName = 'profiles';

  private constructor() {}

  static getInstance(): FirestoreProfileRepository {
    if (!FirestoreProfileRepository.instance) {
      FirestoreProfileRepository.instance = new FirestoreProfileRepository();
    }
    return FirestoreProfileRepository.instance;
  }

  private generateId(): string {
    return `profile_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private extractProfileId(id: string): number {
    const parts = id.split('_');
    if (parts.length >= 2) {
      const parsed = parseInt(parts[1], 10);
      return isNaN(parsed) ? 0 : parsed;
    }
    return 0;
  }

  async findByUserId(userId: number) {
    const profiles = await FirebaseService.getDocuments<ProfileDocument>(this.collectionName, {
      limit: 10000,
    });

    const profile = profiles.data.find(p => p.userId === userId);

    if (!profile) return null;

    return {
      id: this.extractProfileId(profile.id),
      docId: profile.id,
      userId: profile.userId,
      username: profile.username,
      fullName: profile.fullName,
      bio: profile.bio,
      avatarUrl: profile.avatarUrl,
      avatarKey: profile.avatarKey,
      website: profile.website,
      gender: profile.gender,
      isPrivate: profile.isPrivate || false,
      emailNotifications: profile.emailNotifications ?? true,
      pushNotifications: profile.pushNotifications ?? true,
      user: profile.user,
    };
  }

  async findByUsername(username: string) {
    const profiles = await FirebaseService.getDocuments<ProfileDocument>(this.collectionName, {
      limit: 10000,
    });

    const profile = profiles.data.find(p => p.username === username);

    if (!profile) return null;

    return {
      id: this.extractProfileId(profile.id),
      docId: profile.id,
      userId: profile.userId,
      username: profile.username,
      fullName: profile.fullName,
      bio: profile.bio,
      avatarUrl: profile.avatarUrl,
      avatarKey: profile.avatarKey,
      website: profile.website,
      gender: profile.gender,
      isPrivate: profile.isPrivate || false,
      emailNotifications: profile.emailNotifications ?? true,
      pushNotifications: profile.pushNotifications ?? true,
      user: profile.user,
    };
  }

  async update(userId: number, data: {
    username?: string;
    fullName?: string;
    bio?: string;
    avatarUrl?: string | null;
    avatarKey?: string;
    website?: string;
    gender?: string;
    isPrivate?: boolean;
    emailNotifications?: boolean;
    pushNotifications?: boolean;
  }) {
    const profile = await this.findByUserId(userId);

    if (!profile) return null;

    if (data.username) {
      const existing = await this.findByUsername(data.username);
      if (existing && existing.userId !== userId) {
        throw new AppError(Messages.USERNAME_EXISTS);
      }
    }

    const profileId = profile.id;
    const updateData = {
      ...data,
      updatedAt: new Date().toISOString(),
    };

    await FirebaseService.updateDocument(this.collectionName, profile.docId, updateData);

    return this.findByUserId(userId);
  }

  async updateAvatar(userId: number, avatarUrl: string, avatarKey?: string) {
    const profile = await this.findByUserId(userId);

    if (!profile) return null;

    const profileId = profile.docId;
    await FirebaseService.updateDocument(this.collectionName, profileId, {
      avatarUrl,
      avatarKey,
      updatedAt: new Date().toISOString(),
    });

    return this.findByUserId(userId);
  }

  async checkUsernameAvailability(username: string, excludeUserId?: number) {
    const profiles = await FirebaseService.getDocuments<ProfileDocument>(this.collectionName, {
      limit: 10000,
    });

    const profile = profiles.data.find(p => p.username === username);

    if (!profile) return true;

    return excludeUserId ? profile.userId !== excludeUserId : false;
  }

  async getProfileWithFollowers(username: string, currentUserId?: number) {
    const profile = await this.findByUsername(username);

    if (!profile) return null;

    return {
      ...profile,
      isFollowedByCurrentUser: false,
      _count: {
        posts: profile.user?._count?.posts || 0,
        followers: 0,
        following: 0,
      },
    };
  }

  async create(userId: number, data: {
    username: string;
    fullName?: string;
  }) {
    const id = this.generateId();
    const now = new Date().toISOString();

    const profileData = {
      id,
      userId,
      username: data.username,
      fullName: data.fullName,
      bio: null,
      avatarUrl: null,
      avatarKey: null,
      website: null,
      gender: null,
      isPrivate: false,
      emailNotifications: true,
      pushNotifications: true,
      createdAt: now,
      updatedAt: now,
    };

    await FirebaseService.setDocument(this.collectionName, id, profileData);

    return {
      id: this.extractProfileId(id),
      docId: id,
      userId,
      username: data.username,
      fullName: data.fullName,
      bio: null,
      avatarUrl: null,
      avatarKey: null,
      website: null,
      gender: null,
      isPrivate: false,
      emailNotifications: true,
      pushNotifications: true,
      createdAt: now,
      updatedAt: now,
    };
  }
}

export default FirestoreProfileRepository.getInstance();
