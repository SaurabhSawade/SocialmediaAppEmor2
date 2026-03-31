import { Router } from 'express';
import { AuthController } from '../../controllers/auth.controller';
import { AuthMiddleware } from '../../middlewares/auth.middleware';
import { ValidationMiddleware } from '../../middlewares/validation.middleware';
import { authRateLimiter } from '../../middlewares/rate-limit.middleware';
import {
  registerValidation,
  loginValidation,
  otpValidation,
  forgotPasswordValidation,
  resetPasswordValidation,
  changePasswordValidation,
  logoutValidation,
  refreshTokenValidation,
  revokeSessionValidation,
} from '../../validations/auth.validation';

const router = Router();

// Public routes
router.post('/register', authRateLimiter, ValidationMiddleware.validate(registerValidation), AuthController.register);
router.post('/login', authRateLimiter, ValidationMiddleware.validate(loginValidation), AuthController.login);
router.post('/resend-otp', authRateLimiter, ValidationMiddleware.validate(forgotPasswordValidation), AuthController.resendOTP);
router.post('/verify-otp', authRateLimiter, ValidationMiddleware.validate(otpValidation), AuthController.verifyOTP);
router.post('/forgot-password', authRateLimiter, ValidationMiddleware.validate(forgotPasswordValidation), AuthController.forgotPassword);
router.post('/reset-password', authRateLimiter, ValidationMiddleware.validate(resetPasswordValidation), AuthController.resetPassword);
router.post('/refresh-token', authRateLimiter, ValidationMiddleware.validate(refreshTokenValidation), AuthController.refreshToken);

// Protected routes
router.post('/change-password', AuthMiddleware.authenticate, ValidationMiddleware.validate(changePasswordValidation), AuthController.changePassword);
router.post('/logout', AuthMiddleware.authenticate, ValidationMiddleware.validate(logoutValidation), AuthController.logout);
router.get('/sessions', AuthMiddleware.authenticate, AuthController.getSessions);
router.delete('/sessions/:sessionId', AuthMiddleware.authenticate, ValidationMiddleware.validate(revokeSessionValidation), AuthController.revokeSession);
router.get('/me', AuthMiddleware.authenticate, AuthController.getMe);

export default router;