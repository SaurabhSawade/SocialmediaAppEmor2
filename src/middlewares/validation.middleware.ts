import { Request, Response, NextFunction } from "express";
import { validationResult, ValidationChain } from "express-validator";
import { ApiResponseHandler } from "../utils/api-response";
import { HttpStatus } from "../constants/http-status";
import { Messages } from "../constants/messages";

export class ValidationMiddleware {
  static validate(validations: ValidationChain[]) {
    return async (req: Request, res: Response, next: NextFunction) => {
      // Execute all validations
      await Promise.all(validations.map((validation) => validation.run(req)));

      // Check for validation errors
      const errors = validationResult(req);

      if (errors.isEmpty()) {
        return next();
      }

      // Format errors
      const formattedErrors = errors.array().map((error) => ({
        field: error.type === "field" ? error.path : "unknown",
        message: error.msg,
      }));

      // Return validation error response
      return ApiResponseHandler.error(
        res,
        Messages.VALIDATION_ERROR,
        HttpStatus.UNPROCESSABLE_ENTITY,
        { errors: formattedErrors },
      );
    };
  }
}
