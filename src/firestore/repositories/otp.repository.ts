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

  private extractUserIdFromOTPId(otpId: string): number {
    const parts = otpId.split('_');
    if (parts.length >= 2) {
      const parsed = parseInt(parts[1], 10);
      return isNaN(parsed) ? 0 : parsed;
    }
    return 0;
  }

  async create(userId: number, otp: string, type: OTPType, expiresAt: Date) {
    console.log('[DEBUG OTP Create] === START CREATE ===');
    console.log('[DEBUG OTP Create] Input userId:', userId, 'type:', typeof userId);
    console.log('[DEBUG OTP Create] Input otp:', otp, 'type:', typeof otp);
    console.log('[DEBUG OTP Create] Input type:', type);
    console.log('[DEBUG OTP Create] Input expiresAt:', expiresAt.toISOString());
    
    const allOTPs = await FirebaseService.getDocuments<OTPDocument>(this.collectionName, {
      limit: 10000,
    });

    const existingOTPs = allOTPs.data.filter(
      o => o.userId === userId && o.type === type
    );

    console.log('[DEBUG OTP Create] Deleting existing OTPs:', existingOTPs.map(o => o.id));

    for (const existing of existingOTPs) {
      await FirebaseService.deleteDocument(this.collectionName, existing.id);
    }

    const id = this.generateId();
    const now = new Date().toISOString();

    const otpData = {
      id,
      userId,
      otp: otp, // Ensure it's stored as string
      type,
      expiresAt: expiresAt.toISOString(),
      createdAt: now,
    };

    console.log('[DEBUG OTP Create] Storing:', { id, userId, type, expiresAt: otpData.expiresAt, otpLength: otp.length });

    await FirebaseService.setDocument(this.collectionName, id, otpData);

    console.log('[DEBUG OTP Create] === DONE ===');
    
    return {
      userId: otpData.userId,
      otp: otpData.otp,
      type: otpData.type,
      expiresAt: otpData.expiresAt,
    };
  }

  async verify(userId: number, otp: string, type: OTPType) {
    console.log('[DEBUG OTP Verify] === START VERIFY ===');
    console.log('[DEBUG OTP Verify] Input userId:', userId, 'type:', typeof userId);
    console.log('[DEBUG OTP Verify] Input otp:', otp, 'type:', typeof otp);
    console.log('[DEBUG OTP Verify] Input type:', type);
    
    const allOTPs = await FirebaseService.getDocuments<OTPDocument>(this.collectionName, {
      limit: 10000,
    });

    console.log('[DEBUG OTP Verify] Found OTPs count:', allOTPs.data.length);
    
    // Log raw userId from Firestore
    console.log('[DEBUG OTP Verify] Raw OTPs sample:', allOTPs.data.slice(0, 3).map(o => ({
      id: o.id,
      userId: o.userId,
      userIdType: typeof o.userId,
      otp: o.otp,
      type: o.type,
      expiresAt: o.expiresAt
    })));

    // More detailed filtering - use userId field now that it's being set correctly
    const userOTPs = allOTPs.data.filter(o => o.userId === userId && o.type === type);
    console.log('[DEBUG OTP Verify] Filtered user OTPs:', userOTPs.map(o => ({
      id: o.id,
      userId: o.userId,
      userIdType: typeof o.userId,
      otpLength: o.otp?.length,
      type: o.type,
      expiresAt: o.expiresAt
    })));

    const now = new Date();
    
    const otpRecord = allOTPs.data.find(
      o => o.userId === userId && String(o.otp).trim() === String(otp).trim() && o.type === type && new Date(o.expiresAt) > now
    );

    console.log('[DEBUG OTP Verify] Matched record:', otpRecord ? { id: otpRecord.id, userId: otpRecord.userId, otp: otpRecord.otp } : null);

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
