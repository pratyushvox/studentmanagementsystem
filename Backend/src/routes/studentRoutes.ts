import express from "express";
import { protect } from "../middleware/authMiddleware";
import { upload } from "../middleware/uploadMiddleware";

// Dashboard
import { 
  getStudentDashboard,
  getAcademicHistory 
} from "../controllers/Student/dashboardcontroller";

// Assignments
import {
  getAssignmentsForStudent,
  getAssignmentById
} from "../controllers/Student/assignmentcontroller";

// Submissions
import {
  submitAssignment,
  getMySubmissions,
  getSubmissionById
} from "../controllers/Student/submissioncontroller";

// Posts
import {
  getPostsForStudent,
  getPostById
} from "../controllers/Student/postcontroller";

const router = express.Router();

// ============ DASHBOARD ============
router.get("/dashboard", protect, getStudentDashboard);
router.get("/academic-history", protect, getAcademicHistory);

// ============ ASSIGNMENTS ============
router.get("/assignments", protect, getAssignmentsForStudent);
router.get("/assignments/:assignmentId", protect, getAssignmentById);

// ============ SUBMISSIONS ============
router.post(
  "/assignments/submit",
  protect,
  upload.single("file"),
  submitAssignment
);
router.get("/submissions", protect, getMySubmissions);
router.get("/submissions/:submissionId", protect, getSubmissionById);

// ============ POSTS ============
router.get("/posts", protect, getPostsForStudent);
router.get("/posts/:postId", protect, getPostById);

export default router;
