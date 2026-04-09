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

  async findById(id: number, includeDeleted: boolean = false) {
    const allUsers = await FirebaseService.getDocuments<UserDocument>(this.collectionName, {
      limit: 10000,
    });
    
    const user = allUsers.data.find(u => parseInt(u.id) === id);
    
    if (!user) return null;
    
    if (!includeDeleted && user.deletedAt) return null;
    
    return {
      id: parseInt(user.id),
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
        id: parseInt(user.id),
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
      id: parseInt(user.id),
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
      id: parseInt(user.id),
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
      id: parseInt(id.split('_')[1]),
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
    const userId = id.toString();
    const existing = await this.findById(id, true);
    
    if (!existing) return null;
    
    const updatedData = { ...existing, ...data };
    await FirebaseService.updateDocument(this.collectionName, userId, data);
    
    return updatedData;
  }

  async softDelete(id: number) {
    const userId = id.toString();
    await FirebaseService.updateDocument(this.collectionName, userId, {
      deletedAt: new Date().toISOString(),
    });
    
    return this.findById(id, true);
  }

  async updatePassword(id: number, hashedPassword: string) {
    const userId = id.toString();
    await FirebaseService.updateDocument(this.collectionName, userId, {
      password: hashedPassword,
    });
    
    return this.findById(id, true);
  }

  async updateEmail(id: number, email: string) {
    const userId = id.toString();
    await FirebaseService.updateDocument(this.collectionName, userId, { email });
    
    return this.findById(id, true);
  }

  async verifyUser(id: number) {
    const userId = id.toString();
    await FirebaseService.updateDocument(this.collectionName, userId, { isVerified: true });
    
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
    const userId = id.toString();
    const user = await this.findById(id, true);
    
    if (!user) return;
    
    const currentCount = user._count?.[field] || 0;
    await FirebaseService.updateDocument(this.collectionName, userId, {
      [`_count.${field}`]: currentCount + delta,
    });
  }
}

export default FirestoreUserRepository.getInstance();
