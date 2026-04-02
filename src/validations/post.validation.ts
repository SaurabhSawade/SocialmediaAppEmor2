import { body, query } from 'express-validator';
import { AppError } from "../utils/app-error";

export const createPostValidation = [
  body('data')
    .optional()
    .custom((value, { req }) => {
      if (value) {
        try {
          JSON.parse(value);
        } catch (e) {
          return new AppError('Invalid JSON data');
        }
      }
      return true;
    }),
  
  body('caption')
    .optional()
    .isLength({ max: 2200 })
    .withMessage('Caption cannot exceed 2200 characters')
    .trim(),
  
  body('location')
    .optional()
    .isLength({ max: 100 })
    .withMessage('Location cannot exceed 100 characters')
    .trim(),
];

export const updatePostValidation = [
  body('caption')
    .optional()
    .isLength({ max: 2200 })
    .withMessage('Caption cannot exceed 2200 characters')
    .trim(),
  
  body('location')
    .optional()
    .isLength({ max: 100 })
    .withMessage('Location cannot exceed 100 characters')
    .trim(),
  
];

export const getFeedValidation = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer')
    .toInt(),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage('Limit must be between 1 and 50')
    .toInt(),
];