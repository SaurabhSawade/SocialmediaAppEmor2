import { Router } from 'express';
import { CommentController } from '../../controllers/comment.controller';
import { AuthMiddleware } from '../../middlewares/auth.middleware';
import { ValidationMiddleware } from '../../middlewares/validation.middleware';
import {
  createCommentValidation,
  updateCommentValidation,
} from '../../validations/comment.validation';

const router = Router();

router.use(AuthMiddleware.authenticate);

router.post(
  '/posts/:postId/comments',
  ValidationMiddleware.validate(createCommentValidation),
  CommentController.addComment
);

router.get('/posts/:postId/comments', CommentController.getPostComments);

router.put(
  '/comments/:commentId',
  ValidationMiddleware.validate(updateCommentValidation),
  CommentController.updateComment
);

router.delete('/comments/:commentId', CommentController.deleteComment);
router.post('/comments/:commentId/like', CommentController.likeComment);

export default router;