import FirebaseService from '../../config/firebase';
import { OTPType } from '../../constants/enums';

interface OTPData {
  userId: number;
  otp: string;
  type: OTPType;
  expiresAt: any;
}

interface OTPDocument extends OTPData {
  id: string;
  createdAt: any;
}

export class FirestoreOTPRepository {
  private static instance: FirestoreOTPRepository;
  private collectionName = 'otps';

  private constructor() {}

  static getInstance(): FirestoreOTPRepository {
    if (!FirestoreOTPRepository.instance) {
      FirestoreOTPRepository.instance = new FirestoreOTPRepository();
    }
    return FirestoreOTPRepository.instance;
  }

  private generateId(): string {
    return `otp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  async create(userId: number, otp: string, type: OTPType, expiresAt: Date) {
    const allOTPs = await FirebaseService.getDocuments<OTPDocument>(this.collectionName, {
      limit: 10000,
    });

    const existingOTPs = allOTPs.data.filter(
      o => o.userId === userId && o.type === type
    );

    for (const existing of existingOTPs) {
      await FirebaseService.deleteDocument(this.collectionName, existing.id);
    }

    const id = this.generateId();
    const now = new Date().toISOString();

    const otpData = {
      id,
      userId,
      otp,
      type,
      expiresAt: expiresAt.toISOString(),
      createdAt: now,
    };

    await FirebaseService.setDocument(this.collectionName, id, otpData);

    return {
      userId: otpData.userId,
      otp: otpData.otp,
      type: otpData.type,
      expiresAt: otpData.expiresAt,
    };
  }

  async verify(userId: number, otp: string, type: OTPType) {
    const allOTPs = await FirebaseService.getDocuments<OTPDocument>(this.collectionName, {
      limit: 10000,
    });

    const now = new Date();
    
    const otpRecord = allOTPs.data.find(
      o => o.userId === userId && o.otp === otp && o.type === type && new Date(o.expiresAt) > now
    );

    if (!otpRecord) {
      return null;
    }

    await FirebaseService.deleteDocument(this.collectionName, otpRecord.id);

    return {
      userId: otpRecord.userId,
      otp: otpRecord.otp,
      type: otpRecord.type,
      expiresAt: otpRecord.expiresAt,
    };
  }

  async deleteExpiredOTPs() {
    const allOTPs = await FirebaseService.getDocuments<OTPDocument>(this.collectionName, {
      limit: 10000,
    });

    const now = new Date();
    const expiredOTPs = allOTPs.data.filter(o => new Date(o.expiresAt) < now);

    for (const otp of expiredOTPs) {
      await FirebaseService.deleteDocument(this.collectionName, otp.id);
    }

    return { count: expiredOTPs.length };
  }
}

export default FirestoreOTPRepository.getInstance();
