import TokenRepository from '../repositories/token.repository';
import logger from '../config/logger';

export class TokenCleanupJob {
  private static instance: TokenCleanupJob;
  private interval: NodeJS.Timeout | null = null;
  
  private constructor() {}
  
  static getInstance(): TokenCleanupJob {
    if (!TokenCleanupJob.instance) {
      TokenCleanupJob.instance = new TokenCleanupJob();
    }
    return TokenCleanupJob.instance;
  }
  
  start(intervalHours: number = 24) {
    // Run cleanup every specified hours
    const intervalMs = intervalHours * 60 * 60 * 1000;
    
    this.interval = setInterval(async () => {
      try {
        const result = await TokenRepository.cleanupExpiredTokens();
        logger.info(`Token cleanup completed: ${result.count} expired tokens removed`);
      } catch (error) {
        logger.error('Token cleanup failed:', error);
      }
    }, intervalMs);
    
    logger.info(`Token cleanup job started (every ${intervalHours} hours)`);
  }
  
  stop() {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
      logger.info('Token cleanup job stopped');
    }
  }
}

export default TokenCleanupJob.getInstance();