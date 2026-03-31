import ProfileRepository from '../repositories/profile.repository';
import { Messages } from '../constants/messages';
import { UpdateProfileDTO } from '../types/dto/user.dto';
import { Helpers } from '../utils/helpers';
import logger from '../config/logger';

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
}

export default ProfileService.getInstance();