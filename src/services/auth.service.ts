import bcrypt from "bcryptjs";
import UserRepository from "../repositories/user.repository";
import TokenRepository from '../repositories/token.repository';
import OTPService from "./otp.service";
import TokenService from "./token.service";
import EmailService from "./email.service";
import logger from "../config/logger";
import { OTPType, TokenType } from "../constants/enums";
import { Messages } from "../constants/messages";
import { RegisterDTO, LoginDTO, AuthResponseDTO } from "../types/dto/auth.dto";
import { Helpers } from "../utils/helpers";
import prisma from "../prisma/client";

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
      // user: {
      //   id: user.id,
      //   email: user.email,
      //   phone: user.phone,
      //   username: user.profile!.username,
      //   fullName: user.profile!.fullName,
      //   avatarUrl: user.profile!.avatarUrl,
      //   isVerified: user.isVerified,
      // },
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

    // Save refresh token to database
    const refreshExpiry = new Date();
    refreshExpiry.setDate(refreshExpiry.getDate() + 30);
    
    await TokenRepository.saveToken(
      user.id,
      tokens.refreshToken,
      TokenType.REFRESH,
      refreshExpiry
    );
    
    // Create session
    await TokenRepository.createSession(
      user.id,
      tokens.refreshToken,
      undefined,
      undefined,
      undefined
    );

    return {
      // user: {
      //   id: user.id,
      //   email: user.email,
      //   phone: user.phone,
      //   username: user.profile!.username,
      //   fullName: user.profile!.fullName,
      //   avatarUrl: user.profile!.avatarUrl,
      //   isVerified: user.isVerified,
      // },
      tokens,
    };
  }

  async resendOTP(identifier: string): Promise<{ message: string } | boolean> {
    try {
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
    } catch (error) {
      console.log("Error in resendOTP:", error);
      console.log("Error message:", (error as Error).message);
      return false;
    }
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

    async logout(
    refreshToken: string,
    logoutAll: boolean = false,
    accessToken?: string,
  ): Promise<{ message: string; revokedTokens: number }> {
    // Verify refresh token
    const payload = TokenService.verifyRefreshToken(refreshToken);
    if (!payload) {
      throw new Error(Messages.INVALID_TOKEN);
    }
    
    let revokedCount = 0;

    // Revoke access token if provided
    if (accessToken) {
      try {
        const accessPayload = TokenService.verifyAccessToken(accessToken);
        if (accessPayload) {
          await TokenRepository.revokeAccessToken(
            accessPayload.userId,
            accessToken,
            new Date(accessPayload.exp * 1000),
          );
          revokedCount++;
          console.log(`Access token revoked for user ${accessPayload.userId}`);
        }
      } catch (error) {
        logger.error("Failed to revoke access token:", error);
        // Continue with logout even if access token revocation fails
      }
    }
    
    if (logoutAll) {
      // Revoke all user tokens and sessions
      const tokenResult = await TokenRepository.revokeAllUserTokens(payload.userId, refreshToken);
      await TokenRepository.revokeAllUserSessions(payload.userId, refreshToken);
      revokedCount += tokenResult.count;
      
      console.log(`All sessions revoked for user ${payload.userId}`);
      
      return {
        message: 'Logged out from all devices successfully',
        revokedTokens: revokedCount,
      };
    } else {
      // Revoke only current session
      await TokenRepository.revokeToken(refreshToken);
      await TokenRepository.revokeSession(refreshToken);
      
      console.log(`Current session revoked for user ${payload.userId}`);
      
      return {
        message: Messages.LOGOUT_SUCCESS,
        revokedTokens: revokedCount > 0 ? revokedCount : 1,
      };
    }
  }
  


  async forgotPassword(identifier: string): Promise<{ message: string }> {
    const user = await UserRepository.findByEmailOrPhone(identifier);

    if (!user) {
      throw new Error(Messages.USER_NOT_FOUND);
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
      // console.log("User not found for identifier:", identifier);
      throw new Error(Messages.NOT_FOUND);
    }

    const isValid = await OTPService.verifyOTP(
      user.id,
      otp,
      OTPType.PASSWORD_RESET,
    );
    if (!isValid) {
      // console.log("Invalid OTP for user ID:", user.id);
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

  async refreshToken(refreshToken: string, reqInfo?: { ip?: string; userAgent?: string }): Promise<{ tokens: any }> {
    // Verify refresh token
    const payload = TokenService.verifyRefreshToken(refreshToken);
    if (!payload) {
      throw new Error(Messages.INVALID_TOKEN);
    }
    
    // Check if token exists in database and is not revoked
    const validToken = await TokenRepository.findValidToken(refreshToken, TokenType.REFRESH);
    if (!validToken) {
      throw new Error(Messages.INVALID_TOKEN);
    }
    
    // Check session
    const session = await TokenRepository.findSession(refreshToken);
    if (!session) {
      throw new Error(Messages.INVALID_TOKEN);
    }
    
    // Get user
    const user = await UserRepository.findById(payload.userId);
    if (!user || user.deletedAt) {
      throw new Error(Messages.USER_NOT_FOUND);
    }
    
    // Revoke old token
    await TokenRepository.revokeToken(refreshToken);
    
    // Generate new tokens
    const tokens = TokenService.generateTokens(user.id, user.email, user.phone);
    
    // Save new refresh token
    const refreshExpiry = new Date();
    refreshExpiry.setDate(refreshExpiry.getDate() + 30);
    
    await TokenRepository.saveToken(
      user.id,
      tokens.refreshToken,
      TokenType.REFRESH,
      refreshExpiry
    );
    
    // Update session with new token
    await TokenRepository.revokeSession(refreshToken);
    await TokenRepository.createSession(
      user.id,
      tokens.refreshToken,
      reqInfo?.userAgent,
      reqInfo?.ip,
      reqInfo?.userAgent
    );
    
    return { tokens };
  }

    async getSessions(userId: number, currentToken: string): Promise<any[]> {
    const sessions = await TokenRepository.getUserSessions(userId);
    
    return sessions.map((session: any) => ({
      id: session.id,
      deviceInfo: session.deviceInfo,
      ipAddress: session.ipAddress,
      lastActivity: session.lastActivity,
      createdAt: session.createdAt,
      isCurrent: session.token === currentToken,
    }));
  }
  
    async revokeSession(userId: number, sessionId: string, currentToken: string): Promise<{ message: string }> {
    const session = await TokenRepository.findSession(currentToken);
    
    if (!session) {
      throw new Error('Session not found');
    }
    
    // Don't allow revoking current session
    if (session.id === sessionId) {
      throw new Error('Cannot revoke current session. Use logout instead.');
    }
    
    // Get session to revoke
    const sessionToRevoke = await prisma.session.findUnique({
      where: { id: sessionId, userId },
    });
    
    if (!sessionToRevoke) {
      throw new Error('Session not found');
    }
    
    await TokenRepository.revokeToken(sessionToRevoke.token);
    await TokenRepository.revokeSession(sessionToRevoke.token);
    
    return { message: 'Session revoked successfully' };
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

  async changeEmail(
    userId: number,
    currentPassword: string,
    newEmail: string,
  ): Promise<{ message: string }> {
    // Validate new email format
    if (!Helpers.isValidEmail(newEmail)) {
      throw new Error("Invalid email format");
    }

    // Get user
    const user = await UserRepository.findById(userId);
    if (!user) {
      throw new Error(Messages.NOT_FOUND);
    }

    // Verify current password
    const isValidPassword = await this.comparePassword(
      currentPassword,
      user.password,
    );
    if (!isValidPassword) {
      throw new Error("Current password is incorrect");
    }

    // Check if new email is different from current
    if (user.email === newEmail) {
      throw new Error("New email is the same as current email");
    }

    // Check if new email is already taken
    const existingUser = await UserRepository.findByEmail(newEmail);
    if (existingUser) {
      throw new Error(Messages.EMAIL_EXISTS);
    }

    // Update email
    await UserRepository.updateEmail(userId, newEmail);

    // Send confirmation email
    try {
      await EmailService.sendEmail(
        newEmail,
        "Email Changed",
        `Your email has been successfully changed to ${newEmail}`,
      );
      console.log(`Confirmation email sent to ${newEmail}`);
    } catch (error) {
      const err = error as Error;
      console.error(`Failed to send email notification to ${newEmail}:`, err.message);
      logger.error("Failed to send email change notification:", {
        error: err.message,
        newEmail,
        stack: err.stack,
      });
      // Don't fail the operation - email change is already successful
    }

    return { message: "Email changed successfully" };
  }
}


export default AuthService.getInstance();
