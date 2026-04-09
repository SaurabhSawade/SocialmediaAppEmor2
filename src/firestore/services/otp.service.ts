import FirestoreOTPRepository from '../repositories/otp.repository';
import EmailService from '../../services/email.service';
import { OTPType, OTP_EXPIRY_MINUTES } from '../../constants/enums';
import { Helpers } from '../../utils/helpers';
import logger from '../../config/logger';

export class FirestoreOTPService {
  private static instance: FirestoreOTPService;

  private constructor() {}

  static getInstance(): FirestoreOTPService {
    if (!FirestoreOTPService.instance) {
      FirestoreOTPService.instance = new FirestoreOTPService();
    }
    return FirestoreOTPService.instance;
  }

  async generateAndSendOTP(userId: number, email: string, type: OTPType): Promise<string> {
    const otp = Helpers.generateOTP();
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + OTP_EXPIRY_MINUTES);

    await FirestoreOTPRepository.create(userId, otp, type, expiresAt);
    await EmailService.sendOTP(email, otp, type);

    logger.info(`OTP sent to user ${userId} for type: ${type}`);
    return otp;
  }

  async verifyOTP(userId: number, otp: string, type: OTPType): Promise<boolean> {
    const otpRecord = await FirestoreOTPRepository.verify(userId, otp, type);

    if (!otpRecord) {
      logger.warn(`Invalid OTP attempt for user ${userId}, type: ${type}`);
      return false;
    }

    logger.info(`OTP verified for user ${userId}, type: ${type}`);
    return true;
  }
}

export default FirestoreOTPService;
