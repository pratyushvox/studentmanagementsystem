// routes/adminRoutes.ts
import express from "express";
import { protect, adminOnly } from "../middleware/authMiddleware";



// Dashboard
import { getDashboardStats } from "../controllers/Admin/adminDashboardController";

// Subject Management
import {
  createSubject,
  getAllSubjects,
  getSubjectsBySemester,
  updateSubject,
  deleteSubject,
} from "../controllers/Admin/subjectController";

// Group Management
import {
  createGroup,
  getAllGroups,
  getGroupsBySemester,
  assignTeacherToGroup,
  assignStudentToGroup,
} from "../controllers/Admin/groupController";

// Promotion & Results
import {
  promoteSemester,
  calculateSubjectResult,
  getSemesterStats,
} from "../controllers/Admin/promotionController";

// Assignment Management (View/Delete Only)
import {
  getAllAssignments,
  getAssignmentById,
  deleteAnyAssignment,
} from "../controllers/Admin/adminAssignmentController";

// Post Management (View/Delete Only)
import {
  getAllPosts,
  getPostById,
  deleteAnyPost,
} from "../controllers/Admin/adminPostController";

// Submission Management (View/Delete Only)
import {
  getAllSubmissions,
  getSubmissionById,
  deleteAnySubmission,
} from "../controllers/Admin/adminSubmissionController";

// Auth Controllers (for creating users)
import {
  createStudent,
  createTeacher,
  approveStudent,
} from "../controllers/authController";

const router = express.Router();

/* ============================================================
 📊 DASHBOARD
============================================================ */
router.get("/dashboard", protect, adminOnly, getDashboardStats);

/* ============================================================
 👥 USER CREATION & APPROVAL
============================================================ */
router.post("/create-student", protect, adminOnly, createStudent);
router.post("/create-teacher", protect, adminOnly, createTeacher);
router.patch("/approve-student/:studentId", protect, adminOnly, approveStudent);

/* ============================================================
 📚 SUBJECT MANAGEMENT
============================================================ */
router.post("/subjects", protect, adminOnly, createSubject);
router.get("/subjects", protect, adminOnly, getAllSubjects);
router.get("/subjects/semester/:semester", protect, adminOnly, getSubjectsBySemester);
router.put("/subjects/:id", protect, adminOnly, updateSubject);
router.delete("/subjects/:id", protect, adminOnly, deleteSubject);

/* ============================================================
 👨‍👩‍👧‍👦 GROUP MANAGEMENT
============================================================ */
router.post("/groups", protect, adminOnly, createGroup);
router.get("/groups", protect, adminOnly, getAllGroups);
router.get("/groups/semester/:semester", protect, adminOnly, getGroupsBySemester);
router.post("/groups/assign-teacher", protect, adminOnly, assignTeacherToGroup);
router.post("/groups/assign-student", protect, adminOnly, assignStudentToGroup);

/* ============================================================
 🎓 PROMOTION & RESULTS
============================================================ */
router.post("/promote/:semester", protect, adminOnly, promoteSemester);
router.post("/calculate-result", protect, adminOnly, calculateSubjectResult);
router.get("/semester-stats", protect, adminOnly, getSemesterStats);

/* ============================================================
 📘 ASSIGNMENT MANAGEMENT (View/Delete Only)
============================================================ */
router.get("/assignments", protect, adminOnly, getAllAssignments);
router.get("/assignments/:id", protect, adminOnly, getAssignmentById);
router.delete("/assignments/:id", protect, adminOnly, deleteAnyAssignment);

/* ============================================================
 📰 POST MANAGEMENT (View/Delete Only)
============================================================ */
router.get("/posts", protect, adminOnly, getAllPosts);
router.get("/posts/:id", protect, adminOnly, getPostById);
router.delete("/posts/:id", protect, adminOnly, deleteAnyPost);

/* ============================================================
 🧾 SUBMISSION MANAGEMENT (View/Delete Only)
============================================================ */
router.get("/submissions", protect, adminOnly, getAllSubmissions);
router.get("/submissions/:id", protect, adminOnly, getSubmissionById);
router.delete("/submissions/:id", protect, adminOnly, deleteAnySubmission);

export default router;