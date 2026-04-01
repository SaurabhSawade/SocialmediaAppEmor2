import ProfileRepository from '../repositories/profile.repository';
import { Messages } from '../constants/messages';
import { UpdateProfileDTO } from '../types/dto/user.dto';
import { Helpers } from '../utils/helpers';
import logger from '../config/logger';
import path from 'path';
import fs from 'fs';
import { ImageProcessor } from '../utils/image-processor'
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
        throw new Error('Invalid username format. Username can only contain letters, numbers, underscores, and dots.');
      }
      
      const isAvailable = await ProfileRepository.checkUsernameAvailability(data.username, userId);
      if (!isAvailable) {
        throw new Error(Messages.USERNAME_EXISTS);
      }
    }
    
    // Validate website URL if provided
    if (data.website) {
      const urlPattern = /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/;
      if (!urlPattern.test(data.website)) {
        throw new Error('Invalid website URL. Please provide a valid URL (e.g., https://example.com)');
      }
    }
    
    // Validate gender
    if (data.gender && !['male', 'female', 'other', 'prefer_not_to_say'].includes(data.gender)) {
      throw new Error('Invalid gender value. Allowed values: male, female, other, prefer_not_to_say');
    }
    
    const profile = await ProfileRepository.update(userId, data);
    
    if (!profile) {
      throw new Error(Messages.PROFILE_NOT_FOUND);
    }
    
    return {
      message: Messages.UPDATED,
      profile: {
        id: profile.id,
        userId: profile.userId,
        username: profile.username,
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
      website: profile.website,
      gender: profile.gender,
      isPrivate: profile.isPrivate,
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
  
  async getProfileByUserId(userId: number) {
    const profile = await ProfileRepository.findByUserId(userId);
    
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
      website: profile.website,
      gender: profile.gender,
      isPrivate: profile.isPrivate,
      emailNotifications: profile.emailNotifications,
      pushNotifications: profile.pushNotifications,
      email: profile.user.email,
      phone: profile.user.phone,
      isVerified: profile.user.isVerified,
      stats: {
        postsCount: profile.user._count.posts,
        followersCount: profile.user._count.followers,
        followingCount: profile.user._count.following,
      },
        createdAt: profile.user.createdAt,
        lastLoginAt: profile.user.lastLoginAt,
      };
    }
  
    async uploadAvatar(userId: number, file: Express.Multer.File): Promise<{ avatarUrl: string; message: string }> {
    try {
      // Fetch the current avatar before updating to avoid deleting the newly uploaded image.
      const currentProfile = await ProfileRepository.findByUserId(userId);
      const oldAvatarUrl = currentProfile?.avatarUrl;

      const uploadDir = path.join(process.cwd(), 'uploads', 'avatars');
      const processedFilename = `${userId}_${Date.now()}.jpg`;
      const processedPath = path.join(uploadDir, processedFilename);

      // Process and optimize image
      await ImageProcessor.processAvatar(file.path, processedPath);

      const avatarUrl = `/uploads/avatars/${processedFilename}`;

      // Update profile with new avatar
      await ProfileRepository.update(userId, { avatarUrl });

      // Delete old avatar if exists and is not the same as the newly uploaded one
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
      throw new Error('Failed to upload avatar');
    }
  }
  
  async removeAvatar(userId: number): Promise<{ message: string }> {
    const profile = await ProfileRepository.findByUserId(userId);
    
    if (profile?.avatarUrl) {
      const avatarPath = path.join(process.cwd(), profile.avatarUrl);
      if (fs.existsSync(avatarPath)) {
        fs.unlinkSync(avatarPath);
      }
    }
    
    await ProfileRepository.update(userId, { avatarUrl: null });
    
    return { message: 'Avatar removed successfully' };
  }
}

export default ProfileService.getInstance();