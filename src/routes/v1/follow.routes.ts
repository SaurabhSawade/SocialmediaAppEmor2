import { Router } from 'express';
import FollowController from '../../controllers/follow.controller';
import { AuthMiddleware } from '../../middlewares/auth.middleware';
import { ValidationMiddleware } from '../../middlewares/validation.middleware';
import {
  followUserValidation,
  getFollowersValidation,
  getFollowingValidation,
  checkFollowStatusValidation,
} from '../../validations/follow.validation';

const router = Router();

// Follow/Unfollow user
router.post(
  '/users/:userId/follow',
  AuthMiddleware.authenticate,
  ValidationMiddleware.validate(followUserValidation),
  FollowController.followUser
);

// Get followers
router.get(
  '/users/:userId/followers',
  AuthMiddleware.authenticate,
  ValidationMiddleware.validate(getFollowersValidation),
  FollowController.getFollowers
);

// Get following
router.get(
  '/users/:userId/following',
  AuthMiddleware.authenticate,
  ValidationMiddleware.validate(getFollowingValidation),
  FollowController.getFollowing
);

// Get follow stats
router.get(
  '/users/:userId/stats',
  AuthMiddleware.authenticate,
  ValidationMiddleware.validate(getFollowersValidation),
  FollowController.getFollowStats
);

// Check follow status
router.get(
  '/users/:userId/follow-status',
  AuthMiddleware.authenticate,
  ValidationMiddleware.validate(checkFollowStatusValidation),
  FollowController.checkFollowStatus
);

// Get mutual followers
router.get(
  '/users/:userId/mutual-followers',
  AuthMiddleware.authenticate,
  ValidationMiddleware.validate(checkFollowStatusValidation),
  FollowController.getMutualFollowers
);

// Get follow suggestions
router.get(
  '/users/suggestions/follow',
  AuthMiddleware.authenticate,
  FollowController.getFollowSuggestions
);

export default router;