import { HttpStatus } from "../constants/http-status";
import { Messages } from "../constants/messages";

export class AppError extends Error {
  public statusCode: number;
  public isOperational: boolean;
  public details?: any;

  private static inferStatusCode(message: string): number {
    const normalized = message.trim().toLowerCase();

    const map: Record<string, number> = {
      [Messages.USER_NOT_FOUND.toLowerCase()]: HttpStatus.NOT_FOUND,
      [Messages.PROFILE_NOT_FOUND.toLowerCase()]: HttpStatus.NOT_FOUND,
      [Messages.NOT_FOUND.toLowerCase()]: HttpStatus.NOT_FOUND,
      [Messages.EMAIL_EXISTS.toLowerCase()]: HttpStatus.CONFLICT,
      [Messages.PHONE_EXISTS.toLowerCase()]: HttpStatus.CONFLICT,
      [Messages.USERNAME_EXISTS.toLowerCase()]: HttpStatus.CONFLICT,
      [Messages.INVALID_CREDENTIALS.toLowerCase()]: HttpStatus.UNAUTHORIZED,
      [Messages.EMAIL_NOT_VERIFIED.toLowerCase()]: HttpStatus.UNAUTHORIZED,
      [Messages.INVALID_TOKEN.toLowerCase()]: HttpStatus.UNAUTHORIZED,
      [Messages.INVALID_OTP.toLowerCase()]: HttpStatus.UNAUTHORIZED,
      [Messages.ACCOUNT_DELETED.toLowerCase()]: HttpStatus.FORBIDDEN,
      [Messages.WEAK_PASSWORD.toLowerCase()]: HttpStatus.UNPROCESSABLE_ENTITY,
      [Messages.TOO_MANY_REQUESTS?.toLowerCase() ?? ""]: HttpStatus.TOO_MANY_REQUESTS,

      "invalid email format": HttpStatus.BAD_REQUEST,
      "invalid phone format": HttpStatus.BAD_REQUEST,
      "passwords do not match": HttpStatus.BAD_REQUEST,
      "invalid username format": HttpStatus.BAD_REQUEST,
      "at least one media file is required": HttpStatus.BAD_REQUEST,
      "post not found": HttpStatus.NOT_FOUND,
      "comment not found or unauthorized": HttpStatus.NOT_FOUND,
      "email service is not configured. please check smtp settings in .env": HttpStatus.SERVICE_UNAVAILABLE,
    };

    if (map[normalized]) {
      return map[normalized];
    }

    if (normalized.includes("not found")) {
      return HttpStatus.NOT_FOUND;
    }

    if (normalized.includes("unauthorized") || normalized.includes("forbidden")) {
      return HttpStatus.FORBIDDEN;
    }

    if (normalized.includes("invalid") || normalized.includes("required") || normalized.includes("cannot")) {
      return HttpStatus.BAD_REQUEST;
    }

    if (normalized.includes("expired")) {
      return HttpStatus.UNAUTHORIZED;
    }

    return HttpStatus.BAD_REQUEST;
  }

  constructor(message: string, statusCode?: number | object, details?: any) {
    super(message);
    this.name = "AppError";

    if (statusCode && typeof statusCode === 'object') {
      this.details = statusCode;
      this.statusCode = AppError.inferStatusCode(message);
    } else {
      this.statusCode = (statusCode as number) ?? AppError.inferStatusCode(message);
      this.details = details;
    }

    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

export default AppError;
