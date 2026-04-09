import FirestoreUserRepository from '../repositories/user.repository';
import FirestoreProfileRepository from '../repositories/profile.repository';
import FirestoreTokenRepository from '../repositories/token.repository';
import { Messages } from '../../constants/messages';
import { OTPType } from '../../constants/enums';
import { UpdateProfileDTO, UpdateSettingsDTO, UserProfileResponseDTO } from '../../types/dto/user.dto';
import { Helpers } from '../../utils/helpers';
import env from '../../config/env';
import bcrypt from 'bcryptjs';
import { AppError } from "../../utils/app-error";

export class FirestoreUserService {
  private static instance: FirestoreUserService;
  private saltRounds = 10;
  
  private constructor() {}
  
  static getInstance(): FirestoreUserService {
    if (!FirestoreUserService.instance) {
      FirestoreUserService.instance = new FirestoreUserService();
    }
    return FirestoreUserService.instance;
  }
  
  private async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, this.saltRounds);
  }
  
  private async comparePassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }
  
  async getUserProfile(userId: number): Promise<UserProfileResponseDTO> {
    const profile = await FirestoreProfileRepository.findByUserId(userId);
    
    if (!profile) {
      console.error(`DEBUG: Profile not found for userId: ${userId}`);
      throw new AppError(Messages.USER_NOT_FOUND);
    }
    
    return {
      id: profile.userId,
      email: profile.user?.email ?? undefined,
      phone: profile.user?.phone ?? undefined,
      username: profile.username || '',
      fullName: profile.fullName ?? undefined,
      bio: profile.bio ?? undefined,
      avatarUrl: profile.avatarUrl ?? undefined,
      website: profile.website ?? undefined,
      gender: profile.gender ?? undefined,
      isPrivate: profile.isPrivate,
      isVerified: profile.user?.isVerified ?? false,
      stats: {
        postsCount: profile.user?._count?.posts ?? 0,
        followersCount: profile.user?._count?.followers ?? 0,
        followingCount: profile.user?._count?.following ?? 0,
      },
      createdAt: profile.user?.createdAt,
      lastLoginAt: profile.user?.lastLoginAt,
    };
  }
  
  async updateProfile(userId: number, data: UpdateProfileDTO) {
    if (data.username) {
      if (!Helpers.isValidUsername(data.username)) {
        throw new AppError('Invalid username format');
      }
    }
    
    if (data.website) {
      const urlPattern = /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]*)*\/?$/;
      if (!urlPattern.test(data.website)) {
        throw new AppError('Invalid website URL');
      }
    }
    
    if (data.gender && !['male', 'female', 'other', 'prefer_not_to_say'].includes(data.gender)) {
      throw new AppError('Invalid gender value');
    }
    
    const profile = await FirestoreProfileRepository.update(userId, data);
    
    if (!profile) {
      throw new AppError(Messages.PROFILE_NOT_FOUND);
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
    const profile = await FirestoreProfileRepository.updateAvatar(userId, avatarUrl, avatarKey);
    
    return {
      message: 'Avatar updated successfully',
      avatarUrl: profile?.avatarUrl ?? undefined,
    };
  }
  
  async removeAvatar(userId: number) {
    await FirestoreProfileRepository.update(userId, {
      avatarUrl: undefined,
      avatarKey: undefined,
    });
    
    return {
      message: 'Avatar removed successfully',
    };
  }
  
  async updateSettings(userId: number, data: UpdateSettingsDTO) {
    const profile = await FirestoreProfileRepository.update(userId, data);
    
    if (!profile) {
      throw new AppError(Messages.PROFILE_NOT_FOUND);
    }
    
    return {
      message: 'Settings updated successfully',
      settings: {
        emailNotifications: profile.emailNotifications,
        pushNotifications: profile.pushNotifications,
      },
    };
  }
  
  async changeEmail(userId: number, newEmail: string, password: string, otp?: string) {
    const user = await FirestoreUserRepository.findById(userId);
    if (!user) {
      throw new AppError(Messages.USER_NOT_FOUND, 404);
    }
    
    const isValidPassword = await this.comparePassword(password, user.password);
    if (!isValidPassword) {
      throw new AppError('Invalid password', 400);
    }
    
    if (user.email === newEmail) {
      throw new AppError('New email cannot be same as current email', 400);
    }
    
    const existingUser = await FirestoreUserRepository.findByEmail(newEmail);
    if (existingUser && existingUser.id !== userId) {
      throw new AppError(Messages.EMAIL_EXISTS, 409);
    }
    
    const OTPService = (await import('../../services/otp.service')).default;

    if (otp) {
      const isValidOTP = await OTPService.verifyOTP(userId, otp, OTPType.EMAIL_VERIFICATION);
      if (!isValidOTP) {
        throw new AppError(Messages.INVALID_OTP, 400);
      }

      await FirestoreUserRepository.update(userId, { email: newEmail });
      return { message: 'Email changed successfully', otpSent: false };
    }

    await OTPService.generateAndSendOTP(userId, newEmail, OTPType.EMAIL_VERIFICATION);
    return {
      message: 'OTP sent to new email. Please verify to complete email change.',
      otpSent: true,
    };
  }
  
  async changePhone(userId: number, newPhone: string, password: string, otp?: string) {
    const user = await FirestoreUserRepository.findById(userId);
    if (!user) {
      throw new AppError(Messages.USER_NOT_FOUND, 404);
    }
    
    const isValidPassword = await this.comparePassword(password, user.password);
    if (!isValidPassword) {
      throw new AppError('Invalid password', 400);
    }
    
    if (user.phone === newPhone) {
      throw new AppError('New phone cannot be same as current phone', 400);
    }
    
    const existingUser = await FirestoreUserRepository.findByPhone(newPhone);
    if (existingUser && existingUser.id !== userId) {
      throw new AppError(Messages.PHONE_EXISTS, 409);
    }
    
    const OTPService = (await import('../../services/otp.service')).default;

    if (otp) {
      const isValidOTP = await OTPService.verifyOTP(userId, otp, OTPType.PHONE_VERIFICATION);
      if (!isValidOTP) {
        throw new AppError(Messages.INVALID_OTP, 400);
      }

      await FirestoreUserRepository.update(userId, { phone: newPhone });
      return { message: 'Phone number changed successfully', otpSent: false };
    }

    return {
      message: 'OTP sent to new phone. Please verify to complete phone change.',
      otpSent: true,
    };
  }
  
  async deleteAccount(userId: number, password: string): Promise<{ message: string }> {
    const user = await FirestoreUserRepository.findById(userId);
    if (!user) {
      throw new AppError(Messages.USER_NOT_FOUND, 404);
    }
    
    const isValidPassword = await this.comparePassword(password, user.password);
    if (!isValidPassword) {
      throw new AppError('Invalid password', 400);
    }
    
    if (user.deletedAt) {
      throw new AppError('Account is not deleted', 400);
    }
    
    await FirestoreUserRepository.softDelete(userId);
    
    await FirestoreTokenRepository.revokeAllUserTokens(userId);
    await FirestoreTokenRepository.revokeAllUserSessions(userId);
    
    return { message: Messages.DELETED };
  }
  
  async restoreAccount(userId: number): Promise<{ message: string }> {
    const user = await FirestoreUserRepository.findById(userId, true);
    
    if (!user) {
      return new AppError(Messages.USER_NOT_FOUND);
    }
    
    if (!user.deletedAt) {
      return new AppError('Account is not deleted');
    }
    
    await FirestoreUserRepository.update(userId, { deletedAt: null });
    
    return { message: 'Account restored successfully' };
  }
  
  async getPublicProfile(username: string, currentUserId?: number) {
    const profile = await FirestoreProfileRepository.getProfileWithFollowers(username, currentUserId);
    
    if (!profile) {
      return new AppError(Messages.PROFILE_NOT_FOUND, 404);
    }
    
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
      id: profile.userId,
      username: profile.username,
      fullName: profile.fullName,
      bio: profile.bio,
      avatarUrl: profile.avatarUrl,
      website: profile.website,
      isPrivate: profile.isPrivate,
      isFollowedByCurrentUser: profile.isFollowedByCurrentUser,
      stats: {
        postsCount: profile.user?._count?.posts ?? 0,
        followersCount: profile.user?._count?.followers ?? 0,
        followingCount: profile.user?._count?.following ?? 0,
      },
      joinedDate: profile.user?.createdAt,
    };
  }

  async getUserStats(userId: number) {
    const user = await FirestoreUserRepository.getUserWithStats(userId);
    
    if (!user) {
      throw new AppError(Messages.USER_NOT_FOUND, 404);
    }
    
    return {
      postsCount: user._count?.posts || 0,
      followersCount: user._count?.followers || 0,
      followingCount: user._count?.following || 0,
    };
  }
}

export default FirestoreUserService.getInstance();
