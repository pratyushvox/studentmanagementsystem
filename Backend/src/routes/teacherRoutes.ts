import express from "express";
import { protect, teacherOnly } from "../middleware/authMiddleware";
import { upload } from "../middleware/uploadMiddleware";

// Dashboard
import { getTeacherDashboard } from "../controllers/Teacher/dashboardController";

// Assignment Management
import {
  createAssignment,
  getMyAssignments,
  getMyAssignmentById,
  updateAssignment,
  deleteAssignment
} from "../controllers/Teacher/assignmentController";

// Submission & Grading
import {
  getAssignmentSubmissions,
  getSubmissionById,
  gradeSubmission
} from "../controllers/Teacher/submissionController";

// Post Management
import {
  createPost,
  getMyPosts,
  getMyPostById,
  updatePost,
  deletePost
} from "../controllers/Teacher/postController";

const router = express.Router();

// ============ DASHBOARD ============
router.get("/dashboard", protect, teacherOnly, getTeacherDashboard);

// ============ ASSIGNMENT MANAGEMENT ============
router.post(
  "/assignments",
  protect,
  teacherOnly,
  upload.single("file"),
  createAssignment
);
router.get("/assignments", protect, teacherOnly, getMyAssignments);
router.get("/assignments/:assignmentId", protect, teacherOnly, getMyAssignmentById);
router.put(
  "/assignments/:assignmentId",
  protect,
  teacherOnly,
  updateAssignment
);
router.delete("/assignments/:assignmentId", protect, teacherOnly, deleteAssignment);

// ============ SUBMISSION & GRADING ============
router.get(
  "/assignments/:assignmentId/submissions",
  protect,
  teacherOnly,
  getAssignmentSubmissions
);
router.get(
  "/submissions/:submissionId",
  protect,
  teacherOnly,
  getSubmissionById
);
router.put(
  "/submissions/:submissionId/grade",
  protect,
  teacherOnly,
  gradeSubmission
);

// ============ POST MANAGEMENT ============
router.post(
  "/posts",
  protect,
  teacherOnly,
  
  upload.single("file"),
  createPost
);
router.get("/posts", protect, teacherOnly, getMyPosts);
router.get("/posts/:postId", protect, teacherOnly, getMyPostById);
router.put("/posts/:postId", protect, teacherOnly, updatePost);
router.delete("/posts/:postId", protect, teacherOnly, deletePost);

export default router;
