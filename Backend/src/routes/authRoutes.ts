import express from "express";
import { registerStudent, loginUser, createTeacher, approveStudent } from "../controllers/authController";
import { protect, adminOnly } from "../middleware/authMiddleware";

const router = express.Router();

router.post("/register/student", registerStudent);
router.post("/login", loginUser);

// Admin only routes
router.post("/create/teacher", protect, adminOnly, createTeacher);
router.put("/approve/student/:studentId", protect, adminOnly, approveStudent);

export default router;


