import OTPRepository from "../repositories/otp.repository";
import EmailService from "./email.service";
import { OTPType, OTP_EXPIRY_MINUTES } from "../constants/enums";
import { Helpers } from "../utils/helpers";
import logger from "../config/logger";

export class OTPService {
  private static instance: OTPService;

  private constructor() {}

  static getInstance(): OTPService {
    if (!OTPService.instance) {
      OTPService.instance = new OTPService();
    }
    return OTPService.instance;
  }

  async generateAndSendOTP(
    userId: number,
    email: string,
    type: OTPType,
  ): Promise<string> {
    const otp = Helpers.generateOTP();
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + OTP_EXPIRY_MINUTES);

    await OTPRepository.create(userId, otp, type, expiresAt);
    await EmailService.sendOTP(email, otp, type);

    logger.info(`OTP sent to user ${userId} for type: ${type}`);
    return otp;
  }

  async verifyOTP(
    userId: number,
    otp: string,
    type: OTPType,
  ): Promise<boolean> {
    const otpRecord = await OTPRepository.verify(userId, otp, type);

    if (!otpRecord) {
      logger.warn(`Invalid OTP attempt for user ${userId}, type: ${type}`);
      return false;
    }

    logger.info(`OTP verified for user ${userId}, type: ${type}`);
    return true;
  }
}

export default OTPService.getInstance();
