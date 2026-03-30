import bcrypt from "bcryptjs";
import UserRepository from "../repositories/user.repository";
import OTPService from "./otp.service";
import TokenService from "./token.service";
import { OTPType } from "../constants/enums";
import { Messages } from "../constants/messages";
import { RegisterDTO, LoginDTO, AuthResponseDTO } from "../types/dto/auth.dto";
import { Helpers } from "../utils/helpers";
import logger from "../config/logger";

export class AuthService {
  private static instance: AuthService;
  private saltRounds = 10;

  private constructor() {}

  static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  private async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, this.saltRounds);
  }

  private async comparePassword(
    password: string,
    hash: string,
  ): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  async register(data: RegisterDTO): Promise<AuthResponseDTO> {
    // Validate input
    // if (!data.email && !data.phone) {
    //   throw new Error("Either email or phone is required");
    // }

    if (!Helpers.isValidUsername(data.username)) {
      throw new Error("Invalid username format");
    }

    if (!Helpers.isValidPassword(data.password)) {
      throw new Error(Messages.WEAK_PASSWORD);
    }

    // Check existing user
    if (data.email) {
      const existingUser = await UserRepository.findByEmail(data.email);
      if (existingUser) throw new Error(Messages.EMAIL_EXISTS);
    }

    if (data.phone) {
      const existingUser = await UserRepository.findByPhone(data.phone);
      if (existingUser) throw new Error(Messages.PHONE_EXISTS);
    }

    // Check username availability
    const ProfileRepository = (
      await import("../repositories/profile.repository")
    ).default;
    const isUsernameAvailable =
      await ProfileRepository.checkUsernameAvailability(data.username);
    if (!isUsernameAvailable) throw new Error(Messages.USERNAME_EXISTS);

    // Create user
    const hashedPassword = await this.hashPassword(data.password);
    const user = await UserRepository.create({
      email: data.email,
      phone: data.phone,
      password: hashedPassword,
      profile: {
        username: data.username,
        fullName: data.fullName,
      },
    });

    // Send OTP for verification if email exists
    if (user.email) {
      await OTPService.generateAndSendOTP(
        user.id,
        user.email,
        OTPType.EMAIL_VERIFICATION,
      );
    }

    // Generate tokens
    const tokens = TokenService.generateTokens(user.id, user.email, user.phone);

    return {
      user: {
        id: user.id,
        email: user.email,
        phone: user.phone,
        username: user.profile!.username,
        fullName: user.profile!.fullName,
        avatarUrl: user.profile!.avatarUrl,
        isVerified: user.isVerified,
      },
      tokens,
    };
  }

  async login(data: LoginDTO): Promise<AuthResponseDTO> {
    const user = await UserRepository.findByEmailOrPhone(data.identifier);

    if (!user) {
      throw new Error(Messages.INVALID_CREDENTIALS);
    }

    // if (user.deletedAt) {
    //   throw new Error(Messages.ACCOUNT_DELETED);
    // }

    if (!user.isVerified) {
      throw new Error(Messages.EMAIL_NOT_VERIFIED);
    }

    const isValidPassword = await this.comparePassword(
      data.password,
      user.password,
    );
    if (!isValidPassword) {
      throw new Error(Messages.INVALID_CREDENTIALS);
    }

    const tokens = TokenService.generateTokens(user.id, user.email, user.phone);

    return {
      user: {
        id: user.id,
        email: user.email,
        phone: user.phone,
        username: user.profile!.username,
        fullName: user.profile!.fullName,
        avatarUrl: user.profile!.avatarUrl,
        isVerified: user.isVerified,
      },
      tokens,
    };
  }

  async resendOTP(identifier: string): Promise<{ message: string }> {
    const user = await UserRepository.findByEmailOrPhone(identifier);

    if (!user) {
      throw new Error(Messages.NOT_FOUND);
    }

    if (user.isVerified) {
      throw new Error("Account already verified");
    }

    if (!user.email) {
      throw new Error("No email associated with this account");
    }

    await OTPService.generateAndSendOTP(
      user.id,
      user.email,
      OTPType.EMAIL_VERIFICATION,
    );

    return { message: Messages.OTP_SENT };
  }

  async verifyOTP(
    identifier: string,
    otp: string,
  ): Promise<{ message: string; tokens: any }> {
    const user = await UserRepository.findByEmailOrPhone(identifier);

    if (!user) {
      throw new Error(Messages.NOT_FOUND);
    }

    const isValid = await OTPService.verifyOTP(
      user.id,
      otp,
      OTPType.EMAIL_VERIFICATION,
    );
    if (!isValid) {
      throw new Error(Messages.INVALID_OTP);
    }

    // Verify user
    await UserRepository.verifyUser(user.id);

    // Generate tokens
    const tokens = TokenService.generateTokens(user.id, user.email, user.phone);

    return {
      message: Messages.EMAIL_VERIFIED,
      tokens,
    };
  }

  async forgotPassword(identifier: string): Promise<{ message: string }> {
    const user = await UserRepository.findByEmailOrPhone(identifier);

    if (!user) {
      throw new Error(Messages.NOT_FOUND);
    }

    if (!user.email) {
      throw new Error("No email associated with this account");
    }

    await OTPService.generateAndSendOTP(
      user.id,
      user.email,
      OTPType.PASSWORD_RESET,
    );

    return { message: Messages.PASSWORD_RESET_SENT };
  }

  async resetPassword(
    identifier: string,
    otp: string,
    newPassword: string,
  ): Promise<{ message: string }> {
    if (!Helpers.isValidPassword(newPassword)) {
      throw new Error(Messages.WEAK_PASSWORD);
    }

    const user = await UserRepository.findByEmailOrPhone(identifier);

    if (!user) {
      throw new Error(Messages.NOT_FOUND);
    }

    const isValid = await OTPService.verifyOTP(
      user.id,
      otp,
      OTPType.PASSWORD_RESET,
    );
    if (!isValid) {
      throw new Error(Messages.INVALID_OTP);
    }

    const hashedPassword = await this.hashPassword(newPassword);
    await UserRepository.updatePassword(user.id, hashedPassword);

    return { message: Messages.PASSWORD_RESET_SUCCESS };
  }

  async changePassword(
    userId: number,
    currentPassword: string,
    newPassword: string,
  ): Promise<{ message: string }> {
    if (!Helpers.isValidPassword(newPassword)) {
      throw new Error(Messages.WEAK_PASSWORD);
    }

    const user = await UserRepository.findById(userId);

    if (!user) {
      throw new Error(Messages.NOT_FOUND);
    }

    const isValidPassword = await this.comparePassword(
      currentPassword,
      user.password,
    );
    if (!isValidPassword) {
      throw new Error("Current password is incorrect");
    }

    const hashedPassword = await this.hashPassword(newPassword);
    await UserRepository.updatePassword(user.id, hashedPassword);

    return { message: Messages.PASSWORD_CHANGED };
  }

  async refreshToken(refreshToken: string): Promise<{ tokens: any }> {
    const payload = TokenService.verifyRefreshToken(refreshToken);
    if (!payload) {
      throw new Error(Messages.INVALID_TOKEN);
    }

    const user = await UserRepository.findById(payload.userId);
    if (!user) {
      throw new Error(Messages.NOT_FOUND);
    }

    const tokens = TokenService.generateTokens(user.id, user.email, user.phone);

    return { tokens };
  }

  async logout(userId: number): Promise<void> {
    // Optional: Add token to blacklist in Redis
    logger.info(`User ${userId} logged out`);
  }

  async getCurrentUser(userId: number): Promise<any> {
    const user = await UserRepository.getUserWithStats(userId);

    if (!user) {
      throw new Error(Messages.NOT_FOUND);
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
    };
  }
}

export default AuthService.getInstance();
