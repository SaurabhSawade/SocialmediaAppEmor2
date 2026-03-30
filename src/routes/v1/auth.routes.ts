import { Router } from "express";
import { AuthController } from "../../controllers/auth.controller";
import { AuthMiddleware } from "../../middlewares/auth.middleware";
import { ValidationMiddleware } from "../../middlewares/validation.middleware";
import { authRateLimiter } from "../../middlewares/rate-limit.middleware";
import {
  registerValidation,
  loginValidation,
  otpValidation,
  forgotPasswordValidation,
  resetPasswordValidation,
  changePasswordValidation,
} from "../../validations/auth.validation";

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Authentication
 *   description: Authentication endpoints
 */

/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *               phone:
 *                 type: string
 *               password:
 *                 type: string
 *               username:
 *                 type: string
 *               fullName:
 *                 type: string
 *     responses:
 *       201:
 *         description: User registered successfully
 */
router.post(
  "/register",
  authRateLimiter,
  ValidationMiddleware.validate(registerValidation),
  AuthController.register,
);

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Login user
 *     tags: [Authentication]
 */
router.post(
  "/login",
  authRateLimiter,
  ValidationMiddleware.validate(loginValidation),
  AuthController.login,
);

/**
 * @swagger
 * /auth/resend-otp:
 *   post:
 *     summary: Resend OTP for verification
 *     tags: [Authentication]
 */
router.post(
  "/resend-otp",
  authRateLimiter,
  ValidationMiddleware.validate(forgotPasswordValidation),
  AuthController.resendOTP,
);

/**
 * @swagger
 * /auth/verify-otp:
 *   post:
 *     summary: Verify OTP
 *     tags: [Authentication]
 */
router.post(
  "/verify-otp",
  authRateLimiter,
  ValidationMiddleware.validate(otpValidation),
  AuthController.verifyOTP,
);

/**
 * @swagger
 * /auth/forgot-password:
 *   post:
 *     summary: Request password reset
 *     tags: [Authentication]
 */
router.post(
  "/forgot-password",
  authRateLimiter,
  ValidationMiddleware.validate(forgotPasswordValidation),
  AuthController.forgotPassword,
);

/**
 * @swagger
 * /auth/reset-password:
 *   post:
 *     summary: Reset password with OTP
 *     tags: [Authentication]
 */
router.post(
  "/reset-password",
  authRateLimiter,
  ValidationMiddleware.validate(resetPasswordValidation),
  AuthController.resetPassword,
);

/**
 * @swagger
 * /auth/refresh-token:
 *   post:
 *     summary: Refresh access token
 *     tags: [Authentication]
 */
router.post("/refresh-token", authRateLimiter, AuthController.refreshToken);

/**
 * @swagger
 * /auth/change-password:
 *   post:
 *     summary: Change password (authenticated)
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 */
router.post(
  "/change-password",
  AuthMiddleware.authenticate,
  ValidationMiddleware.validate(changePasswordValidation),
  AuthController.changePassword,
);

/**
 * @swagger
 * /auth/logout:
 *   post:
 *     summary: Logout user
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 */
router.post("/logout", AuthMiddleware.authenticate, AuthController.logout);

/**
 * @swagger
 * /auth/me:
 *   get:
 *     summary: Get current authenticated user
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 */
router.get("/me", AuthMiddleware.authenticate, AuthController.getMe);

export default router;
