import { body, param, ValidationChain } from "express-validator";
import { Helpers } from "../utils/helpers";
import { AppError } from "../utils/app-error";

export const registerValidation: ValidationChain[] = [
  body().custom((value, { req }) => {
    if (!req.body.email && !req.body.phone) {
      return new AppError("Either email or phone is required");
    }
    return true;
  }),

  body("email")
    .optional()
    .isEmail()
    .withMessage("Invalid email format")
    .normalizeEmail(),

  body("phone")
    .optional()
    .matches(/^[0-9]{10,15}$/)
    .withMessage("Phone must be 10-15 digits")
    .trim(),

  body("password")
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters")
    .custom(Helpers.isValidPassword)
    .withMessage(
      "Password must contain uppercase, lowercase, number, and special character",
    ),

  body("username")
    .isLength({ min: 3, max: 50 })
    .withMessage("Username must be 3-50 characters")
    .matches(/^[a-zA-Z0-9_.]+$/)
    .withMessage(
      "Username can only contain letters, numbers, underscores, and dots",
    )
    .trim()
    .toLowerCase(),

  body("fullName")
    .optional()
    .isLength({ max: 100 })
    .withMessage("Full name cannot exceed 100 characters")
    .trim(),
];

export const loginValidation: ValidationChain[] = [
  body("identifier")
    .notEmpty()
    .withMessage("Email or phone is required")
    .trim()
    .toLowerCase(),

  body("password").notEmpty().withMessage("Password is required"),
];

export const otpValidation: ValidationChain[] = [
  body("identifier")
    .notEmpty()
    .withMessage("Email or phone is required")
    .trim(),

  body("otp")
    .isLength({ min: 6, max: 6 })
    .withMessage("OTP must be 6 digits")
    .isNumeric()
    .withMessage("OTP must be numeric")
    .trim(),
];

export const forgotPasswordValidation: ValidationChain[] = [
  body("identifier")
    .notEmpty()
    .withMessage("Email or phone is required")
    .trim(),
];


// import { body, ValidationChain } from "express-validator";
// import { Helpers } from "../utils/helpers";

export const resetPasswordValidation: ValidationChain[] = [
  // ✅ Identifier (email or phone) required
  body("identifier")
    .notEmpty()
    .withMessage("Identifier (email or phone) is required")
    .custom((value) => {
      // Basic email validation if it looks like an email
      if (value.includes('@')) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) {
          return new AppError("Invalid email format");
        }
      } else {
        // Phone validation
        if (!/^[0-9]{10,15}$/.test(value)) {
          return new AppError("Phone must be 10-15 digits");
        }
      }
      return true;
    }),

  // ✅ OTP validation
  body("otp")
    .notEmpty()
    .withMessage("OTP is required")
    .isLength({ min: 6, max: 6 })
    .withMessage("OTP must be 6 digits")
    .isNumeric()
    .withMessage("OTP must be numeric"),

  // ✅ New password
  body("newPassword")
    .notEmpty()
    .withMessage("New password is required")
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters")
    .custom(Helpers.isValidPassword)
    .withMessage(
      "Password must contain uppercase, lowercase, number, and special character"
    ),

  // ✅ Confirm password
  body("confirmPassword")
    .notEmpty()
    .withMessage("Confirm password is required")
    .custom((value, { req }) => {
      if (value !== req.body.newPassword) {
        return new AppError("Passwords do not match");
      }
      return true;
    }),
];
// export const resetPasswordValidation: ValidationChain[] = [
//   body("mobile")
//     .notEmpty()
//     .withMessage("Email or phone is required")
//     .trim(),
//     body("countryCode")
//     .notEmpty()
//     .withMessage("Email or phone is required")
//     .trim(),
//       body("email")
//     .notEmpty()
//     .withMessage("Email or phone is required")
//     .trim(),
//   body("otp")
//     .isLength({ min: 6, max: 6 })
//     .withMessage("OTP must be 6 digits")
//     .isNumeric()
//     .withMessage("OTP must be numeric")
//     .trim(),

//   body("newPassword")
//     .isLength({ min: 8 })
//     .withMessage("Password must be at least 8 characters")
//     .custom(Helpers.isValidPassword)
//     .withMessage(
//       "Password must contain uppercase, lowercase, number, and special character",
//     ),

//   body("confirmPassword").custom((value, { req }) => {
//     if (value !== req.body.newPassword) {
//       return new AppError("Passwords do not match");
//     }
//     return true;
//   }),
// ];

export const changePasswordValidation: ValidationChain[] = [
  body("currentPassword")
    .notEmpty()
    .withMessage("Current password is required"),

  body("newPassword")
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters")
    .custom(Helpers.isValidPassword)
    .withMessage(
      "Password must contain uppercase, lowercase, number, and special character",
    ),

  body("confirmPassword").custom((value, { req }) => {
    if (value !== req.body.newPassword) {
      return new AppError("Passwords do not match");
    }
    return true;
  }),
];

export const logoutValidation = [
  body('refreshToken')
    .notEmpty()
    .withMessage('Refresh token is required')
    .isJWT()
    .withMessage('Invalid refresh token format'),
  
  body('logoutAll')
    .optional()
    .isBoolean()
    .withMessage('logoutAll must be a boolean'),
];

export const refreshTokenValidation = [
  body('refreshToken')
    .notEmpty()
    .withMessage('Refresh token is required')
    .isJWT()
    .withMessage('Invalid refresh token format'),
];

export const revokeSessionValidation = [
  param('sessionId')
    .notEmpty()
    .withMessage('Session ID is required')
    .isString()
    .withMessage('Invalid session ID'),
];

export const changeEmailValidation: ValidationChain[] = [
  body("currentPassword")
    .notEmpty()
    .withMessage("Current password is required"),

  body("newEmail")
    .notEmpty()
    .withMessage("New email is required")
    .matches(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)
    .withMessage("Invalid email format")
    .normalizeEmail(),
];