import { Router } from "express";
import { UserController } from "../../controllers/user.controller";
import { AuthMiddleware } from "../../middlewares/auth.middleware";

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Users
 *   description: User management endpoints
 */

/**
 * @swagger
 * /users/profile:
 *   get:
 *     summary: Get user profile
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Profile retrieved successfully
 */
router.get("/profile", AuthMiddleware.authenticate, UserController.getProfile);

/**
 * @swagger
 * /users/account:
 *   delete:
 *     summary: Delete user account (soft delete)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Account deleted successfully
 */
router.delete(
  "/account",
  AuthMiddleware.authenticate,
  UserController.deleteAccount,
);

export default router;
