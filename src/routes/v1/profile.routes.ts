import { Router } from "express";
import { ProfileController } from "../../controllers/profile.controller";
import { AuthMiddleware } from "../../middlewares/auth.middleware";
import { ValidationMiddleware } from "../../middlewares/validation.middleware";
import { updateProfileValidation } from "../../validations/profile.validation";

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Profile
 *   description: Profile management endpoints
 */

/**
 * @swagger
 * /profile:
 *   put:
 *     summary: Update user profile
 *     tags: [Profile]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *               fullName:
 *                 type: string
 *               bio:
 *                 type: string
 *               avatarUrl:
 *                 type: string
 *     responses:
 *       200:
 *         description: Profile updated successfully
 */
router.put(
  "/profile",
  AuthMiddleware.authenticate,
  ValidationMiddleware.validate(updateProfileValidation),
  ProfileController.updateProfile,
);

/**
 * @swagger
 * /profile/{username}:
 *   get:
 *     summary: Get profile by username
 *     tags: [Profile]
 *     parameters:
 *       - in: path
 *         name: username
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Profile retrieved successfully
 */
router.get("/profile/:username", ProfileController.getProfileByUsername);

export default router;
