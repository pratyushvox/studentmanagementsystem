// routes/studentRoutes.ts
import express from "express";
import { protect } from "../middleware/authMiddleware";
import { upload } from "../middleware/uploadMiddleware";

// Profile Management
import { 
  completeProfile, 
  getStudentProfile, 
  updateStudentProfile,
  checkProfileStatus
} from "../controllers/Student/Studentprofilecontroller";

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
  resubmitAssignment, // ADD THIS IMPORT
  getMySubmissions,
  getSubmissionById
} from "../controllers/Student/submissioncontroller";

// Posts
import {
  getPostsForStudent,
  getPostById
} from "../controllers/Student/postcontroller";

import { getStudentNotices } from "../controllers/Student/noticeController";

const router = express.Router();

// ============================================================
// PROFILE MANAGEMENT (First-time setup & updates)
// ============================================================
router.post("/complete-profile", protect, completeProfile);
router.get("/profile", protect, getStudentProfile);
router.put("/profile", protect, updateStudentProfile);
router.get("/profile-status", protect, checkProfileStatus);

// ============================================================
// DASHBOARD
// ============================================================
router.get("/dashboard", protect, getStudentDashboard);
router.get("/academic-history", protect, getAcademicHistory);

// ============================================================
// ASSIGNMENTS
// ============================================================
router.get("/assignments", protect, getAssignmentsForStudent);
router.get("/assignments/:assignmentId", protect, getAssignmentById);

// ============================================================
// SUBMISSIONS
// ============================================================
router.post(
  "/assignments/submit",
  protect,
  upload.single("file"),
  submitAssignment
);

// ADD THIS NEW ROUTE FOR RESUBMISSION
router.post(
  "/assignments/resubmit",
  protect,
  upload.single("file"),
  resubmitAssignment
);

router.get("/submissions", protect, getMySubmissions);
router.get("/submissions/:submissionId", protect, getSubmissionById);

// ============================================================
// POSTS
// ============================================================
router.get("/posts", protect, getPostsForStudent);
router.get("/posts/:postId", protect, getPostById);

// ============================================================
// NOTICES
// ============================================================
router.get("/notice", protect, getStudentNotices);

export default router;