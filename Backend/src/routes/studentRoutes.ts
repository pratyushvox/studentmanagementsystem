import express from "express";
import { protect } from "../middleware/authMiddleware";
import { upload } from "../middleware/uploadMiddleware";

// 🧾 Controllers
import {
  getAssignmentsForStudent,
  getAssignmentById,
} from "../controllers/Student/assignmentcontroller";

import {
  submitAssignment,
  getMySubmissions,
} from "../controllers/Student/submissioncontroller";

import {
  getPostsForStudent,
  getPostById,
} from "../controllers/Student/postcontroller";

import { getStudentDashboard } from "../controllers/Student/dashboardcontroller";

const router = express.Router();



// ✅ Get all assignments for the logged-in student
router.get("/assignments", protect, getAssignmentsForStudent);

// ✅ Get a specific assignment by ID
router.get("/assignments/:assignmentId", protect, getAssignmentById);




// ✅ Submit assignment (with file upload)
router.post("/assignments/submit", protect, upload.single("file"), submitAssignment);

// ✅ Get all submissions of the logged-in student
router.get("/submissions", protect, getMySubmissions);



// ✅ Get all posts for the student’s grade and subject
router.get("/posts", protect, getPostsForStudent);

// ✅ Get details of a single post
router.get("/posts/:postId", protect, getPostById);




// ✅ Get student dashboard summary
router.get("/dashboard", protect, getStudentDashboard);

export default router;

