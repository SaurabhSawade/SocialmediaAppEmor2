import { Response } from "express";
import { HttpStatus } from "../constants/http-status";

export class ApiResponseHandler {
  static success<T>(
    res: Response,
    message: string,
    data?: T,
    statusCode: number = HttpStatus.OK,
  ): Response {
    return res.status(statusCode).json({
      success: true,
      statusCode,
      message,
      data,
      // timestamp: new Date().toISOString(),
    });
  }

  static error(
    res: Response,
    message: string,
    statusCode: number = HttpStatus.INTERNAL_SERVER_ERROR,
    error?: any,
  ): Response {
    const response: any = {
      success: false,
      statusCode,
      message,
      // timestamp: new Date().toISOString(),
    };

    if (error && process.env.NODE_ENV === "development") {
      response.error = error.message;
    }

    return res.status(statusCode).json(response);
  }

  static created<T>(res: Response, message: string, data?: T): Response {
    return this.success(res, message, data, HttpStatus.CREATED);
  }


    static badRequest(res: Response, message: string): Response {
    return this.error(res, message, HttpStatus.BAD_REQUEST);
  }
  
  static unauthorized(res: Response, message: string): Response {
    return this.error(res, message, HttpStatus.UNAUTHORIZED);
  }
  
  static forbidden(res: Response, message: string): Response {
    return this.error(res, message, HttpStatus.FORBIDDEN);
  }
  
  static notFound(res: Response, message: string): Response {
    return this.error(res, message, HttpStatus.NOT_FOUND);
  }
  
  static conflict(res: Response, message: string): Response {
    return this.error(res, message, HttpStatus.CONFLICT);
  }
}
