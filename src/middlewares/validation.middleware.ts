import { Request, Response, NextFunction } from "express";
import { validationResult, ValidationChain } from "express-validator";
import { ApiResponseHandler } from "../utils/api-response";
import { HttpStatus } from "../constants/http-status";

export class ValidationMiddleware {
  static validate(validations: ValidationChain[]) {
    return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      try {
        // Run all validations
        await Promise.all(validations.map((validation) => validation.run(req)));

        // Get validation errors
        const errors = validationResult(req);

        if (errors.isEmpty()) {
          return next();
        }

        // Get the first error message
        const firstError = errors.array()[0];
        const errorMessage = firstError?.msg || "Validation failed";

        // Debug log in development
        if (process.env.NODE_ENV === "development") {
          console.log("VALIDATION ERROR:", firstError);
        }

        // Return error response with only the first error message
        ApiResponseHandler.error(res, errorMessage, HttpStatus.UNPROCESSABLE_ENTITY);
      } catch (error) {
        // Safety fallback if validation itself crashes
        console.error("Validation Middleware Crash:", error);

        const errorMessage = error instanceof Error ? error.message : "Validation processing failed";
        ApiResponseHandler.error(res, errorMessage, HttpStatus.INTERNAL_SERVER_ERROR);
      }
    };
  }
}
