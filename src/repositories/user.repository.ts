import prisma from "../prisma/client";
import { Prisma } from "../generated/prisma";
import logger from "../config/logger";

export class UserRepository {
  private static instance: UserRepository;

  private constructor() {}

  static getInstance(): UserRepository {
    if (!UserRepository.instance) {
      UserRepository.instance = new UserRepository();
    }
    return UserRepository.instance;
  }

  async findById(id: number, includeDeleted: boolean = false) {
    try {
      return await prisma.user.findUnique({
        where: {
          id,
          ...(includeDeleted ? {} : { deletedAt: null }),
        },
        include: {
          profile: true,
        },
      });
    } catch (error) {
      logger.error("Error in UserRepository.findById:", error);
      throw error;
    }
  }

  async findByEmail(email: string, includeDeleted: boolean = false) {
    try {
      return await prisma.user.findFirst({
        where: {
          email,
          ...(includeDeleted ? {} : { deletedAt: null }),
        },
        include: {
          profile: true,
        },
      });
    } catch (error) {
      logger.error("Error in UserRepository.findByEmail:", error);
      // throw error;
      return false
    }
  }

  async findByPhone(phone: string, includeDeleted: boolean = false) {
    try {
      return await prisma.user.findFirst({
        where: {
          phone,
          ...(includeDeleted ? {} : { deletedAt: null }),
        },
        include: {
          profile: true,
        },
      });
    } catch (error) {
      logger.error("Error in UserRepository.findByPhone:", error);
      throw error;
    }
  }

  async findByEmailOrPhone(
    identifier: string,
    includeDeleted: boolean = false,
  ) {
    try {
      return await prisma.user.findFirst({
        where: {
          OR: [{ email: identifier }, { phone: identifier }],
          ...(includeDeleted ? {} : { deletedAt: null }),
        },
        include: {
          profile: true,
        },
      });
    } catch (error) {
      logger.error("Error in UserRepository.findByEmailOrPhone:", error);
      throw error;
    }
  }

  async create(data: {
    email?: string;
    phone?: string;
    password: string;
    profile: {
      username: string;
      fullName?: string;
    };
  }) {
    try {
      return await prisma.$transaction(async (tx) => {
        const user = await tx.user.create({
          data: {
            email: data.email,
            phone: data.phone,
            password: data.password,
            profile: {
              create: data.profile,
            },
          },
          include: {
            profile: true,
          },
        });

        return user;
      });
    } catch (error) {
      logger.error("Error in UserRepository.create:", error);
      throw error;
    }
  }

  async update(id: number, data: Partial<Prisma.UserUpdateInput>) {
    try {
      return await prisma.user.update({
        where: { id },
        data,
        include: {
          profile: true,
        },
      });
    } catch (error) {
      logger.error("Error in UserRepository.update:", error);
      throw error;
    }
  }

  async softDelete(id: number) {
    try {
      return await prisma.user.update({
        where: { id },
        data: { deletedAt: new Date() },
      });
    } catch (error) {
      logger.error("Error in UserRepository.softDelete:", error);
      throw error;
    }
  }

  async updatePassword(id: number, hashedPassword: string) {
    try {
      return await prisma.user.update({
        where: { id },
        data: { password: hashedPassword },
      });
    } catch (error) {
      logger.error("Error in UserRepository.updatePassword:", error);
      throw error;
    }
  }

  async updateEmail(id: number, email: string) {
    try {
      return await prisma.user.update({
        where: { id },
        data: { email },
      });
    } catch (error) {
      logger.error("Error in UserRepository.updateEmail:", error);
      throw error;
    }
  }

  async verifyUser(id: number) {
    try {
      return await prisma.user.update({
        where: { id },
        data: { isVerified: true },
      });
    } catch (error) {
      logger.error("Error in UserRepository.verifyUser:", error);
      throw error;
    }
  }

  async getUserWithStats(id: number) {
    try {
      return await prisma.user.findUnique({
        where: { id, deletedAt: null },
        include: {
          profile: true,
          _count: {
            select: {
              posts: true,
              followers: true,
              following: true,
            },
          },
        },
      });
    } catch (error) {
      logger.error("Error in UserRepository.getUserWithStats:", error);
      throw error;
    }
  }
}

export default UserRepository.getInstance();
