import { Router } from "express";
import authRoutes from "./v1/auth.routes";
import userRoutes from "./v1/user.routes";
import profileRoutes from "./v1/profile.routes";

const router = Router();

// Mount routes
router.use("/auth", authRoutes);
router.use("/users", userRoutes);
router.use("/", profileRoutes);

export default router;
