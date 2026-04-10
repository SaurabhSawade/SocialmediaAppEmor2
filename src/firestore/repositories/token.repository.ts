import FirebaseService from '../../config/firebase';
import { TokenType } from '../../constants/enums';

interface TokenData {
  userId: number;
  token: string;
  type: TokenType;
  expiresAt: any;
  isRevoked?: boolean;
  revokedAt?: any;
}

interface SessionData {
  userId: number;
  token: string;
  deviceInfo?: string;
  ipAddress?: string;
  userAgent?: string;
  expiresAt: any;
  isActive?: boolean;
  lastActivity?: any;
}

interface TokenDocument extends TokenData {
  id: string;
  createdAt: any;
}

interface SessionDocument extends SessionData {
  id: string;
  createdAt: any;
}

interface RevokedTokenData {
  userId: number;
  token: string;
  expiresAt: any;
}

interface RevokedTokenDocument extends RevokedTokenData {
  id: string;
}

export class FirestoreTokenRepository {
  private static instance: FirestoreTokenRepository;
  private tokenCollection = 'tokens';
  private sessionCollection = 'sessions';
  private revokedCollection = 'revoked_tokens';

  private constructor() {}

  static getInstance(): FirestoreTokenRepository {
    if (!FirestoreTokenRepository.instance) {
      FirestoreTokenRepository.instance = new FirestoreTokenRepository();
    }
    return FirestoreTokenRepository.instance;
  }

  private generateId(prefix: string): string {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  async saveToken(userId: number, token: string, type: TokenType, expiresAt: Date) {
    const id = this.generateId('token');
    const now = new Date().toISOString();

    const tokenData = {
      id,
      userId,
      token,
      type,
      expiresAt: expiresAt.toISOString(),
      isRevoked: false,
      revokedAt: null,
      createdAt: now,
    };

    await FirebaseService.setDocument(this.tokenCollection, id, tokenData);

    return tokenData;
  }

  async findValidToken(token: string, type: TokenType) {
    const allTokens = await FirebaseService.getDocuments<TokenDocument>(this.tokenCollection, {
      limit: 10000,
    });

    const now = new Date();
    
    const validToken = allTokens.data.find(
      t => t.token === token && t.type === type && !t.isRevoked && new Date(t.expiresAt) > now
    );

    if (!validToken) return null;

    return {
      id: parseInt(validToken.id.split('_')[1]),
      userId: validToken.userId,
      token: validToken.token,
      type: validToken.type,
      expiresAt: validToken.expiresAt,
      isRevoked: validToken.isRevoked,
    };
  }

  async revokeToken(token: string) {
    const allTokens = await FirebaseService.getDocuments<TokenDocument>(this.tokenCollection, {
      limit: 10000,
    });

    const tokenDoc = allTokens.data.find(t => t.token === token);

    if (tokenDoc) {
      await FirebaseService.updateDocument(this.tokenCollection, tokenDoc.id, {
        isRevoked: true,
        revokedAt: new Date().toISOString(),
      });
    }

    return tokenDoc;
  }

  async revokeAllUserTokens(userId: number, excludeToken?: string) {
    const allTokens = await FirebaseService.getDocuments<TokenDocument>(this.tokenCollection, {
      limit: 10000,
    });

    const userTokens = allTokens.data.filter(
      t => t.userId === userId && !t.isRevoked && (excludeToken ? t.token !== excludeToken : true)
    );

    for (const t of userTokens) {
      await FirebaseService.updateDocument(this.tokenCollection, t.id, {
        isRevoked: true,
        revokedAt: new Date().toISOString(),
      });
    }

    return { count: userTokens.length };
  }

  async cleanupExpiredTokens() {
    const allTokens = await FirebaseService.getDocuments<TokenDocument>(this.tokenCollection, {
      limit: 10000,
    });

    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const expiredTokens = allTokens.data.filter(
      t => new Date(t.expiresAt) < now || (t.isRevoked && t.revokedAt && new Date(t.revokedAt) < sevenDaysAgo)
    );

    for (const t of expiredTokens) {
      await FirebaseService.deleteDocument(this.tokenCollection, t.id);
    }

    return { count: expiredTokens.length };
  }

  async createSession(userId: number, token: string, deviceInfo?: string, ipAddress?: string, userAgent?: string) {
    const id = this.generateId('session');
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    const sessionData: any = {
      id,
      userId,
      token,
      expiresAt: expiresAt.toISOString(),
      isActive: true,
      lastActivity: now.toISOString(),
      createdAt: now.toISOString(),
    };

    if (deviceInfo !== undefined) sessionData.deviceInfo = deviceInfo;
    if (ipAddress !== undefined) sessionData.ipAddress = ipAddress;
    if (userAgent !== undefined) sessionData.userAgent = userAgent;

    await FirebaseService.setDocument(this.sessionCollection, id, sessionData);

    return sessionData;
  }

  async findSession(token: string) {
    const allSessions = await FirebaseService.getDocuments<SessionDocument>(this.sessionCollection, {
      limit: 10000,
    });

    const now = new Date();

    const session = allSessions.data.find(
      s => s.token === token && s.isActive && new Date(s.expiresAt) > now
    );

    if (!session) return null;

    return {
      id: session.id,
      userId: session.userId,
      token: session.token,
      deviceInfo: session.deviceInfo,
      ipAddress: session.ipAddress,
      userAgent: session.userAgent,
      expiresAt: session.expiresAt,
      isActive: session.isActive,
      lastActivity: session.lastActivity,
    };
  }

  async findSessionById(sessionId: string, userId: number) {
    const allSessions = await FirebaseService.getDocuments<SessionDocument>(this.sessionCollection, {
      limit: 10000,
    });

    const session = allSessions.data.find(s => s.id === sessionId && s.userId === userId);

    if (!session) return null;

    return {
      id: session.id,
      userId: session.userId,
      token: session.token,
      deviceInfo: session.deviceInfo,
      ipAddress: session.ipAddress,
      userAgent: session.userAgent,
      expiresAt: session.expiresAt,
      isActive: session.isActive,
      lastActivity: session.lastActivity,
    };
  }

  async revokeSession(token: string) {
    const allSessions = await FirebaseService.getDocuments<SessionDocument>(this.sessionCollection, {
      limit: 10000,
    });

    const session = allSessions.data.find(s => s.token === token);

    if (session) {
      await FirebaseService.updateDocument(this.sessionCollection, session.id, {
        isActive: false,
      });
    }

    return session;
  }

  async revokeAllUserSessions(userId: number, excludeToken?: string) {
    const allSessions = await FirebaseService.getDocuments<SessionDocument>(this.sessionCollection, {
      limit: 10000,
    });

    const userSessions = allSessions.data.filter(
      s => s.userId === userId && s.isActive && (excludeToken ? s.token !== excludeToken : true)
    );

    for (const s of userSessions) {
      await FirebaseService.updateDocument(this.sessionCollection, s.id, {
        isActive: false,
      });
    }

    return { count: userSessions.length };
  }

  async getUserSessions(userId: number) {
    const allSessions = await FirebaseService.getDocuments<SessionDocument>(this.sessionCollection, {
      limit: 10000,
    });

    const now = new Date();

    const sessions = allSessions.data.filter(
      s => s.userId === userId && s.isActive && new Date(s.expiresAt) > now
    );

    return sessions.map(s => ({
      id: s.id,
      userId: s.userId,
      token: s.token,
      deviceInfo: s.deviceInfo,
      ipAddress: s.ipAddress,
      userAgent: s.userAgent,
      expiresAt: s.expiresAt,
      isActive: s.isActive,
      lastActivity: s.lastActivity,
    }));
  }

  async updateSessionActivity(token: string) {
    const allSessions = await FirebaseService.getDocuments<SessionDocument>(this.sessionCollection, {
      limit: 10000,
    });

    const session = allSessions.data.find(s => s.token === token);

    if (session) {
      await FirebaseService.updateDocument(this.sessionCollection, session.id, {
        lastActivity: new Date().toISOString(),
      });
    }

    return session;
  }

  async revokeAccessToken(userId: number, token: string, expiresAt: Date) {
    const id = this.generateId('revoked');

    const revokedData = {
      id,
      userId,
      token,
      expiresAt: expiresAt.toISOString(),
    };

    await FirebaseService.setDocument(this.revokedCollection, id, revokedData);

    return revokedData;
  }

  async isAccessTokenRevoked(token: string): Promise<boolean> {
    const allRevoked = await FirebaseService.getDocuments<RevokedTokenDocument>(this.revokedCollection, {
      limit: 10000,
    });

    const revoked = allRevoked.data.find(t => t.token === token);
    return !!revoked;
  }

  async revokeAllUserAccessTokens(userId: number) {
    const allRevoked = await FirebaseService.getDocuments<RevokedTokenDocument>(this.revokedCollection, {
      limit: 10000,
    });

    const now = new Date();
    const userRevoked = allRevoked.data.filter(
      t => t.userId === userId && new Date(t.expiresAt) < now
    );

    for (const t of userRevoked) {
      await FirebaseService.deleteDocument(this.revokedCollection, t.id);
    }

    return { count: userRevoked.length };
  }

  async cleanupExpiredRevokedTokens() {
    const allRevoked = await FirebaseService.getDocuments<RevokedTokenDocument>(this.revokedCollection, {
      limit: 10000,
    });

    const now = new Date();
    const expiredTokens = allRevoked.data.filter(t => new Date(t.expiresAt) < now);

    for (const t of expiredTokens) {
      await FirebaseService.deleteDocument(this.revokedCollection, t.id);
    }

    return { count: expiredTokens.length };
  }
}

export default FirestoreTokenRepository.getInstance();
