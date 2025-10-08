import express from "express";
import { protect, teacherOnly } from "../middleware/authMiddleware";
import { upload } from "../middleware/uploadMiddleware";

// 🧾 Controllers
import {
  createAssignment,
  getMyAssignments,
  getMyAssignmentById,
  updateAssignment,
  deleteAssignment,
} from "../controllers/Teacher/assignmentController";

import {
  createPost,
  getMyPosts,
  getMyPostById,
  updatePost,
  deletePost,
} from "../controllers/Teacher/postController";

import {
  getAssignmentSubmissions,
  getSubmissionById,
  gradeSubmission,
} from "../controllers/Teacher/submissionController"

import { getTeacherDashboard } from "../controllers/Teacher/dashboardController";

import {
  requestGradeOrSubjectChange,
  getMyEditRequests,
} from "../controllers/Teacher/teacherProfileController";

const router = express.Router();


router.get("/dashboard", protect, teacherOnly, getTeacherDashboard);

// Create assignment (file optional)
router.post(
  "/assignments",
  protect,
  teacherOnly,
  upload.single("file"),
  createAssignment
);

// Get all assignments created by this teacher
router.get("/assignments", protect, teacherOnly, getMyAssignments);

// Get a single assignment
router.get("/assignments/:assignmentId", protect, teacherOnly, getMyAssignmentById);

// Update assignment
router.put(
  "/assignments/:assignmentId",
  protect,
  teacherOnly,
  upload.single("file"),
  updateAssignment
);

// Delete assignment
router.delete("/assignments/:assignmentId", protect, teacherOnly, deleteAssignment);

/* ============================================================
 🧾 SUBMISSION ROUTES
============================================================ */
// Get all submissions for a specific assignment
router.get(
  "/assignments/:assignmentId/submissions",
  protect,
  teacherOnly,
  getAssignmentSubmissions
);

// Get details of a specific submission
router.get(
  "/submissions/:submissionId",
  protect,
  teacherOnly,
  getSubmissionById
);

// Grade a submission
router.put(
  "/submissions/:submissionId/grade",
  protect,
  teacherOnly,
  gradeSubmission
);


// Create post (upload video/pdf)
router.post(
  "/posts",
  protect,
  teacherOnly,
  upload.single("file"),
  createPost
);

// Get all posts by this teacher
router.get("/posts", protect, teacherOnly, getMyPosts);

// Get a specific post
router.get("/posts/:postId", protect, teacherOnly, getMyPostById);

// Update post title
router.put("/posts/:postId", protect, teacherOnly, updatePost);

// Delete post
router.delete("/posts/:postId", protect, teacherOnly, deletePost);


router.post(
  "/edit-request",
  protect,
  teacherOnly,
  requestGradeOrSubjectChange
);

// Get all edit requests by the teacher
router.get("/edit-request", protect, teacherOnly, getMyEditRequests);

export default router;
