import { body, ValidationChain } from "express-validator";
import { Helpers } from "../utils/helpers";

export const registerValidation: ValidationChain[] = [
  body().custom((value, { req }) => {
    if (!req.body.email && !req.body.phone) {
      throw new Error("Either email or phone is required");
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

export const resetPasswordValidation: ValidationChain[] = [
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

  body("newPassword")
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters")
    .custom(Helpers.isValidPassword)
    .withMessage(
      "Password must contain uppercase, lowercase, number, and special character",
    ),

  body("confirmPassword").custom((value, { req }) => {
    if (value !== req.body.newPassword) {
      throw new Error("Passwords do not match");
    }
    return true;
  }),
];

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
      throw new Error("Passwords do not match");
    }
    return true;
  }),
];
