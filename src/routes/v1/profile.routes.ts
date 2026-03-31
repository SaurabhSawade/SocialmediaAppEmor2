import { Router } from 'express';
import { ProfileController } from '../../controllers/profile.controller';
import { AuthMiddleware } from '../../middlewares/auth.middleware';
import { ValidationMiddleware } from '../../middlewares/validation.middleware';
import { updateProfileValidation, checkUsernameValidation } from '../../validations/user.validation';

const router = Router();

// Public routes
router.get('/profile/:username', ProfileController.getProfileByUsername);
router.get('/check-username/:username', 
  ValidationMiddleware.validate(checkUsernameValidation),
  ProfileController.checkUsername
);

// Protected routes
router.put('/profile', 
  AuthMiddleware.authenticate,
  ValidationMiddleware.validate(updateProfileValidation),
  ProfileController.updateProfile
);
router.get('/profile/me', 
  AuthMiddleware.authenticate,
  ProfileController.getMyProfile
);

export default router;