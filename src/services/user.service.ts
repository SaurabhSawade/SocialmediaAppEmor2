import UserRepository from '../repositories/user.repository';
import ProfileRepository from '../repositories/profile.repository';
import TokenRepository from '../repositories/token.repository';
import { Messages } from '../constants/messages';
import { OTPType } from '../constants/enums';
import { UpdateProfileDTO, UpdateSettingsDTO, UserProfileResponseDTO } from '../types/dto/user.dto';
import { Helpers } from '../utils/helpers';
import env from '../config/env';
import bcrypt from 'bcryptjs';

export class UserService {
  private static instance: UserService;
  private saltRounds = 10;
  
  private constructor() {}
  
  static getInstance(): UserService {
    if (!UserService.instance) {
      UserService.instance = new UserService();
    }
    return UserService.instance;
  }
  
  private async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, this.saltRounds);
  }
  
  private async comparePassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }
  
  async getUserProfile(userId: number): Promise<UserProfileResponseDTO> {
    const profile = await ProfileRepository.findByUserId(userId);
    
    if (!profile) {
      console.error(`DEBUG: Profile not found for userId: ${userId}`);
      throw new Error(Messages.USER_NOT_FOUND);
    }
    
    return {
      id: profile.user.id,
      email: profile.user.email ?? undefined,
      phone: profile.user.phone ?? undefined,
      username: profile.username,
      fullName: profile.fullName ?? undefined,
      bio: profile.bio ?? undefined,
      avatarUrl: profile.avatarUrl ?? undefined,
      website: profile.website ?? undefined,
      gender: profile.gender ?? undefined,
      isPrivate: profile.isPrivate,
      isVerified: profile.user.isVerified,
      stats: {
        postsCount: profile.user._count.posts,
        followersCount: profile.user._count.followers,
        followingCount: profile.user._count.following,
      },
      createdAt: profile.user.createdAt,
      lastLoginAt: profile.user.lastLoginAt ?? undefined,
    };
  }
  
  async updateProfile(userId: number, data: UpdateProfileDTO) {
    // Validate username if provided
    if (data.username) {
      if (!Helpers.isValidUsername(data.username)) {
        throw new Error('Invalid username format');
      }
    }
    
    // Validate website URL if provided
    if (data.website) {
      const urlPattern = /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]*)*\/?$/;
      if (!urlPattern.test(data.website)) {
        throw new Error('Invalid website URL');
      }
    }
    
    // Validate gender
    if (data.gender && !['male', 'female', 'other', 'prefer_not_to_say'].includes(data.gender)) {
      throw new Error('Invalid gender value');
    }
    
    const profile = await ProfileRepository.update(userId, data);
    
    if (!profile) {
      throw new Error(Messages.PROFILE_NOT_FOUND);
    }
    
    return {
      message: Messages.UPDATED,
      profile: {
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
  
  async updateAvatar(userId: number, avatarUrl: string, avatarKey?: string) {
    const profile = await ProfileRepository.updateAvatar(userId, avatarUrl, avatarKey);
    
    return {
      message: 'Avatar updated successfully',
      avatarUrl: profile?.avatarUrl,
    };
  }
  
  async removeAvatar(userId: number) {
    await ProfileRepository.update(userId, {
      avatarUrl: undefined,
      avatarKey: undefined,
    });
    
    return {
      message: 'Avatar removed successfully',
    };
  }
  
  async updateSettings(userId: number, data: UpdateSettingsDTO) {
    const profile = await ProfileRepository.update(userId, data);
    
    return {
      message: 'Settings updated successfully',
      settings: {
        emailNotifications: profile?.emailNotifications,
        pushNotifications: profile?.pushNotifications,
      },
    };
  }
  
  async changeEmail(userId: number, newEmail: string, password: string, otp?: string) {
    // Verify password
    const user = await UserRepository.findById(userId);
    if (!user) {
      throw new Error(Messages.USER_NOT_FOUND);
    }
    
    const isValidPassword = await this.comparePassword(password, user.password);
    if (!isValidPassword) {
      throw new Error('Invalid password');
    }
    
    if (user.email === newEmail) {
      throw new Error('New email cannot be same as current email');
    }
    
    // Check if email is already taken
    const existingUser = await UserRepository.findByEmail(newEmail);
    if (existingUser && existingUser.id !== userId) {
      throw new Error(Messages.EMAIL_EXISTS);
    }
    
    // If OTP provided, verify it
    const OTPService = (await import('./otp.service')).default;

    if (otp) {
      const isValidOTP = await OTPService.verifyOTP(userId, otp, OTPType.EMAIL_VERIFICATION);
      if (!isValidOTP) {
        throw new Error(Messages.INVALID_OTP);
      }

      await UserRepository.update(userId, { email: newEmail });
      return { message: 'Email changed successfully', otpSent: false };
    }

    // Send OTP for verification
    await OTPService.generateAndSendOTP(userId, newEmail, OTPType.EMAIL_VERIFICATION);
    return {
      message: 'OTP sent to new email. Please verify to complete email change.',
      otpSent: true,
    };
  }
  
  async changePhone(userId: number, newPhone: string, password: string, otp?: string) {
    // Similar to changeEmail logic
    const user = await UserRepository.findById(userId);
    if (!user) {
      throw new Error(Messages.USER_NOT_FOUND);
    }
    
    const isValidPassword = await this.comparePassword(password, user.password);
    if (!isValidPassword) {
      throw new Error('Invalid password');
    }
    
    if (user.phone === newPhone) {
      throw new Error('New phone cannot be same as current phone');
    }
    
    const existingUser = await UserRepository.findByPhone(newPhone);
    if (existingUser && existingUser.id !== userId) {
      throw new Error(Messages.PHONE_EXISTS);
    }
    
    const OTPService = (await import('./otp.service')).default;

    if (otp) {
      const isValidOTP = await OTPService.verifyOTP(userId, otp, OTPType.PHONE_VERIFICATION);
      if (!isValidOTP) {
        throw new Error(Messages.INVALID_OTP);
      }

      await UserRepository.update(userId, { phone: newPhone });
      return { message: 'Phone number changed successfully', otpSent: false };
    }

    // Send OTP for verification
    // TODO: integrate SMS provider here similar to email
    return {
      message: 'OTP sent to new phone. Please verify to complete phone change.',
      otpSent: true,
    };
  }
  
  async deleteAccount(userId: number, password: string): Promise<{ message: string }> {
    // Verify password before soft delete
    const user = await UserRepository.findById(userId);
    if (!user) {
      throw new Error(Messages.USER_NOT_FOUND);
    }
    
    const isValidPassword = await this.comparePassword(password, user.password);
    if (!isValidPassword) {
      throw new Error('Invalid password');
    }
    
    // Soft delete user
    await UserRepository.softDelete(userId);
    
    // Revoke all tokens and sessions
    await TokenRepository.revokeAllUserTokens(userId);
    await TokenRepository.revokeAllUserSessions(userId);
    
    return { message: Messages.DELETED };
  }
  
  async restoreAccount(userId: number): Promise<{ message: string }> {
    // For admin use or after verification
    const user = await UserRepository.findById(userId, true);
    
    if (!user) {
      throw new Error(Messages.USER_NOT_FOUND);
    }
    
    if (!user.deletedAt) {
      throw new Error('Account is not deleted');
    }
    
    await UserRepository.update(userId, { deletedAt: null });
    
    return { message: 'Account restored successfully' };
  }
  
  async getPublicProfile(username: string, currentUserId?: number) {
    const profile = await ProfileRepository.getProfileWithFollowers(username, currentUserId);
    
    if (!profile) {
      throw new Error(Messages.PROFILE_NOT_FOUND);
    }
    
    // If account is private and current user doesn't follow, show limited info
    const isPrivate = profile.isPrivate;
    const isOwner = currentUserId === profile.userId;
    const isFollowing = profile.isFollowedByCurrentUser;
    
    if (isPrivate && !isOwner && !isFollowing) {
      return {
        username: profile.username,
        fullName: profile.fullName,
        avatarUrl: profile.avatarUrl,
        bio: profile.bio,
        isPrivate: true,
        isFollowedByCurrentUser: false,
        postsCount: 0,
        followersCount: 0,
        followingCount: 0,
      };
    }
    
    return {
      id: profile.user.id,
      username: profile.username,
      fullName: profile.fullName,
      bio: profile.bio,
      avatarUrl: profile.avatarUrl,
      website: profile.website,
      isPrivate: profile.isPrivate,
      isFollowedByCurrentUser: profile.isFollowedByCurrentUser,
      stats: {
        postsCount: profile.user._count.posts,
        followersCount: profile.user._count.followers,
        followingCount: profile.user._count.following,
      },
      joinedDate: profile.user.createdAt,
    };
  }
}

export default UserService.getInstance();