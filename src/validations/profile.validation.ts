import { body, ValidationChain } from "express-validator";

export const updateProfileValidation: ValidationChain[] = [
  body("username")
    .optional()
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

  body("bio")
    .optional()
    .isLength({ max: 500 })
    .withMessage("Bio cannot exceed 500 characters")
    .trim(),

  body("avatarUrl").optional().isURL().withMessage("Invalid URL format").trim(),
];
