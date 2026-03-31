import { Request, Response, NextFunction } from "express";
import { validationResult, ValidationChain } from "express-validator";
import { ApiResponseHandler } from "../utils/api-response";
import { HttpStatus } from "../constants/http-status";
import { Messages } from "../constants/messages";

export class ValidationMiddleware {
  static validate(validations: ValidationChain[]) {
    return async (req: Request, res: Response, next: NextFunction) => {
      try {
        // Run all validations
        await Promise.all(validations.map((validation) => validation.run(req)));

        // Get validation errors
        const errors = validationResult(req);

        if (errors.isEmpty()) {
          return next();
        }

        // Format errors properly
        const formattedErrors = errors.array().map((error: any) => {
          return {
            field: error.param || error.path || "unknown",
            message: error.msg,
            location: error.location || "body",
          };
        });

        // Debug log (very useful during development)
        console.log("VALIDATION ERRORS:", errors.array());

        // Return structured response with first error message as main message
        const firstError = formattedErrors[0];
        return ApiResponseHandler.error(
          res,
          firstError.message,
          HttpStatus.UNPROCESSABLE_ENTITY,
        );
      } catch (err) {
        // Safety fallback if validation itself crashes
        console.error("Validation Middleware Crash:", err);

        return ApiResponseHandler.error(
          res,
          "Validation processing failed",
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }
    };
  }
}

// import { Request, Response, NextFunction } from "express";
// import { validationResult, ValidationChain } from "express-validator";
// import { ApiResponseHandler } from "../utils/api-response";
// import { HttpStatus } from "../constants/http-status";
// import { Messages } from "../constants/messages";

// export class ValidationMiddleware {
//   static validate(validations: ValidationChain[]) {
//     return async (req: Request, res: Response, next: NextFunction) => {
//       // Execute all validations
//       await Promise.all(validations.map((validation) => validation.run(req)));

//       // Check for validation errors
//       const errors = validationResult(req);

//       if (errors.isEmpty()) {
//         return next();
//       }

//       // Format errors
//       const formattedErrors = errors.array().map((error) => ({
//         field: error.type === "field" ? error.path : "unknown",
//         message: error.msg,
//       }));
//       console.log(errors.array());
//       // Return validation error response
//       return ApiResponseHandler.error(
//         res,
//         Messages.VALIDATION_ERROR,
//         HttpStatus.UNPROCESSABLE_ENTITY,
//         { errors: formattedErrors },
//       );
//     };
//   }
// }
