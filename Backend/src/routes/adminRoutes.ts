import express from "express";
import { protect, adminOnly } from "../middleware/authMiddleware";
import { approveTeacherEdit, rejectTeacherEdit } from "../controllers/admincontroller";

const router = express.Router();
router.put("/teacher/approve/:requestId", protect, adminOnly, approveTeacherEdit);
router.put("/teacher/reject/:requestId", protect, adminOnly, rejectTeacherEdit);
export default router;
