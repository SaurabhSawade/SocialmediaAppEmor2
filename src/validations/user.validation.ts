import { body, param, query } from 'express-validator';
import { Helpers } from '../utils/helpers';

export const updateProfileValidation = [
  body('username')
    .optional()
    .isLength({ min: 3, max: 50 })
    .withMessage('Username must be between 3 and 50 characters')
    .matches(/^[a-zA-Z0-9_.]+$/)
    .withMessage('Username can only contain letters, numbers, underscores, and dots')
    .trim()
    .toLowerCase(),
  
  body('fullName')
    .optional()
    .isLength({ max: 100 })
    .withMessage('Full name cannot exceed 100 characters')
    .trim(),
  
  body('bio')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Bio cannot exceed 500 characters')
    .trim(),
  
  body('avatarUrl')
    .optional()
    .isURL()
    .withMessage('Invalid URL format')
    .trim(),
  
  body('website')
    .optional()
    .isURL()
    .withMessage('Invalid website URL')
    .trim(),
  
  body('gender')
    .optional()
    .isIn(['male', 'female', 'other', 'prefer_not_to_say'])
    .withMessage('Gender must be one of: male, female, other, prefer_not_to_say'),
  
  body('isPrivate')
    .optional()
    .isBoolean()
    .withMessage('isPrivate must be a boolean'),
];

export const updateSettingsValidation = [
  body('emailNotifications')
    .optional()
    .isBoolean()
    .withMessage('emailNotifications must be a boolean'),
  
  body('pushNotifications')
    .optional()
    .isBoolean()
    .withMessage('pushNotifications must be a boolean'),
];

export const changeEmailValidation = [
  body('newEmail')
    .isEmail()
    .withMessage('Invalid email format')
    .normalizeEmail(),
  
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
  
  body('otp')
    .optional()
    .isLength({ min: 6, max: 6 })
    .withMessage('OTP must be 6 digits')
    .isNumeric()
    .withMessage('OTP must be numeric'),
];

export const changePhoneValidation = [
  body('newPhone')
    .matches(/^[0-9]{10,15}$/)
    .withMessage('Phone number must be 10-15 digits')
    .trim(),
  
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
  
  body('otp')
    .optional()
    .isLength({ min: 6, max: 6 })
    .withMessage('OTP must be 6 digits')
    .isNumeric()
    .withMessage('OTP must be numeric'),
];

export const deleteAccountValidation = [
  body('password')
    .notEmpty()
    .withMessage('Password is required to delete account'),
];

export const updateAvatarValidation = [
  body('avatarUrl')
    .isURL()
    .withMessage('Invalid avatar URL')
    .trim(),
  
  body('avatarKey')
    .optional()
    .isString()
    .withMessage('Invalid avatar key'),
];

export const getPublicProfileValidation = [
  param('username')
    .isLength({ min: 3, max: 50 })
    .withMessage('Invalid username')
    .matches(/^[a-zA-Z0-9_.]+$/)
    .withMessage('Invalid username format'),
];

export const checkUsernameValidation = [
  param('username')
    .isLength({ min: 3, max: 50 })
    .withMessage('Username must be between 3 and 50 characters')
    .matches(/^[a-zA-Z0-9_.]+$/)
    .withMessage('Invalid username format'),
];