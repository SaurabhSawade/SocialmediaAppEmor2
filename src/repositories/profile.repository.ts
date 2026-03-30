import prisma from "../prisma/client";
import logger from "../config/logger";

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
      return await prisma.profile.findUnique({
        where: { userId },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              phone: true,
              isVerified: true,
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
      logger.error("Error in ProfileRepository.findByUserId:", error);
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
      logger.error("Error in ProfileRepository.findByUsername:", error);
      throw error;
    }
  }

  async update(
    userId: number,
    data: {
      username?: string;
      fullName?: string;
      bio?: string;
      avatarUrl?: string;
    },
  ) {
    try {
      return await prisma.profile.update({
        where: { userId },
        data,
      });
    } catch (error) {
      logger.error("Error in ProfileRepository.update:", error);
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
      logger.error(
        "Error in ProfileRepository.checkUsernameAvailability:",
        error,
      );
      throw error;
    }
  }
}

export default ProfileRepository.getInstance();
