import { Request, Response, NextFunction } from "express";
import multer from 'multer';
import { Prisma } from "../generated/prisma";
import { ApiResponseHandler } from "../utils/api-response";
import { Messages } from "../constants/messages";
import { HttpStatus } from "../constants/http-status";
import logger from "../config/logger";

export class ErrorMiddleware {
  static handle(error: Error, req: Request, res: Response, _next: NextFunction) {
    // Log detailed error information
    logger.error("Error occurred:", {
      error: error.message,
      stack: error.stack,
      path: req.path,
      method: req.method,
      ip: req.ip,
      userAgent: req.get('user-agent'),
      body: process.env.NODE_ENV === 'development' ? req.body : '[REDACTED]',
      query: req.query,
      params: req.params,
      user: (req as any).user?.id,
      timestamp: new Date().toISOString(),
    });


        // Handle Multer errors
    if (error instanceof multer.MulterError) {
      if (error.code === 'LIMIT_FILE_SIZE') {
        return ApiResponseHandler.error(res, 'File too large. Max size is 50MB.', HttpStatus.BAD_REQUEST);
      }
      if (error.code === 'LIMIT_FILE_COUNT') {
        return ApiResponseHandler.error(res, 'Too many files. Max 10 files per post.', HttpStatus.BAD_REQUEST);
      }
      if (error.code === 'LIMIT_UNEXPECTED_FILE') {
        return ApiResponseHandler.error(res, 'Unexpected field name. Use "media" for files.', HttpStatus.BAD_REQUEST);
      }
      return ApiResponseHandler.error(res, `Upload error: ${error.message}`, HttpStatus.BAD_REQUEST);
    }
    

    // Handle Prisma known errors
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      switch (error.code) {
        case "P2002":
          return ApiResponseHandler.error(
            res,
            "A record with this field already exists. Please use a different value.",
            HttpStatus.CONFLICT,
          );
        case "P2025":
          return ApiResponseHandler.error(
            res,
            "The requested record was not found.",
            HttpStatus.NOT_FOUND,
          );
        case "P2003":
          return ApiResponseHandler.error(
            res,
            "Cannot perform this operation due to related data constraints.",
            HttpStatus.BAD_REQUEST,
          );
        default:
          logger.error("Unhandled Prisma error:", { code: error.code, meta: error.meta });
          return ApiResponseHandler.error(
            res,
            "Database operation failed. Please try again later.",
            HttpStatus.INTERNAL_SERVER_ERROR,
          );
      }
    }

    // Handle Prisma validation errors
    if (error instanceof Prisma.PrismaClientValidationError) {
      return ApiResponseHandler.error(
        res,
        "Invalid data provided. Please check your input format.",
        HttpStatus.UNPROCESSABLE_ENTITY,
      );
    }

    // Handle Prisma connection errors
    if (error instanceof Prisma.PrismaClientInitializationError) {
      logger.error("Database connection error:", error.message);
      return ApiResponseHandler.error(
        res,
        "Database connection failed. Please try again later.",
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    // Handle JWT errors
    if (error.name === "JsonWebTokenError") {
      return ApiResponseHandler.error(
        res,
        "Invalid authentication token provided.",
        HttpStatus.UNAUTHORIZED,
      );
    }

    if (error.name === "TokenExpiredError") {
      return ApiResponseHandler.error(
        res,
        "Your authentication token has expired. Please login again.",
        HttpStatus.UNAUTHORIZED,
      );
    }

    // Handle validation errors (express-validator)
    if (error.message && error.message.includes('Validation')) {
      return ApiResponseHandler.error(
        res,
        error.message,
        HttpStatus.UNPROCESSABLE_ENTITY,
      );
    }

    // Handle custom business errors with specific messages
    const businessErrors = [
      Messages.INVALID_CREDENTIALS,
      Messages.USER_NOT_FOUND,
      Messages.EMAIL_EXISTS,
      Messages.PHONE_EXISTS,
      Messages.USERNAME_EXISTS,
      Messages.INVALID_OTP,
      Messages.EMAIL_NOT_VERIFIED,
      Messages.ACCOUNT_DELETED,
      Messages.WEAK_PASSWORD,
      Messages.NOT_FOUND,
      "Either email or phone is required",
      "Invalid username format",
      "Password must be at least 8 characters",
      "Current password is incorrect",
      "No email associated with this account",
      "Account already verified",
      "Invalid email format",
      "Phone must be 10-15 digits",
      "Passwords do not match",
      "Identifier (email or phone) is required",
      "OTP is required",
      "OTP must be 6 digits",
      "OTP must be numeric",
      "New password is required",
      "Confirm password is required",
    ];

    if (businessErrors.includes(error.message)) {
      return ApiResponseHandler.error(
        res,
        error.message,
        HttpStatus.BAD_REQUEST,
      );
    }

    // Handle network/file system errors
    const err = error as any;
    if (err.code === 'ECONNREFUSED') {
      return ApiResponseHandler.error(
        res,
        "External service is currently unavailable. Please try again later.",
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }

    if (err.code === 'ENOTFOUND') {
      return ApiResponseHandler.error(
        res,
        "Network connection failed. Please check your internet connection.",
        HttpStatus.BAD_REQUEST,
      );
    }

    // Handle file upload errors
    if (err.code === 'LIMIT_FILE_SIZE') {
      return ApiResponseHandler.error(
        res,
        "File size exceeds the maximum allowed limit.",
        HttpStatus.BAD_REQUEST,
      );
    }

    // Default error response with detailed logging in development
    const statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
    const message =
      process.env.NODE_ENV === "production"
        ? Messages.INTERNAL_ERROR
        : `An unexpected error occurred: ${error.message}`;

    return ApiResponseHandler.error(res, message, statusCode);
  }
}
