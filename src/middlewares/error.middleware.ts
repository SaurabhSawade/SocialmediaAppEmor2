import { Request, Response, NextFunction } from "express";
import { Prisma } from "../generated/prisma";
import { ApiResponseHandler } from "../utils/api-response";
import { Messages } from "../constants/messages";
import { HttpStatus } from "../constants/http-status";
import logger from "../config/logger";

export class ErrorMiddleware {
  static handle(error: Error, req: Request, res: Response, next: NextFunction) {
    logger.error("Error occurred:", {
      error: error.message,
      stack: error.stack,
      path: req.path,
      method: req.method,
      ip: req.ip,
      user: (req as any).user?.id,
    });

    // Handle Prisma known errors
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      switch (error.code) {
        case "P2002":
          return ApiResponseHandler.error(
            res,
            "A record with this field already exists",
            HttpStatus.CONFLICT,
          );
        case "P2025":
          return ApiResponseHandler.error(
            res,
            "Record not found",
            HttpStatus.NOT_FOUND,
          );
        default:
          return ApiResponseHandler.error(
            res,
            Messages.DATABASE_ERROR,
            HttpStatus.INTERNAL_SERVER_ERROR,
          );
      }
    }

    // Handle Prisma validation errors
    if (error instanceof Prisma.PrismaClientValidationError) {
      return ApiResponseHandler.error(
        res,
        "Invalid data provided",
        HttpStatus.UNPROCESSABLE_ENTITY,
      );
    }

    // Handle JWT errors
    if (error.name === "JsonWebTokenError") {
      return ApiResponseHandler.error(
        res,
        Messages.INVALID_TOKEN,
        HttpStatus.UNAUTHORIZED,
      );
    }

    if (error.name === "TokenExpiredError") {
      return ApiResponseHandler.error(
        res,
        "Token expired",
        HttpStatus.UNAUTHORIZED,
      );
    }

    // Handle custom business errors
    const businessErrors = [
      Messages.INVALID_CREDENTIALS,
      Messages.USER_NOT_FOUND,
      Messages.EMAIL_EXISTS,
      Messages.PHONE_EXISTS,
      Messages.USERNAME_EXISTS,
      Messages.INVALID_OTP,
      Messages.EMAIL_NOT_VERIFIED,
      Messages.ACCOUNT_DELETED,
      "Either email or phone is required",
      "Invalid username format",
      "Password must be at least 8 characters",
      "Current password is incorrect",
      "No email associated with this account",
      "Account already verified",
    ];

    if (businessErrors.includes(error.message)) {
      return ApiResponseHandler.error(
        res,
        error.message,
        HttpStatus.BAD_REQUEST,
      );
    }

    // Default error response
    const statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
    const message =
      process.env.NODE_ENV === "production"
        ? Messages.INTERNAL_ERROR
        : error.message;

    return ApiResponseHandler.error(res, message, statusCode);
  }
}
