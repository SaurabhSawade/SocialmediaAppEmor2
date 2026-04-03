import prisma from '../prisma/client';
import logger from '../config/logger';

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
            stats: {
              postsCount: user.posts.length,
              commentsCount,
              likesReceived,
              likesGiven,
              followersCount: user._count.followers,
              followingCount: user._count.following,
              totalEngagement,
            },
            posts: user.posts.map((post: any) => ({
              id: post.id,
              caption: post.caption,
              location: post.location,
              mediaCount: post.media.length,
              likesCount: post._count.likes,
              commentsCount: post._count.comments,
              isArchived: post.isArchived,
              createdAt: post.createdAt.toISOString(),
              comments: post.comments.map((comment: any) => ({
                id: comment.id,
                content: comment.content,
                author: {
                  id: comment.user.id,
                  username: comment.user.profile?.username,
                  fullName: comment.user.profile?.fullName,
                },
                likesCount: comment._count.likes,
                replies: comment.replies.map((reply: any) => ({
                  id: reply.id,
                  content: reply.content,
                  author: {
                    id: reply.user.id,
                    username: reply.user.profile?.username,
                    fullName: reply.user.profile?.fullName,
                  },
                  createdAt: reply.createdAt.toISOString(),
                })),
              })),
            })),

            createdAt: user.createdAt.toISOString(),
            deletedAt: user.deletedAt?.toISOString() || null,
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
}

export default AdminRepository.getInstance();  
  