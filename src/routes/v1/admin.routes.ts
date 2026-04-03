import { Router } from 'express';
import AdminController from '../../controllers/admin.controller';
import { AdminUserController } from '../../controllers/admin.user.controller';
import { AuthMiddleware } from '../../middlewares/auth.middleware';
import { RoleMiddleware } from '../../middlewares/role.middleware';

const router = Router();

// All admin routes require authentication AND admin role
router.use(AuthMiddleware.authenticate);
router.use(RoleMiddleware.isAdmin);

// Dashboard statistics
router.get('/stats',AuthMiddleware.authenticate,RoleMiddleware.isAdmin, AdminController.getAdminStats);

// User management
router.get('/users',AuthMiddleware.authenticate,RoleMiddleware.isAdmin, AdminController.getAllUsers);
router.get('/users/export',AuthMiddleware.authenticate,RoleMiddleware.isAdmin, AdminController.exportUsersToCSV);

// Admin user management
router.get('/users/admins',AuthMiddleware.authenticate,RoleMiddleware.isAdmin, AdminUserController.getAdminUsers);
router.put('/users/:userId/make-admin',AuthMiddleware.authenticate,RoleMiddleware.isAdmin, AdminUserController.makeAdmin);
router.put('/users/:userId/remove-admin',AuthMiddleware.authenticate,RoleMiddleware.isAdmin,     AdminUserController.removeAdmin);

export default router;