import ProfileRepository from "../repositories/profile.repository";
import { Messages } from "../constants/messages";
import { UpdateProfileDTO } from "../types/dto/profile.dto";
import { Helpers } from "../utils/helpers";
import logger from "../config/logger";

export class ProfileService {
  private static instance: ProfileService;

  private constructor() {}

  static getInstance(): ProfileService {
    if (!ProfileService.instance) {
      ProfileService.instance = new ProfileService();
    }
    return ProfileService.instance;
  }

  async updateProfile(userId: number, data: UpdateProfileDTO) {
    // Validate username if provided
    if (data.username) {
      if (!Helpers.isValidUsername(data.username)) {
        throw new Error("Invalid username format");
      }

      const isAvailable = await ProfileRepository.checkUsernameAvailability(
        data.username,
        userId,
      );
      if (!isAvailable) {
        throw new Error(Messages.USERNAME_EXISTS);
      }
    }

    const profile = await ProfileRepository.update(userId, data);

    if (!profile) {
      throw new Error(Messages.PROFILE_NOT_FOUND);
    }

    return {
      message: Messages.UPDATED,
      profile,
    };
  }

  async getProfileByUsername(username: string) {
    const profile = await ProfileRepository.findByUsername(username);

    if (!profile) {
      throw new Error(Messages.PROFILE_NOT_FOUND);
    }

    return {
      id: profile.id,
      userId: profile.userId,
      username: profile.username,
      fullName: profile.fullName,
      bio: profile.bio,
      avatarUrl: profile.avatarUrl,
      email: profile.user.email,
      phone: profile.user.phone,
      isVerified: profile.user.isVerified,
      stats: {
        postsCount: profile.user._count.posts,
        followersCount: profile.user._count.followers,
        followingCount: profile.user._count.following,
      },
      joinedDate: profile.user.createdAt,
    };
  }
}

export default ProfileService.getInstance();
