import { Request, Response, NextFunction } from "express";
import multer from 'multer';
import { Prisma } from "../generated/prisma";
import { ApiResponseHandler } from "../utils/api-response";
import { AppError } from "../utils/app-error";
import { Messages } from "../constants/messages";
import { HttpStatus } from "../constants/http-status";
import logger from "../config/logger";

export class ErrorMiddleware {
  static handle(error: Error, req: Request, res: Response, _next: NextFunction) {
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

    // Custom AppError (operational error with status code)
    if (error instanceof AppError) {
      return ApiResponseHandler.error(res, error.message, error.statusCode, error);
    }

    // Multer errors
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

    // Prisma errors
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
            Messages.DATABASE_ERROR,
            HttpStatus.INTERNAL_SERVER_ERROR,
          );
      }
    }

    if (error instanceof Prisma.PrismaClientValidationError) {
      return ApiResponseHandler.error(
        res,
        "Invalid data provided. Please check your input format.",
        HttpStatus.UNPROCESSABLE_ENTITY,
      );
    }

    if (error instanceof Prisma.PrismaClientInitializationError) {
      logger.error("Database connection error:", error.message);
      return ApiResponseHandler.error(
        res,
        "Database connection failed. Please try again later.",
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    // JWT errors
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
        "Your authentication token has expired. Please login again.",
        HttpStatus.UNAUTHORIZED,
      );
    }

    // Generic Error with statusCode property ( e.g., thrown non-Error objects )
    const genericError = error as any;
    if (genericError.statusCode && genericError.message) {
      return ApiResponseHandler.error(res, genericError.message, genericError.statusCode, genericError);
    }

    // Fallback
    const statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
    const message = process.env.NODE_ENV === "production" ? Messages.INTERNAL_ERROR : `An unexpected error occurred: ${error.message}`;

    return ApiResponseHandler.error(res, message, statusCode, error);
  }
}
