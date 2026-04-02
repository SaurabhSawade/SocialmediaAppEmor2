import { Router } from 'express';
import { PostController } from '../../controllers/post.controller';
import { AuthMiddleware } from '../../middlewares/auth.middleware';
import { ValidationMiddleware } from '../../middlewares/validation.middleware';
import { uploadMultipleMedia } from '../../config/multer';
import {
  createPostValidation,
  updatePostValidation,
  getFeedValidation,
} from '../../validations/post.validation';

const router = Router();

// All post routes require authentication but not follow in industry
// router.use(AuthMiddleware.authenticate);

router.post(
  '/',
  uploadMultipleMedia.array('media', 10),
  AuthMiddleware.authenticate,
  ValidationMiddleware.validate(createPostValidation),
  PostController.createPost
);

router.get(
  '/feed', 
  ValidationMiddleware.validate(getFeedValidation),
  AuthMiddleware.authenticate,
  PostController.getFeed
);

router.get('/:postId',AuthMiddleware.authenticate, PostController.getPost);
router.put('/:postId', 
  ValidationMiddleware.validate(updatePostValidation),
  AuthMiddleware.authenticate,
  PostController.updatePost
);
router.delete('/:postId', AuthMiddleware.authenticate, PostController.deletePost);
router.post('/:postId/archive', AuthMiddleware.authenticate, PostController.archivePost);
router.post('/:postId/like', AuthMiddleware.authenticate, PostController.likePost);

export default router;