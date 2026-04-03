import prisma from '../prisma/client';
import logger from '../config/logger';
import { AppError } from "../utils/app-error";
import { Messages } from '../constants/messages';

export class ProfileRepository {
  private static instance: ProfileRepository;
  
  private constructor() {}
  
  static getInstance(): ProfileRepository {
    if (!ProfileRepository.instance) {
      ProfileRepository.instance = new ProfileRepository();
    }
    return ProfileRepository.instance;
  }
  
  async findByUserId(userId: number) {
    try {
      console.log(`DEBUG: ProfileRepository.findByUserId called for userId: ${userId}`);
      const result = await prisma.profile.findUnique({
        where: { userId },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              phone: true,
              isVerified: true,
              isActive: true,
              createdAt: true,
              lastLoginAt: true,
              _count: {
                select: {
                  posts: true,
                  followers: true,
                  following: true,
                },
              },
            },
          },
        },
      });
      console.log(`DEBUG: ProfileRepository result for userId ${userId}:`, result ? 'FOUND' : 'NOT_FOUND');
      return result;
    } catch (error) {
      logger.error('Error in ProfileRepository.findByUserId:', error);
      throw error;
    }
  }
  
  async findByUsername(username: string) {
    try {
      return await prisma.profile.findUnique({
        where: { username },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              phone: true,
              isVerified: true,
              isActive: true,
              createdAt: true,
              _count: {
                select: {
                  posts: true,
                  followers: true,
                  following: true,
                },
              },
            },
          },
        },
      });
    } catch (error) {
      logger.error('Error in ProfileRepository.findByUsername:', error);
      throw error;
    }
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
    try {
      // If username is being updated, check availability first
      if (data.username) {
        const existing = await prisma.profile.findFirst({
          where: {
            username: data.username,
            userId: { not: userId },
          },
        });
        
        if (existing) {
          throw new AppError(Messages.USERNAME_EXISTS);
        }
      }
      
      return await prisma.profile.update({
        where: { userId },
        data,
      });
    } catch (error) {
      logger.error('Error in ProfileRepository.update:', error);
      throw error;
    }
  }
  
  async updateAvatar(userId: number, avatarUrl: string, avatarKey?: string) {
    try {
      return await prisma.profile.update({
        where: { userId },
        data: {
          avatarUrl,
          avatarKey,
        },
      });
    } catch (error) {
      logger.error('Error in ProfileRepository.updateAvatar:', error);
      throw error;
    }
  }
  
  async checkUsernameAvailability(username: string, excludeUserId?: number) {
    try {
      const profile = await prisma.profile.findFirst({
        where: {
          username,
          ...(excludeUserId ? { userId: { not: excludeUserId } } : {}),
        },
      });
      return !profile;
    } catch (error) {
      logger.error('Error in ProfileRepository.checkUsernameAvailability:', error);
      throw error;
    }
  }
  
  async getProfileWithFollowers(username: string, currentUserId?: number) {
    try {
      const profile = await prisma.profile.findUnique({
        where: { username },
        include: {
          user: {
            include: {
              _count: {
                select: {
                  posts: true,
                  followers: true,
                  following: true,
                },
              },
              followers: currentUserId ? {
                where: { followerId: currentUserId },
                take: 1,
              } : false,
            },
          },
        },
      });
      
      if (!profile) return null;
      
      return {
        ...profile,
        isFollowedByCurrentUser: profile.user.followers?.length > 0,
      };
    } catch (error) {
      logger.error('Error in ProfileRepository.getProfileWithFollowers:', error);
      throw error;
    }
  }
}

export default ProfileRepository.getInstance();