import FirebaseService from '../../config/firebase';

interface UserData {
  email?: string;
  phone?: string;
  password: string;
  role?: "USER" | "ADMIN";
  isVerified?: boolean;
  isActive?: boolean;
  deletedAt?: any;
}

interface ProfileData {
  username: string;
  fullName?: string;
  bio?: string;
  avatarUrl?: string;
  website?: string;
  gender?: string;
  isPrivate?: boolean;
  emailNotifications?: boolean;
  pushNotifications?: boolean;
}

interface UserDocument extends UserData {
  id: string;
  createdAt: any;
  lastLoginAt?: any;
  profile?: ProfileData;
  _count?: {
    posts?: number;
    followers?: number;
    following?: number;
  };
}

export class FirestoreUserRepository {
  private static instance: FirestoreUserRepository;
  private collectionName = 'users';

  private constructor() {}

  static getInstance(): FirestoreUserRepository {
    if (!FirestoreUserRepository.instance) {
      FirestoreUserRepository.instance = new FirestoreUserRepository();
    }
    return FirestoreUserRepository.instance;
  }

  private generateId(): string {
    return `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private extractUserId(id: string): number {
    const parts = id.split('_');
    if (parts.length >= 2) {
      const parsed = parseInt(parts[1], 10);
      return isNaN(parsed) ? 0 : parsed;
    }
    return 0;
  }

  async findById(id: number, includeDeleted: boolean = false) {
    const allUsers = await FirebaseService.getDocuments<UserDocument>(this.collectionName, {
      limit: 10000,
    });
    
    const user = allUsers.data.find(u => this.extractUserId(u.id) === id);
    
    if (!user) return null;
    
    if (!includeDeleted && user.deletedAt) return null;
    
    return {
      id: this.extractUserId(user.id),
      email: user.email,
      phone: user.phone,
      password: user.password,
      role: user.role,
      isVerified: user.isVerified,
      isActive: user.isActive,
      deletedAt: user.deletedAt,
      createdAt: user.createdAt,
      lastLoginAt: user.lastLoginAt,
      profile: user.profile,
      _count: user._count || { posts: 0, followers: 0, following: 0 },
    };
  }

  async findByEmail(email: string, includeDeleted: boolean = false) {
    try {
      const allUsers = await FirebaseService.getDocuments<UserDocument>(this.collectionName, {
        limit: 10000,
      });
      
      const user = allUsers.data.find(u => u.email === email);
      
      if (!user) return false;
      
      if (!includeDeleted && user.deletedAt) return false;
      
      return {
        id: this.extractUserId(user.id),
        email: user.email,
        phone: user.phone,
        password: user.password,
        role: user.role,
        isVerified: user.isVerified,
        isActive: user.isActive,
        deletedAt: user.deletedAt,
        createdAt: user.createdAt,
        lastLoginAt: user.lastLoginAt,
        profile: user.profile,
        _count: user._count || { posts: 0, followers: 0, following: 0 },
      };
    } catch (error) {
      return false;
    }
  }

  async findByPhone(phone: string, includeDeleted: boolean = false) {
    const allUsers = await FirebaseService.getDocuments<UserDocument>(this.collectionName, {
      limit: 10000,
    });
    
    const user = allUsers.data.find(u => u.phone === phone);
    
    if (!user) return null;
    
    if (!includeDeleted && user.deletedAt) return null;
    
    return {
      id: this.extractUserId(user.id),
      email: user.email,
      phone: user.phone,
      password: user.password,
      role: user.role,
      isVerified: user.isVerified,
      isActive: user.isActive,
      deletedAt: user.deletedAt,
      createdAt: user.createdAt,
      lastLoginAt: user.lastLoginAt,
      profile: user.profile,
      _count: user._count || { posts: 0, followers: 0, following: 0 },
    };
  }

  async findByEmailOrPhone(identifier: string, includeDeleted: boolean = false) {
    const allUsers = await FirebaseService.getDocuments<UserDocument>(this.collectionName, {
      limit: 10000,
    });
    
    const user = allUsers.data.find(u => u.email === identifier || u.phone === identifier);
    
    if (!user) return null;
    
    if (!includeDeleted && user.deletedAt) return null;
    
    return {
      id: this.extractUserId(user.id),
      email: user.email,
      phone: user.phone,
      password: user.password,
      role: user.role,
      isVerified: user.isVerified,
      isActive: user.isActive,
      deletedAt: user.deletedAt,
      createdAt: user.createdAt,
      lastLoginAt: user.lastLoginAt,
      profile: user.profile,
      _count: user._count || { posts: 0, followers: 0, following: 0 },
    };
  }

  async create(data: {
    email?: string;
    phone?: string;
    password: string;
    role?: "USER" | "ADMIN";
    profile: {
      username: string;
      fullName?: string;
    };
  }) {
    const id = this.generateId();
    const now = new Date().toISOString();
    
    const userData = {
      id,
      email: data.email,
      phone: data.phone,
      password: data.password,
      role: data.role || "USER",
      isVerified: false,
      isActive: true,
      deletedAt: null,
      createdAt: now,
      lastLoginAt: null,
      profile: {
        username: data.profile.username,
        fullName: data.profile.fullName,
        bio: null,
        avatarUrl: null,
        website: null,
        gender: null,
        isPrivate: false,
        emailNotifications: true,
        pushNotifications: true,
      },
      _count: {
        posts: 0,
        followers: 0,
        following: 0,
      },
    };

    await FirebaseService.setDocument(this.collectionName, id, userData);

    return {
      id: this.extractUserId(id),
      email: data.email,
      phone: data.phone,
      password: data.password,
      role: data.role || "USER",
      isVerified: false,
      isActive: true,
      deletedAt: null,
      createdAt: now,
      lastLoginAt: null,
      profile: {
        username: data.profile.username,
        fullName: data.profile.fullName,
        bio: null,
        avatarUrl: null,
        website: null,
        gender: null,
        isPrivate: false,
        emailNotifications: true,
        pushNotifications: true,
      },
      _count: {
        posts: 0,
        followers: 0,
        following: 0,
      },
    };
  }

  async update(id: number, data: any) {
    const allUsers = await FirebaseService.getDocuments<UserDocument>(this.collectionName, {
      limit: 10000,
    });
    
    const user = allUsers.data.find(u => this.extractUserId(u.id) === id);
    if (!user) return null;
    
    const updatedData = { ...(await this.findById(id)), ...data };
    await FirebaseService.updateDocument(this.collectionName, user.id, data);
    
    return updatedData;
  }

  async softDelete(id: number) {
    const allUsers = await FirebaseService.getDocuments<UserDocument>(this.collectionName, {
      limit: 10000,
    });
    
    const user = allUsers.data.find(u => this.extractUserId(u.id) === id);
    if (!user) return null;
    
    await FirebaseService.updateDocument(this.collectionName, user.id, {
      deletedAt: new Date().toISOString(),
    });
    
    return this.findById(id, true);
  }

  async updatePassword(id: number, hashedPassword: string) {
    const allUsers = await FirebaseService.getDocuments<UserDocument>(this.collectionName, {
      limit: 10000,
    });
    
    const user = allUsers.data.find(u => this.extractUserId(u.id) === id);
    if (!user) return null;
    
    await FirebaseService.updateDocument(this.collectionName, user.id, {
      password: hashedPassword,
    });
    
    return this.findById(id, true);
  }

  async updateEmail(id: number, email: string) {
    const allUsers = await FirebaseService.getDocuments<UserDocument>(this.collectionName, {
      limit: 10000,
    });
    
    const user = allUsers.data.find(u => this.extractUserId(u.id) === id);
    if (!user) return null;
    
    await FirebaseService.updateDocument(this.collectionName, user.id, { email });
    
    return this.findById(id, true);
  }

  async verifyUser(id: number) {
    const allUsers = await FirebaseService.getDocuments<UserDocument>(this.collectionName, {
      limit: 10000,
    });
    
    const user = allUsers.data.find(u => this.extractUserId(u.id) === id);
    if (!user) return null;
    
    await FirebaseService.updateDocument(this.collectionName, user.id, { isVerified: true });
    
    return this.findById(id, true);
  }

  async getUserWithStats(id: number) {
    const user = await this.findById(id);
    
    if (!user) return null;
    
    return {
      ...user,
      profile: user.profile,
    };
  }

  async incrementField(id: number, field: 'posts' | 'followers' | 'following', delta: number = 1) {
    const allUsers = await FirebaseService.getDocuments<any>(this.collectionName, { limit: 10000 });
    const userDoc = allUsers.data.find(u => this.extractUserId(u.id) === id);
    if (!userDoc) return;
    
    const user = await this.findById(id);
    if (!user) return;
    
    const currentCount = user._count?.[field] || 0;
    await FirebaseService.updateDocument(this.collectionName, userDoc.id, {
      [`_count.${field}`]: currentCount + delta,
    });
  }
}

export default FirestoreUserRepository.getInstance();
