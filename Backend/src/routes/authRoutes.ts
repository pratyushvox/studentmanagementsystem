import express from "express";
import { protect } from "../middleware/authMiddleware";
import {
  registerStudent,
  loginUser,
  getMyProfile,
  updateMyProfile,
  changePassword
} from "../controllers/authController";

const router = express.Router();

// Public routes
router.post("/register/student", registerStudent);
router.post("/login", loginUser);

// Protected routes
router.get("/profile", protect, getMyProfile);
router.put("/profile", protect, updateMyProfile);
router.put("/change-password", protect, changePassword);

export default router;