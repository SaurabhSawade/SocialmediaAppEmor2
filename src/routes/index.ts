import { Router } from "express";
import authRoutes from "./v1/auth.routes";
import userRoutes from "./v1/user.routes";
import profileRoutes from "./v1/profile.routes";
import postRoutes from "./v1/post.routes";
import commentRoutes from "./v1/comment.routes";

const router = Router();

// Mount routes
router.use("/auth", authRoutes);
router.use("/users", userRoutes);
router.use("/posts", postRoutes);
router.use("/", profileRoutes);
router.use("/", commentRoutes);

export default router;
