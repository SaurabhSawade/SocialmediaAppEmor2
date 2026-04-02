import prisma from '../prisma/client';
import logger from '../config/logger';

export class FollowRepository {
  private static instance: FollowRepository;
  
  private constructor() {}
  
  static getInstance(): FollowRepository {
    if (!FollowRepository.instance) {
      FollowRepository.instance = new FollowRepository();
    }
    return FollowRepository.instance;
  }
  
  async follow(followerId: number, followingId: number) {
    try {
      return await prisma.follow.create({
        data: {
          followerId,
          followingId,
        },
        include: {
          follower: {
            include: { profile: true },
          },
          following: {
            include: { profile: true },
          },
        },
      });
    } catch (error) {
      logger.error('Error in FollowRepository.follow:', error);
      throw error;
    }
  }
  
  async unfollow(followerId: number, followingId: number) {
    try {
      return await prisma.follow.deleteMany({
        where: {
          followerId,
          followingId,
        },
      });
    } catch (error) {
      logger.error('Error in FollowRepository.unfollow:', error);
      throw error;
    }
  }
  
  async findFollow(followerId: number, followingId: number) {
    try {
      return await prisma.follow.findUnique({
        where: {
          followerId_followingId: {
            followerId,
            followingId,
          },
        },
      });
    } catch (error) {
      logger.error('Error in FollowRepository.findFollow:', error);
      throw error;
    }
  }
  
  async getFollowers(userId: number, page: number = 1, limit: number = 20, currentUserId?: number) {
    try {
      const skip = (page - 1) * limit;
      
      const followers = await prisma.follow.findMany({
        where: { followingId: userId },
        include: {
          follower: {
            include: {
              profile: true,
              followers: currentUserId ? {
                where: { followerId: currentUserId },
                take: 1,
              } : false,
            },
          },
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      });
      
      const total = await prisma.follow.count({
        where: { followingId: userId },
      });
      
      return {
        users: followers.map(f => ({
          id: f.follower.id,
          username: f.follower.profile?.username,
          fullName: f.follower.profile?.fullName,
          avatarUrl: f.follower.profile?.avatarUrl,
          bio: f.follower.profile?.bio,
          isPrivate: f.follower.profile?.isPrivate || false,
          isFollowedByCurrentUser: f.follower.followers?.length > 0,
          followedAt: f.createdAt,
        })),
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      };
    } catch (error) {
      logger.error('Error in FollowRepository.getFollowers:', error);
      throw error;
    }
  }
  
  async getFollowing(userId: number, page: number = 1, limit: number = 20, currentUserId?: number) {
    try {
      const skip = (page - 1) * limit;
      
      const following = await prisma.follow.findMany({
        where: { followerId: userId },
        include: {
          following: {
            include: {
              profile: true,
              followers: currentUserId ? {
                where: { followerId: currentUserId },
                take: 1,
              } : false,
            },
          },
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      });
      
      const total = await prisma.follow.count({
        where: { followerId: userId },
      });
      
      return {
        users: following.map(f => ({
          id: f.following.id,
          username: f.following.profile?.username,
          fullName: f.following.profile?.fullName,
          avatarUrl: f.following.profile?.avatarUrl,
          bio: f.following.profile?.bio,
          isPrivate: f.following.profile?.isPrivate || false,
          isFollowedByCurrentUser: f.following.followers?.length > 0,
          followedAt: f.createdAt,
        })),
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      };
    } catch (error) {
      logger.error('Error in FollowRepository.getFollowing:', error);
      throw error;
    }
  }
  
  async getFollowStats(userId: number) {
    try {
      const [followersCount, followingCount] = await Promise.all([
        prisma.follow.count({ where: { followingId: userId } }),
        prisma.follow.count({ where: { followerId: userId } }),
      ]);
      
      return { followersCount, followingCount };
    } catch (error) {
      logger.error('Error in FollowRepository.getFollowStats:', error);
      throw error;
    }
  }
  
  async checkFollowStatus(followerId: number, followingId: number) {
    try {
      const follow = await prisma.follow.findUnique({
        where: {
          followerId_followingId: {
            followerId,
            followingId,
          },
        },
      });
      return !!follow;
    } catch (error) {
      logger.error('Error in FollowRepository.checkFollowStatus:', error);
      throw error;
    }
  }
  
  async getMutualFollowers(userId: number, targetUserId: number) {
    try {
      const userFollowing = await prisma.follow.findMany({
        where: { followerId: userId },
        select: { followingId: true },
      });
      
      const userFollowingIds = userFollowing.map(f => f.followingId);
      
      const mutualFollowers = await prisma.follow.findMany({
        where: {
          followerId: targetUserId,
          followingId: { in: userFollowingIds },
        },
        include: {
          following: {
            include: { profile: true },
          },
        },
      });
      
      return mutualFollowers.map(f => ({
        id: f.following.id,
        username: f.following.profile?.username,
        fullName: f.following.profile?.fullName,
        avatarUrl: f.following.profile?.avatarUrl,
      }));
    } catch (error) {
      logger.error('Error in FollowRepository.getMutualFollowers:', error);
      throw error;
    }
  }
}

export default FollowRepository.getInstance();