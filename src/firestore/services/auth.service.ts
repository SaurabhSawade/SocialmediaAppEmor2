import bcrypt from "bcryptjs";
import FirestoreUserRepository from "../repositories/user.repository";
import FirestoreTokenRepository from "../repositories/token.repository";
import FirestoreProfileRepository from "../repositories/profile.repository";
import OTPService from "../../services/otp.service";
import TokenService from "../../services/token.service";
import EmailService from "../../services/email.service";
import logger from "../../config/logger";
import { OTPType, TokenType } from "../../constants/enums";
import { Messages } from "../../constants/messages";
import { RegisterDTO, LoginDTO, AuthResponseDTO } from "../../types/dto/auth.dto";
import { Helpers } from "../../utils/helpers";
import { AppError } from "../../utils/app-error";

export class FirestoreAuthService {
  private static instance: FirestoreAuthService;
  private saltRounds = 10; // i will put it in env later

  private constructor() {}

  static getInstance(): FirestoreAuthService {
    if (!FirestoreAuthService.instance) {
      FirestoreAuthService.instance = new FirestoreAuthService();
    }
    return FirestoreAuthService.instance;
  }

  private async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, this.saltRounds);
  }

  private async comparePassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  async register(data: RegisterDTO): Promise<AuthResponseDTO> {
    logger.info(`📝 Registration attempt for username: ${data.username}, email: ${data.email}`);

    if (data.email) {
      const existingUser = await FirestoreUserRepository.findByEmail(data.email);
      if (existingUser) {
        logger.warn(`⚠️ Registration failed: Email already exists - ${data.email}`);
        throw new AppError(Messages.EMAIL_EXISTS);
      }
    }

    if (data.phone) {
      const existingUser = await FirestoreUserRepository.findByPhone(data.phone);
      if (existingUser) {
        logger.warn(`⚠️ Registration failed: Phone already exists - ${data.phone}`);
        throw new AppError(Messages.PHONE_EXISTS);
      }
    }

    const isUsernameAvailable = await FirestoreProfileRepository.checkUsernameAvailability(data.username);
    if (!isUsernameAvailable) {
      logger.warn(`⚠️ Registration failed: Username already taken - ${data.username}`);
      throw new AppError(Messages.USERNAME_EXISTS);
    }

    logger.debug(`🔄 Creating user account for ${data.username}`);
    const hashedPassword = await this.hashPassword(data.password);
    const user = await FirestoreUserRepository.create({
      email: data.email,
      phone: data.phone,
      password: hashedPassword,
      profile: {
        username: data.username,
        fullName: data.fullName,
      },
    });

    await FirestoreProfileRepository.create(user.id, {
      username: data.username,
      fullName: data.fullName,
    });

    logger.info(`✅ User created successfully: ID ${user.id}, username ${data.username}`);

    if (user.email) {
      logger.debug(`📧 Sending verification OTP to ${user.email}`);
      await OTPService.generateAndSendOTP(user.id, user.email, OTPType.EMAIL_VERIFICATION);
    }

    const tokens = TokenService.generateTokens(user.id, user.email, user.phone, user.role);

    return { tokens };
  }

  async login(data: LoginDTO): Promise<AuthResponseDTO> {
    logger.info(`🔐 Login attempt for: ${data.identifier}`);

    const user = await FirestoreUserRepository.findByEmailOrPhone(data.identifier);

    if (!user) {
      logger.warn(`⚠️ Login failed: User not found for ${data.identifier}`);
      throw new AppError(Messages.INVALID_CREDENTIALS);
    }

    if (!user.isVerified) {
      logger.warn(`⚠️ Login failed: Email not verified for user ${user.id}`);
      throw new AppError(Messages.EMAIL_NOT_VERIFIED);
    }

    const isValidPassword = await this.comparePassword(data.password, user.password);
    if (!isValidPassword) {
      logger.warn(`⚠️ Login failed: Invalid password for ${data.identifier}`);
      throw new AppError(Messages.INVALID_CREDENTIALS);
    }

    logger.info(`✅ User ${user.id} authenticated successfully`);

    const tokens = TokenService.generateTokens(user.id, user.email, user.phone, user.role);

    const refreshExpiry = new Date();
    refreshExpiry.setDate(refreshExpiry.getDate() + 30);

    await FirestoreTokenRepository.saveToken(
      user.id,
      tokens.refreshToken,
      TokenType.REFRESH,
      refreshExpiry
    );

    await FirestoreTokenRepository.createSession(
      user.id,
      tokens.refreshToken,
      undefined,
      undefined,
      undefined
    );

    return { tokens };
  }

  async resendOTP(identifier: string): Promise<{ message: string }> {
    const user = await FirestoreUserRepository.findByEmailOrPhone(identifier);

    if (!user) {
      throw new AppError(Messages.NOT_FOUND, 404);
    }

    if (user.isVerified) {
      throw new AppError(Messages.ACCOUNT_ALREADY_VERIFIED);
    }

    if (!user.email) {
      throw new AppError(Messages.NO_EMAIL_ASSOCIATED);
    }

    await OTPService.generateAndSendOTP(user.id, user.email, OTPType.EMAIL_VERIFICATION);

    return { message: Messages.OTP_SENT };
  }

  async verifyOTP(identifier: string, otp: string): Promise<{ message: string; tokens: any }> {
    const user = await FirestoreUserRepository.findByEmailOrPhone(identifier);

    if (!user) {
      throw new AppError(Messages.NOT_FOUND);
    }

    const isValid = await OTPService.verifyOTP(user.id, otp, OTPType.EMAIL_VERIFICATION);
    if (!isValid) {
      throw new AppError(Messages.INVALID_OTP);
    }

    await FirestoreUserRepository.verifyUser(user.id);

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
    const payload = TokenService.verifyRefreshToken(refreshToken);
    if (!payload) {
      throw new AppError(Messages.INVALID_TOKEN);
    }

    let revokedCount = 0;

    if (accessToken) {
      try {
        const accessPayload = TokenService.verifyAccessToken(accessToken);
        if (accessPayload) {
          await FirestoreTokenRepository.revokeAccessToken(
            accessPayload.userId,
            accessToken,
            new Date(accessPayload.exp * 1000),
          );
          revokedCount++;
          logger.info(`Access token revoked for user ${accessPayload.userId}`);
        }
      } catch (error) {
        logger.error("Failed to revoke access token:", error);
      }
    }

    if (logoutAll) {
      const tokenResult = await FirestoreTokenRepository.revokeAllUserTokens(payload.userId, refreshToken);
      await FirestoreTokenRepository.revokeAllUserSessions(payload.userId, refreshToken);
      revokedCount += tokenResult.count;

      return {
        message: 'Logged out from all devices successfully',
        revokedTokens: revokedCount,
      };
    }

    await FirestoreTokenRepository.revokeToken(refreshToken);
    await FirestoreTokenRepository.revokeSession(refreshToken);

    return {
      message: Messages.LOGOUT_SUCCESS,
      revokedTokens: revokedCount > 0 ? revokedCount : 1,
    };
  }

  async forgotPassword(identifier: string): Promise<{ message: string }> {
    const user = await FirestoreUserRepository.findByEmailOrPhone(identifier);

    if (!user) {
      throw new AppError(Messages.USER_NOT_FOUND, 404);
    }

    if (!user.email) {
      throw new AppError(Messages.NO_EMAIL_ASSOCIATED);
    }

    await OTPService.generateAndSendOTP(user.id, user.email, OTPType.PASSWORD_RESET);

    return { message: Messages.PASSWORD_RESET_SENT };
  }

  async resetPassword(
    identifier: string,
    otp: string,
    newPassword: string,
  ): Promise<{ message: string }> {
    if (!Helpers.isValidPassword(newPassword)) {
      throw new AppError(Messages.WEAK_PASSWORD, 400);
    }

    const user = await FirestoreUserRepository.findByEmailOrPhone(identifier);

    if (!user) {
      throw new AppError(Messages.NOT_FOUND, 404);
    }

    const isValid = await OTPService.verifyOTP(user.id, otp, OTPType.PASSWORD_RESET);
    if (!isValid) {
      throw new AppError(Messages.INVALID_OTP, 400);
    }

    const hashedPassword = await this.hashPassword(newPassword);
    await FirestoreUserRepository.updatePassword(user.id, hashedPassword);

    return { message: Messages.PASSWORD_RESET_SUCCESS };
  }

  async changePassword(
    userId: number,
    currentPassword: string,
    newPassword: string,
  ): Promise<{ message: string }> {
    if (!Helpers.isValidPassword(newPassword)) {
      throw new AppError(Messages.WEAK_PASSWORD, 400);
    }

    const user = await FirestoreUserRepository.findById(userId);

    if (!user) {
      throw new AppError(Messages.NOT_FOUND, 404);
    }

    const isValidPassword = await this.comparePassword(currentPassword, user.password);
    if (!isValidPassword) {
      throw new AppError(Messages.CURRENT_PASSWORD_INCORRECT);
    }

    const hashedPassword = await this.hashPassword(newPassword);
    await FirestoreUserRepository.updatePassword(user.id, hashedPassword);

    return { message: Messages.PASSWORD_CHANGED };
  }

  async refreshToken(refreshToken: string, reqInfo?: { ip?: string; userAgent?: string }): Promise<{ tokens: any }> {
    const payload = TokenService.verifyRefreshToken(refreshToken);
    if (!payload) {
      throw new AppError(Messages.INVALID_TOKEN);
    }

    const validToken = await FirestoreTokenRepository.findValidToken(refreshToken, TokenType.REFRESH);
    if (!validToken) {
      throw new AppError(Messages.INVALID_TOKEN);
    }

    const session = await FirestoreTokenRepository.findSession(refreshToken);
    if (!session) {
      throw new AppError(Messages.INVALID_TOKEN);
    }

    const user = await FirestoreUserRepository.findById(payload.userId);
    if (!user || user.deletedAt) {
      throw new AppError(Messages.USER_NOT_FOUND);
    }

    await FirestoreTokenRepository.revokeToken(refreshToken);

    const tokens = TokenService.generateTokens(user.id, user.email, user.phone);

    const refreshExpiry = new Date();
    refreshExpiry.setDate(refreshExpiry.getDate() + 30);

    await FirestoreTokenRepository.saveToken(
      user.id,
      tokens.refreshToken,
      TokenType.REFRESH,
      refreshExpiry
    );

    await FirestoreTokenRepository.revokeSession(refreshToken);
    await FirestoreTokenRepository.createSession(
      user.id,
      tokens.refreshToken,
      reqInfo?.userAgent,
      reqInfo?.ip,
      reqInfo?.userAgent
    );

    return { tokens };
  }

  async getSessions(userId: number, currentToken: string): Promise<any[]> {
    const sessions = await FirestoreTokenRepository.getUserSessions(userId);

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
    const session = await FirestoreTokenRepository.findSession(currentToken);

    if (!session) {
      throw new AppError('Session not found', 404);
    }

    if (session.id === sessionId) {
      throw new AppError('Cannot revoke current session. Use logout instead.', 400);
    }

    const sessionToRevoke = await FirestoreTokenRepository.findSessionById(sessionId, userId);

    if (!sessionToRevoke) {
      throw new AppError('Session not found', 404);
    }

    await FirestoreTokenRepository.revokeToken(sessionToRevoke.token);
    await FirestoreTokenRepository.revokeSession(sessionToRevoke.token);

    return { message: 'Session revoked successfully' };
  }

  async getCurrentUser(userId: number): Promise<any> {
    const user = await FirestoreUserRepository.getUserWithStats(userId);

    if (!user) {
      throw new AppError(Messages.NOT_FOUND, 404);
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
    if (!Helpers.isValidEmail(newEmail)) {
      throw new AppError("Invalid email format", 400);
    }

    const user = await FirestoreUserRepository.findById(userId);
    if (!user) {
      throw new AppError(Messages.NOT_FOUND, 404);
    }

    const isValidPassword = await this.comparePassword(currentPassword, user.password);
    if (!isValidPassword) {
      throw new AppError(Messages.CURRENT_PASSWORD_INCORRECT);
    }

    if (user.email === newEmail) {
      throw new AppError(Messages.NEW_EMAIL_SAME_AS_CURRENT);
    }

    const existingUser = await FirestoreUserRepository.findByEmail(newEmail);
    if (existingUser) {
      throw new AppError(Messages.EMAIL_EXISTS, 409);
    }

    await FirestoreUserRepository.updateEmail(userId, newEmail);

    try {
      await EmailService.sendEmail(
        newEmail,
        "Email Changed",
        `Your email has been successfully changed to ${newEmail}`,
      );
      logger.info(`Confirmation email sent to ${newEmail}`);
    } catch (error) {
      const err = error as Error;
      logger.error("Failed to send email change notification:", {
        error: err.message,
        newEmail,
        stack: err.stack,
      });
    }

    return { message: "Email changed successfully" };
  }
}

export default FirestoreAuthService.getInstance();
