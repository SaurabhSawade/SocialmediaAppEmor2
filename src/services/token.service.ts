import jwt, { SignOptions } from "jsonwebtoken";
import env from "../config/env";
import logger from "../config/logger";

export class TokenService {
  private static instance: TokenService;

  private constructor() {}

  static getInstance(): TokenService {
    if (!TokenService.instance) {
      TokenService.instance = new TokenService();
    }
    return TokenService.instance;
  }

  generateTokens(userId: number, email?: string | null, phone?: string | null) {
    const payload = { userId, email, phone };

    const accessToken = jwt.sign(payload, env.JWT_ACCESS_SECRET, {
      expiresIn: env.JWT_ACCESS_EXPIRY,
    } as SignOptions);

    const refreshToken = jwt.sign(payload, env.JWT_REFRESH_SECRET, {
      expiresIn: env.JWT_REFRESH_EXPIRY,
    } as SignOptions);

    return {
      accessToken,
      refreshToken,
    };
  }

  verifyAccessToken(token: string): any | null {
    try {
      return jwt.verify(token, env.JWT_ACCESS_SECRET);
    } catch (error) {
      logger.error("Access token verification failed:", error);
      return null;
    }
  }

  verifyRefreshToken(token: string): any | null {
    try {
      return jwt.verify(token, env.JWT_REFRESH_SECRET);
    } catch (error) {
      logger.error("Refresh token verification failed:", error);
      return null;
    }
  }
}

export default TokenService.getInstance();
