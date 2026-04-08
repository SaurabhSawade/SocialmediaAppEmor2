import prisma from '../prisma/client';
import logger from '../config/logger';
import { formatDate } from "../utils/dateFormatter";

export class AdminRepository {
  private static instance: AdminRepository;

  private constructor() {}

  static getInstance(): AdminRepository {
    if (!AdminRepository.instance) {
      AdminRepository.instance = new AdminRepository();
    }
    return AdminRepository.instance;
  }

  async getAllUsers(filters: {
    search?: string;
    status?: 'active' | 'deleted' | 'all';
    startDate?: string;
    endDate?: string;
    orderBy?: string;
    orderType?: 'asc' | 'desc';
    page: number;
    limit: number;
  }) {
    try {
      const { page, limit, orderBy = 'createdAt', orderType = 'desc' } = filters;
      const skip = (page - 1) * limit;

      const where: any = {};

      // Search 
      if (filters.search) {
        where.OR = [
          { email: { contains: filters.search, mode: 'insensitive' } },
          { phone: { contains: filters.search, mode: 'insensitive' } },
          {
            profile: {
              username: { contains: filters.search, mode: 'insensitive' },
            },
          },
          {
            profile: {
              fullName: { contains: filters.search, mode: 'insensitive' },
            },
          },
        ];
      }

      // Status filter
      if (filters.status === 'active') {
        where.deletedAt = null;
      } else if (filters.status === 'deleted') {
        where.deletedAt = { not: null };
      }

      // Date filter
      if (filters.startDate || filters.endDate) {
        where.createdAt = {};
        if (filters.startDate) {
          const startDate = new Date(filters.startDate);
          startDate.setHours(0, 0, 0, 0);
          where.createdAt.gte = startDate;
        }
        if (filters.endDate) {
          const endDate = new Date(filters.endDate);
          endDate.setHours(23, 59, 59, 999);
          where.createdAt.lte = endDate;
        }
      }

      const users = await prisma.user.findMany({
        where,
        include: {
          profile: true, 
          posts: {
            where: { deletedAt: null },
            include: {
              media: true,
              comments: {
                where: { deletedAt: null, parentId: null },
                include: {
                  user: {
                    include: { profile: true },
                  },
                  replies: {
                    where: { deletedAt: null },
                    include: {
                      user: {
                        include: { profile: true },
                      },
                    },
                  },
                  _count: {
                    select: { likes: true },
                  },
                },
              },
              _count: {
                select: { likes: true, comments: true },
              },
            },
          },
          _count: {
            select: {
              followers: true,
              following: true,
              likes: true,
            },
          },
        },
        orderBy: {
          [orderBy]: orderType,
        },
        skip,
        take: limit,
      });

      const total = await prisma.user.count({ where });

      const usersWithStats = await Promise.all(
        users.map(async (user) => {
          const likesReceived = await prisma.like.count({
            where: {
              post: {
                authorId: user.id,
              },
            },
          });

          const likesGiven = user._count.likes;
          const commentsCount = await prisma.comment.count({
            where: { userId: user.id, deletedAt: null },
          });
          const totalEngagement = likesReceived + likesGiven + commentsCount; 
          return {
            id: user.id,
            email: user.email,
            phone: user.phone,
            username: user.profile?.username,
            fullName: user.profile?.fullName,
            bio: user.profile?.bio,
            avatarUrl: user.profile?.avatarUrl,
            role: user.role,
            isVerified: user.isVerified,
            isActive: user.isActive,
            status: user.deletedAt ? 'deleted' : 'active',
            posts: user.posts.map((post: any) => ({
              id: post.id,
              caption: post.caption,
              location: post.location,
              mediaCount: post.media.length,
              likesCount: post._count.likes,
              commentsCount: post._count.comments,
              isArchived: post.isArchived,
              createdAt: formatDate(post.createdAt),
              comments: post.comments.map((comment: any) => ({
                id: comment.id,
                content: comment.content,
                author: {
                  id: comment.user.id,
                  username: comment.user.profile?.username,
                  fullName: comment.user.profile?.fullName,
                },
                // likesCount: comment._count.likes,
                replies: comment.replies.map((reply: any) => ({
                  id: reply.id,
                  content: reply.content,
                  author: {
                    id: reply.user.id,
                    username: reply.user.profile?.username,
                    fullName: reply.user.profile?.fullName,
                  },
                  createdAt: formatDate(reply.createdAt),
                })),
              })),
            })),

            createdAt: formatDate(user.createdAt),
            // deletedAt: user.deletedAt?.toISOString() || null,
            lastLoginAt: user.lastLoginAt?.toISOString() || null,
          };
        })
      );

      return {
        users: usersWithStats,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      };
    } catch (error) {
      logger.error('Error in AdminRepository.getAllUsers:', error);
      throw error;
    }
  }

  async getAdminStats() {
    try {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

      const weekAgo = new Date(today);
      weekAgo.setDate(weekAgo.getDate() - 7);

      const monthAgo = new Date(today);
      monthAgo.setMonth(monthAgo.getMonth() - 1);

      const [
        totalUsers,
        activeUsers,
        deletedUsers,
        verifiedUsers,
        adminUsers,
        totalPosts,
        totalComments,
        totalLikes,
        newUsersToday,
        newUsersThisWeek,
        newUsersThisMonth,
      ] = await Promise.all([
        prisma.user.count(),
        prisma.user.count({ where: { deletedAt: null, isActive: true } }),
        prisma.user.count({ where: { deletedAt: { not: null } } }),
        prisma.user.count({ where: { isVerified: true } }),
        prisma.user.count({ where: { role: 'ADMIN' } }),
        prisma.post.count({ where: { deletedAt: null } }),
        prisma.comment.count({ where: { deletedAt: null } }),
        prisma.like.count(),
        prisma.user.count({ where: { createdAt: { gte: today } } }),
        prisma.user.count({ where: { createdAt: { gte: weekAgo } } }),
        prisma.user.count({ where: { createdAt: { gte: monthAgo } } }),
      ]);

      const engagementRate =
        totalUsers > 0 ? ((totalLikes + totalComments) / totalUsers) * 100 : 0;

      return {
        totalUsers,
        activeUsers,
        deletedUsers,
        verifiedUsers,
        adminUsers,
        totalPosts,
        totalComments,
        totalLikes,
        engagementRate: Number(engagementRate.toFixed(2)),
        newUsersToday,
        newUsersThisWeek,
        newUsersThisMonth,
      };
    } catch (error) {
      logger.error('Error in AdminRepository.getAdminStats:', error);
      throw error;
    }
  }

  async updateUserRole(userId: number, role: 'USER' | 'ADMIN') {
    try {
      return await prisma.user.update({
        where: { id: userId },
        data: { role },
        select: {
          id: true,
          email: true,
          role: true,
        },
      });
    } catch (error) {
      logger.error('Error in AdminRepository.updateUserRole:', error);
      throw error;
    }
  }

  async deleteUserPermanently(userId: number) {
    try {
      await prisma.$transaction([
        prisma.savedPost.deleteMany({ where: { userId } }),
        prisma.like.deleteMany({ where: { userId } }),
        prisma.comment.deleteMany({ where: { userId } }),
        prisma.post.deleteMany({ where: { authorId: userId } }),
        prisma.follow.deleteMany({ where: { followerId: userId } }),
        prisma.follow.deleteMany({ where: { followingId: userId } }),
        prisma.token.deleteMany({ where: { userId } }),
        prisma.session.deleteMany({ where: { userId } }),
        prisma.oTP.deleteMany({ where: { userId } }),
        prisma.user.delete({ where: { id: userId } }),
      ]);
      return { message: 'User permanently deleted successfully' };
    } catch (error) {
      logger.error('Error in AdminRepository.deleteUserPermanently:', error);
      throw error;
    }
  }

  async getAdminUsers() {
    try {
      return await prisma.user.findMany({
        where: { role: 'ADMIN', deletedAt: null },
        select: {
          id: true,
          email: true,
          role: true,
          createdAt: true,
        },
      });
    } catch (error) {
      logger.error('Error in AdminRepository.getAdminUsers:', error);
      throw error;
    }
  }

  async findUserById(userId: number) {
    try {
      return await prisma.user.findUnique({
        where: { id: userId, deletedAt: null },
        include: { profile: true },
      });
    } catch (error) {
      logger.error('Error in AdminRepository.findUserById:', error);
      throw error;
    }
  }

  async findUserByEmail(email: string) {
    try {
      return await prisma.user.findUnique({
        where: { email },
        include: { profile: true },
      });
    } catch (error) {
      logger.error('Error in AdminRepository.findUserByEmail:', error);
      throw error;
    }
  }

  async findProfileByUsername(username: string, excludeUserId?: number) {
    try {
      return await prisma.profile.findFirst({
        where: { username, userId: { not: excludeUserId } },
      });
    } catch (error) {
      logger.error('Error in AdminRepository.findProfileByUsername:', error);
      throw error;
    }
  }

  async findUserByPhone(phone: string) {
    try {
      return await prisma.user.findFirst({
        where: { phone },
      });
    } catch (error) {
      logger.error('Error in AdminRepository.findUserByPhone:', error);
      throw error;
    }
  }

  async updateUser(userId: number, data: any) {
    try {
      return await prisma.user.update({
        where: { id: userId },
        data,
      });
    } catch (error) {
      logger.error('Error in AdminRepository.updateUser:', error);
      throw error;
    }
  }

  async updateProfile(userId: number, data: any) {
    try {
      return await prisma.profile.update({
        where: { userId },
        data,
      });
    } catch (error) {
      logger.error('Error in AdminRepository.updateProfile:', error);
      throw error;
    }
  }

  async createProfile(data: { userId: number; username: string; fullName?: string; bio?: string; isPrivate?: boolean }) {
    try {
      return await prisma.profile.create({
        data,
      });
    } catch (error) {
      logger.error('Error in AdminRepository.createProfile:', error);
      throw error;
    }
  }

  async createUserWithProfile(data: {
    email?: string | null;
    phone?: string | null;
    password: string;
    role: 'USER' | 'ADMIN';
    isVerified: boolean;
    isActive: boolean;
    deletedAt?: Date | null;
    profile: {
      username: string;
      fullName?: string | null;
      bio?: string | null;
      isPrivate: boolean;
    };
  }) {
    try {
      return await prisma.$transaction(async (tx) => {
        const newUser = await tx.user.create({
          data: {
            email: data.email,
            phone: data.phone,
            password: data.password,
            role: data.role,
            isVerified: data.isVerified,
            isActive: data.isActive,
            deletedAt: data.deletedAt,
            profile: {
              create: data.profile,
            },
          },
          include: { profile: true },
        });
        return newUser;
      });
    } catch (error) {
      logger.error('Error in AdminRepository.createUserWithProfile:', error);
      throw error;
    }
  }

  async emailExists(email: string, excludeUserId?: number) {
    try {
      return await prisma.user.findFirst({
        where: { email, id: { not: excludeUserId } },
      });
    } catch (error) {
      logger.error('Error in AdminRepository.emailExists:', error);
      throw error;
    }
  }

  async phoneExists(phone: string) {
    try {
      return await prisma.user.findFirst({
        where: { phone },
      });
    } catch (error) {
      logger.error('Error in AdminRepository.phoneExists:', error);
      throw error;
    }
  }

  async usernameExists(username: string, excludeUserId?: number) {
    try {
      return await prisma.profile.findFirst({
        where: { username, userId: { not: excludeUserId } },
      });
    } catch (error) {
      logger.error('Error in AdminRepository.usernameExists:', error);
      throw error;
    }
  }
}

export default AdminRepository.getInstance();  
  