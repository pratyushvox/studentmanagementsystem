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

// Post Management (Course Materials)
import {
  createPost,
  getMyPosts,
  getMyPostById,
  updatePost,
  deletePost
} from "../controllers/Teacher/postController";

// Notice
import { getTeacherNotices } from "../controllers/Teacher/noticeController";

// Analytics & Progress Tracking (NEW)
import {
  getWeeklyProgress,
  getStudentPerformance,
  getRecentActivity
} from "../controllers/Teacher/analyticsController";

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

// ============ COURSE MATERIALS (POSTS) ============
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

// ============ NOTICES ============
router.get("/notices", protect, teacherOnly, getTeacherNotices);

// ============ ANALYTICS & PROGRESS TRACKING (NEW) 
// Get weekly assignment progress/flow
router.get("/analytics/weekly-progress", protect, teacherOnly, getWeeklyProgress);

// Get student performance by subject/group
router.get("/analytics/student-performance", protect, teacherOnly, getStudentPerformance);

// Get recent activity feed for dashboard
router.get("/analytics/recent-activity", protect, teacherOnly, getRecentActivity);

export default router;