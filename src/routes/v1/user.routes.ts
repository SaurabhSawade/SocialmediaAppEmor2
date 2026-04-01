import { Router } from 'express';
import { UserController } from '../../controllers/user.controller';
import { AuthMiddleware } from '../../middlewares/auth.middleware';
import { ValidationMiddleware } from '../../middlewares/validation.middleware';
import {
  updateProfileValidation,
  updateSettingsValidation,
  changeEmailValidation,
  changePhoneValidation,
  deleteAccountValidation,
  updateAvatarValidation,
  getPublicProfileValidation,
} from '../../validations/user.validation';

const router = Router();

// Public routes (no auth required)
router.get('/:username',
  ValidationMiddleware.validate(getPublicProfileValidation),
  UserController.getPublicProfile
);

router.get('/:userId/stats', UserController.getUserStats);

// Protected routes (auth required)
router.use(AuthMiddleware.authenticate);
router.get('/profile', UserController.getProfile);
router.put('/profile', 
  ValidationMiddleware.validate(updateProfileValidation),
  UserController.updateProfile
);

// Avatar routes
router.post('/avatar',
  ValidationMiddleware.validate(updateAvatarValidation),
  UserController.updateAvatar
);
router.delete('/avatar', UserController.removeAvatar);

// Settings routes
router.put('/settings',
  ValidationMiddleware.validate(updateSettingsValidation),
  UserController.updateSettings
);

// Email and phone change routes
router.post('/change-email',
  ValidationMiddleware.validate(changeEmailValidation),
  UserController.changeEmail
);
router.post('/change-phone',
  ValidationMiddleware.validate(changePhoneValidation),
  UserController.changePhone
);

// Account deletion
router.delete('/account',
  ValidationMiddleware.validate(deleteAccountValidation),
  UserController.deleteAccount
);

export default router;
