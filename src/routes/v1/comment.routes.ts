import { Router } from 'express';
import { CommentController } from '../../controllers/comment.controller';
import { AuthMiddleware } from '../../middlewares/auth.middleware';
import { ValidationMiddleware } from '../../middlewares/validation.middleware';
import {
  createCommentValidation,
  updateCommentValidation,
} from '../../validations/comment.validation';

const router = Router();

// router.use(AuthMiddleware.authenticate);// All comment routes require authentication but not follow in industry

router.post(
  '/posts/:postId/comments',
  AuthMiddleware.authenticate,
  ValidationMiddleware.validate(createCommentValidation),
  CommentController.addComment
);

router.get('/posts/:postId/comments', AuthMiddleware.authenticate, CommentController.getPostComments);

router.get('/comments/:commentId', AuthMiddleware.authenticate, CommentController.getComment);

router.put(
  '/comments/:commentId',
  ValidationMiddleware.validate(updateCommentValidation),
  AuthMiddleware.authenticate,  
  CommentController.updateComment
);

router.delete('/comments/:commentId', AuthMiddleware.authenticate, CommentController.deleteComment);
router.post('/comments/:commentId/like', AuthMiddleware.authenticate, CommentController.likeComment);

export default router;