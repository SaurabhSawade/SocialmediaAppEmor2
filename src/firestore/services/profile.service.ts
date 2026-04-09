import FirestoreProfileRepository from '../repositories/profile.repository';
import { Messages } from '../../constants/messages';
import { UpdateProfileDTO } from '../../types/dto/user.dto';
import { Helpers } from '../../utils/helpers';
import logger from '../../config/logger';
import path from 'path';
import fs from 'fs';
import { ImageProcessor } from '../../utils/image-processor';
import { AppError } from "../../utils/app-error";

export class FirestoreProfileService {
  private static instance: FirestoreProfileService;
  
  private constructor() {}
  
  static getInstance(): FirestoreProfileService {
    if (!FirestoreProfileService.instance) {
      FirestoreProfileService.instance = new FirestoreProfileService();
    }
    return FirestoreProfileService.instance;
  }
  
  async updateProfile(userId: number, data: UpdateProfileDTO) {
    if (data.username) {
      if (!Helpers.isValidUsername(data.username)) {
        return new AppError('Invalid username format. Username can only contain letters, numbers, underscores, and dots.');
      }
      
      const isAvailable = await FirestoreProfileRepository.checkUsernameAvailability(data.username, userId);
      if (!isAvailable) {
        return new AppError(Messages.USERNAME_EXISTS);
      }
    }
    
    if (data.website) {
      const urlPattern = /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]*)*\/?$/;
      if (!urlPattern.test(data.website)) {
        return new AppError('Invalid website URL. Please provide a valid URL (e.g., https://example.com)');
      }
    }
    
    if (data.gender && !['male', 'female', 'other', 'prefer_not_to_say'].includes(data.gender)) {
      return new AppError('Invalid gender value. Allowed values: male, female, other, prefer_not_to_say');
    }
    
    const profile = await FirestoreProfileRepository.update(userId, data);
    
    if (profile instanceof AppError) {
      return profile;
    }
    
    if (!profile) {
      return new AppError(Messages.PROFILE_NOT_FOUND);
    }
    
    return {
      message: Messages.UPDATED,
      profile: {
        id: profile.id,
        userId: profile.userId,
        username: profile.username || '',
        fullName: profile.fullName,
        bio: profile.bio,
        avatarUrl: profile.avatarUrl,
        website: profile.website,
        gender: profile.gender,
        isPrivate: profile.isPrivate,
        emailNotifications: profile.emailNotifications,
        pushNotifications: profile.pushNotifications,
      },
    };
  }
  
  async getProfileByUsername(username: string) {
    const profile = await FirestoreProfileRepository.findByUsername(username);
    
    if (!profile) {
      return new AppError(Messages.PROFILE_NOT_FOUND);
    }
    
    return {
      id: profile.id,
      userId: profile.userId,
      username: profile.username || '',
      fullName: profile.fullName,
      bio: profile.bio,
      avatarUrl: profile.avatarUrl,
      website: profile.website,
      gender: profile.gender,
      isPrivate: profile.isPrivate,
      email: profile.user?.email,
      phone: profile.user?.phone,
      isVerified: profile.user?.isVerified,
      stats: {
        postsCount: profile.user?._count?.posts || 0,
        followersCount: profile.user?._count?.followers || 0,
        followingCount: profile.user?._count?.following || 0,
      },
      joinedDate: profile.user?.createdAt,
    };
  }
  
  async getProfileByUserId(userId: number) {
    const profile = await FirestoreProfileRepository.findByUserId(userId);
    
    if (!profile) {
      return new AppError(Messages.PROFILE_NOT_FOUND);
    }
    
    return {
      id: profile.id,
      userId: profile.userId,
      username: profile.username || '',
      fullName: profile.fullName,
      bio: profile.bio,
      avatarUrl: profile.avatarUrl,
      website: profile.website,
      gender: profile.gender,
      isPrivate: profile.isPrivate,
      emailNotifications: profile.emailNotifications,
      pushNotifications: profile.pushNotifications,
      email: profile.user?.email,
      phone: profile.user?.phone,
      isVerified: profile.user?.isVerified,
      stats: {
        postsCount: profile.user?._count?.posts || 0,
        followersCount: profile.user?._count?.followers || 0,
        followingCount: profile.user?._count?.following || 0,
      },
      createdAt: profile.user?.createdAt,
      lastLoginAt: profile.user?.lastLoginAt,
    };
  }
  
  async uploadAvatar(userId: number, file: Express.Multer.File): Promise<{ avatarUrl: string; message: string }> {
    try {
      const currentProfile = await FirestoreProfileRepository.findByUserId(userId);
      const oldAvatarUrl = currentProfile?.avatarUrl;

      const uploadDir = path.join(process.cwd(), 'uploads', 'avatars');
      const processedFilename = `${userId}_${Date.now()}.jpg`;
      const processedPath = path.join(uploadDir, processedFilename);

      await ImageProcessor.processAvatar(file.path, processedPath);

      const avatarUrl = `/uploads/avatars/${processedFilename}`;

      await FirestoreProfileRepository.updateAvatar(userId, avatarUrl);

      if (oldAvatarUrl && oldAvatarUrl !== avatarUrl) {
        const oldPath = path.join(process.cwd(), oldAvatarUrl);
        if (fs.existsSync(oldPath)) {
          fs.unlinkSync(oldPath);
        }
      }

      return {
        message: 'Avatar uploaded successfully',
        avatarUrl,
      };
    } catch (error) {
      logger.error('Error uploading avatar:', error);
      throw new AppError(Messages.AVATAR_UPLOAD_FAILED);
    }
  }
  
  async removeAvatar(userId: number): Promise<{ message: string }> {
    const profile = await FirestoreProfileRepository.findByUserId(userId);
    
    if (profile?.avatarUrl) {
      const avatarPath = path.join(process.cwd(), profile.avatarUrl);
      if (fs.existsSync(avatarPath)) {
        fs.unlinkSync(avatarPath);
      }
    }
    
    await FirestoreProfileRepository.update(userId, { avatarUrl: null });
    
    return { message: 'Avatar removed successfully' };
  }

  async checkUsernameAvailability(username: string): Promise<{ username: string; isAvailable: boolean }> {
    const isAvailable = await FirestoreProfileRepository.checkUsernameAvailability(username);
    return { username, isAvailable };
  }
}

export default FirestoreProfileService.getInstance();
