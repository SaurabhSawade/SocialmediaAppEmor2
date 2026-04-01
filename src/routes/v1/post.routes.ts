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

// All post routes require authentication
router.use(AuthMiddleware.authenticate);

router.post(
  '/',
  uploadMultipleMedia.array('media', 10),
  ValidationMiddleware.validate(createPostValidation),
  PostController.createPost
);

router.get(
  '/feed', 
  ValidationMiddleware.validate(getFeedValidation),
  PostController.getFeed
);

router.get('/:postId', PostController.getPost);
router.put('/:postId', 
  ValidationMiddleware.validate(updatePostValidation),
  PostController.updatePost
);
router.delete('/:postId', PostController.deletePost);
router.post('/:postId/archive', PostController.archivePost);
router.post('/:postId/like', PostController.likePost);

export default router;