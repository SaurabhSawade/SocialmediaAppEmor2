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
      [Messages.POST_NOT_FOUND.toLowerCase()]: HttpStatus.NOT_FOUND,
      [Messages.COMMENT_NOT_FOUND.toLowerCase()]: HttpStatus.NOT_FOUND,
      [Messages.FOLLOW_NOT_FOUND.toLowerCase()]: HttpStatus.NOT_FOUND,
      [Messages.LIKE_NOT_FOUND.toLowerCase()]: HttpStatus.NOT_FOUND,
      [Messages.NOT_FOUND.toLowerCase()]: HttpStatus.NOT_FOUND,
      [Messages.EMAIL_EXISTS.toLowerCase()]: HttpStatus.CONFLICT,
      [Messages.PHONE_EXISTS.toLowerCase()]: HttpStatus.CONFLICT,
      [Messages.USERNAME_EXISTS.toLowerCase()]: HttpStatus.CONFLICT,
      [Messages.ALREADY_FOLLOWING.toLowerCase()]: HttpStatus.CONFLICT,
      [Messages.INVALID_CREDENTIALS.toLowerCase()]: HttpStatus.UNAUTHORIZED,
      [Messages.EMAIL_NOT_VERIFIED.toLowerCase()]: HttpStatus.UNAUTHORIZED,
      [Messages.INVALID_TOKEN.toLowerCase()]: HttpStatus.UNAUTHORIZED,
      [Messages.INVALID_OTP.toLowerCase()]: HttpStatus.UNAUTHORIZED,
      [Messages.ACCOUNT_DELETED.toLowerCase()]: HttpStatus.FORBIDDEN,
      [Messages.WEAK_PASSWORD.toLowerCase()]: HttpStatus.UNPROCESSABLE_ENTITY,
      [Messages.TOO_MANY_REQUESTS?.toLowerCase() ?? ""]: HttpStatus.TOO_MANY_REQUESTS,
      [Messages.INVALID_EMAIL_FORMAT.toLowerCase()]: HttpStatus.BAD_REQUEST,
      [Messages.INVALID_PHONE_FORMAT.toLowerCase()]: HttpStatus.BAD_REQUEST,
      [Messages.PASSWORDS_DO_NOT_MATCH.toLowerCase()]: HttpStatus.BAD_REQUEST,
      [Messages.INVALID_USERNAME_FORMAT.toLowerCase()]: HttpStatus.BAD_REQUEST,
      [Messages.COMMENT_CONTENT_EMPTY.toLowerCase()]: HttpStatus.BAD_REQUEST,
      [Messages.COMMENT_TOO_LONG.toLowerCase()]: HttpStatus.BAD_REQUEST,
      [Messages.POST_MEDIA_REQUIRED.toLowerCase()]: HttpStatus.BAD_REQUEST,
      [Messages.EMAIL_SERVICE_NOT_CONFIGURED.toLowerCase()]: HttpStatus.SERVICE_UNAVAILABLE,
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
