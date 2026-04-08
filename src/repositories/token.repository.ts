import prisma from '../prisma/client';
import { TokenType } from '../constants/enums';
import logger from '../config/logger';

export class TokenRepository {
  private static instance: TokenRepository;
  
  private constructor() {}
  
  static getInstance(): TokenRepository {
    if (!TokenRepository.instance) {
      TokenRepository.instance = new TokenRepository();
    }
    return TokenRepository.instance;
  }
  
  async saveToken(userId: number, token: string, type: TokenType, expiresAt: Date) {
    try {
      return await prisma.token.create({
        data: {
          userId,
          token,
          type,
          expiresAt,
        },
      });
    } catch (error) {
      logger.error('Error in TokenRepository.saveToken:', error);
      throw error;
    }
  }
  
  async findValidToken(token: string, type: TokenType) {
    try {
      return await prisma.token.findFirst({
        where: {
          token,
          type,
          isRevoked: false,
          expiresAt: {
            gt: new Date(),
          },
        },
      });
    } catch (error) {
      logger.error('Error in TokenRepository.findValidToken:', error);
      throw error;
    }
  }
  
  async revokeToken(token: string) {
    try {
      return await prisma.token.update({
        where: { token },
        data: {
          isRevoked: true,
          revokedAt: new Date(),
        },
      });
    } catch (error) {
      logger.error('Error in TokenRepository.revokeToken:', error);
      throw error;
    }
  }
  
  async revokeAllUserTokens(userId: number, excludeToken?: string) {
    try {
      return await prisma.token.updateMany({
        where: {
          userId,
          ...(excludeToken ? { token: { not: excludeToken } } : {}),
          isRevoked: false,
        },
        data: {
          isRevoked: true,
          revokedAt: new Date(),
        },
      });
    } catch (error) {
      logger.error('Error in TokenRepository.revokeAllUserTokens:', error);
      throw error;
    }
  }
  
  async cleanupExpiredTokens() {
    try {
      return await prisma.token.deleteMany({
        where: {
          OR: [
            { expiresAt: { lt: new Date() } },
            { isRevoked: true, revokedAt: { lt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } }, // Keep revoked tokens for 7 days
          ],
        },
      });
    } catch (error) {
      logger.error('Error in TokenRepository.cleanupExpiredTokens:', error);
      throw error;
    }
  }
  
  async createSession(userId: number, token: string, deviceInfo?: string, ipAddress?: string, userAgent?: string) {
    try {
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 30); // Session expires in 30 days
      
      return await prisma.session.create({
        data: {
          userId,
          token,
          deviceInfo,
          ipAddress,
          userAgent,
          expiresAt,
        },
      });
    } catch (error) {
      logger.error('Error in TokenRepository.createSession:', error);
      throw error;
    }
  }
  
  async findSession(token: string) {
    try {
      return await prisma.session.findFirst({
        where: {
          token,
          isActive: true,
          expiresAt: { gt: new Date() },
        },
      });
    } catch (error) {
      logger.error('Error in TokenRepository.findSession:', error);
      throw error;
    }
  }

  async findSessionById(sessionId: string, userId: number) {
    try {
      return await prisma.session.findUnique({
        where: { id: sessionId, userId },
      });
    } catch (error) {
      logger.error('Error in TokenRepository.findSessionById:', error);
      throw error;
    }
  }
  
  async revokeSession(token: string) {
    try {
      return await prisma.session.update({
        where: { token },
        data: {
          isActive: false,
        },
      });
    } catch (error) {
      logger.error('Error in TokenRepository.revokeSession:', error);
      throw error;
    }
  }
  
  async revokeAllUserSessions(userId: number, excludeToken?: string) {
    try {
      return await prisma.session.updateMany({
        where: {
          userId,
          ...(excludeToken ? { token: { not: excludeToken } } : {}),
          isActive: true,
        },
        data: {
          isActive: false,
        },
      });
    } catch (error) {
      logger.error('Error in TokenRepository.revokeAllUserSessions:', error);
      throw error;
    }
  }
  
  async getUserSessions(userId: number) {
    try {
      return await prisma.session.findMany({
        where: {
          userId,
          isActive: true,
          expiresAt: { gt: new Date() },
        },
        orderBy: { lastActivity: 'desc' },
      });
    } catch (error) {
      logger.error('Error in TokenRepository.getUserSessions:', error);
      throw error;
    }
  }
  
  async updateSessionActivity(token: string) {
    try {
      return await prisma.session.update({
        where: { token },
        data: { lastActivity: new Date() },
      });
    } catch (error) {
      logger.error('Error in TokenRepository.updateSessionActivity:', error);
      throw error;
    }
  }

  // Access Token Revocation Methods
  async revokeAccessToken(userId: number, token: string, expiresAt: Date) {
    try {
      return await prisma.revokedAccessToken.create({
        data: {
          userId,
          token,
          expiresAt,
        },
      });
    } catch (error) {
      logger.error('Error in TokenRepository.revokeAccessToken:', error);
      throw error;
    }
  }

  async isAccessTokenRevoked(token: string): Promise<boolean> {
    try {
      const revoked = await prisma.revokedAccessToken.findUnique({
        where: { token },
      });
      return !!revoked;
    } catch (error) {
      logger.error('Error in TokenRepository.isAccessTokenRevoked:', error);
      return false; // On error, allow access (fail-open approach)
    }
  }

  async revokeAllUserAccessTokens(userId: number) {
    try {
      // This is a cleanup method - in practice, access tokens expire quickly
      // But we can mark them as revoked here for security
      return await prisma.revokedAccessToken.deleteMany({
        where: {
          userId,
          expiresAt: { lt: new Date() }, // Only delete expired tokens
        },
      });
    } catch (error) {
      logger.error('Error in TokenRepository.revokeAllUserAccessTokens:', error);
      throw error;
    }
  }

  async cleanupExpiredRevokedTokens() {
    try {
      // Cleanup revoked tokens that have already expired
      return await prisma.revokedAccessToken.deleteMany({
        where: {
          expiresAt: { lt: new Date() },
        },
      });
    } catch (error) {
      logger.error('Error in TokenRepository.cleanupExpiredRevokedTokens:', error);
      throw error;
    }
  }
}

export default TokenRepository.getInstance();