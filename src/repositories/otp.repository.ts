import prisma from "../prisma/client";
import { OTPType } from "../constants/enums";
import logger from "../config/logger";

export class OTPRepository {
  private static instance: OTPRepository;

  private constructor() {}

  static getInstance(): OTPRepository {
    if (!OTPRepository.instance) {
      OTPRepository.instance = new OTPRepository();
    }
    return OTPRepository.instance;
  }

  async create(userId: number, otp: string, type: OTPType, expiresAt: Date) {
    try {
      // Delete existing OTPs for same user and type
      await prisma.oTP.deleteMany({
        where: {
          userId,
          type,
        },
      });

      // Create new OTP
      return await prisma.oTP.create({
        data: {
          userId,
          otp,
          type,
          expiresAt,
        },
      });
    } catch (error) {
      logger.error("Error in OTPRepository.create:", error);
      throw error;
    }
  }

  async verify(userId: number, otp: string, type: OTPType) {
    try {
      const otpRecord = await prisma.oTP.findFirst({
        where: {
          userId,
          otp,
          type,
          expiresAt: {
            gt: new Date(),
          },
        },
      });

      if (!otpRecord) {
        return null;
      }

      // Delete OTP after successful verification
      await prisma.oTP.delete({
        where: { id: otpRecord.id },
      });

      return otpRecord;
    } catch (error) {
      logger.error("Error in OTPRepository.verify:", error);
      throw error;
    }
  }

  async deleteExpiredOTPs() {
    try {
      return await prisma.oTP.deleteMany({
        where: {
          expiresAt: {
            lt: new Date(),
          },
        },
      });
    } catch (error) {
      logger.error("Error in OTPRepository.deleteExpiredOTPs:", error);
      throw error;
    }
  }
}

export default OTPRepository.getInstance();
