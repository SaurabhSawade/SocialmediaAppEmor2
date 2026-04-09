import FirebaseService from '../../config/firebase';

interface AdminUserData {
  id: string;
  userId: number;
  email?: string;
  phone?: string;
  role: 'USER' | 'ADMIN';
  isVerified: boolean;
  isActive: boolean;
  deletedAt?: any;
  createdAt: any;
  lastLoginAt?: any;
  profile?: {
    username?: string;
    fullName?: string;
    bio?: string;
    avatarUrl?: string;
    website?: string;
    gender?: string;
    isPrivate?: boolean;
  };
  _count?: {
    posts?: number;
    followers?: number;
    following?: number;
  };
}

export class FirestoreAdminRepository {
  private static instance: FirestoreAdminRepository;
  private userCollection = 'users';

  private constructor() {}

  static getInstance(): FirestoreAdminRepository {
    if (!FirestoreAdminRepository.instance) {
      FirestoreAdminRepository.instance = new FirestoreAdminRepository();
    }
    return FirestoreAdminRepository.instance;
  }

  async getAllUsers(query: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
    startDate?: string;
    endDate?: string;
    orderBy?: string;
    orderType?: 'asc' | 'desc';
  }) {
    const { page = 1, limit = 10, search, status = 'active', startDate, endDate, orderBy = 'createdAt', orderType = 'desc' } = query;

    const allUsers = await FirebaseService.getDocuments<AdminUserData>(this.userCollection, {
      limit: 10000,
    });

    let users = allUsers.data;

    if (search) {
      const searchLower = search.toLowerCase();
      users = users.filter(u => 
        u.profile?.username?.toLowerCase().includes(searchLower) ||
        u.email?.toLowerCase().includes(searchLower) ||
        u.phone?.includes(search)
      );
    }

    if (status === 'active') {
      users = users.filter(u => !u.deletedAt && u.isActive);
    } else if (status === 'deleted') {
      users = users.filter(u => u.deletedAt);
    } else if (status === 'inactive') {
      users = users.filter(u => !u.isActive);
    }

    if (startDate) {
      users = users.filter(u => u.createdAt && new Date(u.createdAt) >= new Date(startDate));
    }
    if (endDate) {
      users = users.filter(u => u.createdAt && new Date(u.createdAt) <= new Date(endDate));
    }

    users.sort((a, b) => {
      const aVal = orderBy === 'createdAt' ? new Date(a.createdAt || 0).getTime() : a.profile?.username || '';
      const bVal = orderBy === 'createdAt' ? new Date(b.createdAt || 0).getTime() : b.profile?.username || '';
      
      if (orderType === 'desc') {
        return aVal > bVal ? -1 : 1;
      }
      return aVal < bVal ? -1 : 1;
    });

    const total = users.length;
    const skip = (page - 1) * limit;
    const paginatedUsers = users.slice(skip, skip + limit);

    const formattedUsers = paginatedUsers.map(u => ({
      id: u.userId,
      username: u.profile?.username || '',
      fullName: u.profile?.fullName || '',
      email: u.email,
      phone: u.phone,
      bio: u.profile?.bio,
      avatarUrl: u.profile?.avatarUrl,
      status: u.deletedAt ? 'deleted' : u.isActive ? 'active' : 'inactive',
      isVerified: u.isVerified,
      isPrivate: u.profile?.isPrivate || false,
      stats: {
        postsCount: u._count?.posts || 0,
        followersCount: u._count?.followers || 0,
        followingCount: u._count?.following || 0,
        totalEngagement: (u._count?.posts || 0) + (u._count?.followers || 0) + (u._count?.following || 0),
      },
      createdAt: u.createdAt,
      lastLoginAt: u.lastLoginAt,
      deletedAt: u.deletedAt,
    }));

    return {
      users: formattedUsers,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getAdminStats() {
    const allUsers = await FirebaseService.getDocuments<AdminUserData>(this.userCollection, {
      limit: 10000,
    });

    const users = allUsers.data;
    const totalUsers = users.length;
    const activeUsers = users.filter(u => !u.deletedAt && u.isActive).length;
    const deletedUsers = users.filter(u => u.deletedAt).length;
    const verifiedUsers = users.filter(u => u.isVerified).length;
    const adminUsers = users.filter(u => u.role === 'ADMIN').length;

    const postsCollection = await FirebaseService.getDocuments<any>('posts', { limit: 10000 });
    const totalPosts = postsCollection.data.length;

    return {
      totalUsers,
      activeUsers,
      deletedUsers,
      verifiedUsers,
      adminUsers,
      totalPosts,
    };
  }

  async updateUserRole(userId: number, newRole: 'USER' | 'ADMIN') {
    const allUsers = await FirebaseService.getDocuments<AdminUserData>(this.userCollection, {
      limit: 10000,
    });

    const user = allUsers.data.find(u => u.userId === userId);
    if (!user) {
      throw new Error('User not found');
    }

    await FirebaseService.updateDocument(this.userCollection, user.id, { role: newRole });
    return { userId, role: newRole };
  }

  async deleteUserPermanently(userId: number) {
    const allUsers = await FirebaseService.getDocuments<AdminUserData>(this.userCollection, {
      limit: 10000,
    });

    const user = allUsers.data.find(u => u.userId === userId);
    if (!user) {
      throw new Error('User not found');
    }

    await FirebaseService.deleteDocument(this.userCollection, user.id);
    await FirebaseService.deleteDocument('profiles', userId.toString());
    return { message: 'User deleted permanently' };
  }

  async getAdminUsers() {
    const allUsers = await FirebaseService.getDocuments<AdminUserData>(this.userCollection, {
      limit: 10000,
    });

    const adminUsers = allUsers.data.filter(u => u.role === 'ADMIN');

    return adminUsers.map(u => ({
      id: u.userId,
      username: u.profile?.username || '',
      fullName: u.profile?.fullName || '',
      email: u.email,
      phone: u.phone,
    }));
  }
}

export default FirestoreAdminRepository.getInstance();
