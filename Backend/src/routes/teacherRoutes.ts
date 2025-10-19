import express from "express";
import { protect, teacherOnly } from "../middleware/authMiddleware";
import { upload } from "../middleware/uploadMiddleware";

// Dashboard
import { getTeacherDashboard } from "../controllers/Teacher/dashboardController";

// Assignment Management (from your assignment controller)
import {
  createAssignment,
  getMyAssignments,
  getMyAssignmentById,
  updateAssignment,
  deleteAssignment,
  getMyAssignmentStatistics
} from "../controllers/Teacher/assignmentController";

// Submission & Grading (from your assignment controller)
import {
  getSubmissionsForGrading,
  gradeSubmission
} from "../controllers/Teacher/assignmentController";

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

// Analytics & Progress Tracking
import {
  getWeeklyProgress,
  getStudentPerformance,
  getRecentActivity
} from "../controllers/Teacher/analyticsController";

const router = express.Router();

/* ============================================================
 📊 DASHBOARD
============================================================ */
router.get("/dashboard", protect, teacherOnly, getTeacherDashboard);

/* ============================================================
 📘 ASSIGNMENT MANAGEMENT
============================================================ */
// Statistics
router.get("/assignments/statistics", protect, teacherOnly, getMyAssignmentStatistics);

// Create assignment (Main = Module Leader, Weekly = Regular Teacher)
router.post(
  "/assignments",
  protect,
  teacherOnly,
  upload.single("file"),
  createAssignment
);

// Get all my assignments
router.get("/assignments", protect, teacherOnly, getMyAssignments);

// Get specific assignment with details
router.get("/assignments/:assignmentId", protect, teacherOnly, getMyAssignmentById);

// Update assignment
router.put(
  "/assignments/:assignmentId",
  protect,
  teacherOnly,
  updateAssignment
);

// Delete assignment
router.delete("/assignments/:assignmentId", protect, teacherOnly, deleteAssignment);

/* ============================================================
 🧾 SUBMISSION & GRADING
============================================================ */
// Get submissions for grading (includes main assignments from module leader)
router.get(
  "/submissions/for-grading",
  protect,
  teacherOnly,
  getSubmissionsForGrading
);

// Grade a submission
router.patch(
  "/submissions/:submissionId/grade",
  protect,
  teacherOnly,
  gradeSubmission
);

/* ============================================================
 📰 COURSE MATERIALS (POSTS)
============================================================ */
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

/* ============================================================
 📢 NOTICES
============================================================ */
router.get("/notices", protect, teacherOnly, getTeacherNotices);

/* ============================================================
 📊 ANALYTICS & PROGRESS TRACKING
============================================================ */
// Get weekly assignment progress/flow
router.get("/analytics/weekly-progress", protect, teacherOnly, getWeeklyProgress);

// Get student performance by subject/group
router.get("/analytics/student-performance", protect, teacherOnly, getStudentPerformance);

// Get recent activity feed for dashboard
router.get("/analytics/recent-activity", protect, teacherOnly, getRecentActivity);

export default router;