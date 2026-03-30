import UserRepository from "../repositories/user.repository";
import { Messages } from "../constants/messages";
import { Helpers } from "../utils/helpers";
import logger from "../config/logger";

export class UserService {
  private static instance: UserService;

  private constructor() {}

  static getInstance(): UserService {
    if (!UserService.instance) {
      UserService.instance = new UserService();
    }
    return UserService.instance;
  }

  async getUserProfile(userId: number) {
    const user = await UserRepository.getUserWithStats(userId);

    if (!user) {
      throw new Error(Messages.USER_NOT_FOUND);
    }

    return {
      id: user.id,
      email: user.email,
      phone: user.phone,
      isVerified: user.isVerified,
      username: user.profile?.username,
      fullName: user.profile?.fullName,
      bio: user.profile?.bio,
      avatarUrl: user.profile?.avatarUrl,
      stats: {
        postsCount: user._count.posts,
        followersCount: user._count.followers,
        followingCount: user._count.following,
      },
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  async softDeleteUser(userId: number) {
    const user = await UserRepository.findById(userId);

    if (!user) {
      throw new Error(Messages.USER_NOT_FOUND);
    }

    await UserRepository.softDelete(userId);

    return { message: Messages.DELETED };
  }
}

export default UserService.getInstance();
