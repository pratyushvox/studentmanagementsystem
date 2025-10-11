import express from "express";
import { protect, adminOnly } from "../middleware/authMiddleware";

// Controllers
import { getDashboardStats } from "../controllers/Admin/adminDashboardController";
import {
  getAllUsers,
  getUserById,
  updateAnyUser,
  deleteAnyUser,
} from "../controllers/Admin/adminUserController";

import {
  promoteAllStudents,
  promoteGrade,
  getGradeStats,
} from "../controllers/Admin/adminUserController";

import {
  getAllAssignments,
  getAssignmentById,
  deleteAnyAssignment,
} from "../controllers/Admin/adminAssignmentController";

import {
  getAllPosts,
  getPostById,
  deleteAnyPost,
} from "../controllers/Admin/adminPostController";

import {
  getAllSubmissions,
  getSubmissionById,
  deleteAnySubmission,
} from "../controllers/Admin/adminSubmissionController";

import {
  approveTeacherEdit,
  rejectTeacherEdit,
  getPendingTeacherRequests,
  getAllTeacherRequests,
  getTeacherRequestById,
} from "../controllers/Admin/adminTeacherRequestController";

// Auth Controllers for creating users
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
 👤 USER MANAGEMENT
============================================================ */
router.get("/users", protect, adminOnly, getAllUsers);
router.get("/users/:id", protect, adminOnly, getUserById);
router.put("/users/:id", protect, adminOnly, updateAnyUser);
router.delete("/users/:id", protect, adminOnly, deleteAnyUser);

/* ============================================================
 ✨ USER CREATION (Admin creates students/teachers)
============================================================ */
router.post("/create-student", protect, adminOnly, createStudent);
router.post("/create-teacher", protect, adminOnly, createTeacher);
router.patch("/approve-student/:studentId", protect, adminOnly, approveStudent);

/* ============================================================
 📚 GRADE MANAGEMENT
============================================================ */
router.put("/users/promote/all", protect, adminOnly, promoteAllStudents);
router.put("/users/promote/:grade", protect, adminOnly, promoteGrade);
router.get("/users/stats/grades", protect, adminOnly, getGradeStats);

/* ============================================================
 📘 ASSIGNMENT MANAGEMENT
============================================================ */
router.get("/assignments", protect, adminOnly, getAllAssignments);
router.get("/assignments/:id", protect, adminOnly, getAssignmentById);
router.delete("/assignments/:id", protect, adminOnly, deleteAnyAssignment);

/* ============================================================
 📰 POST MANAGEMENT
============================================================ */
router.get("/posts", protect, adminOnly, getAllPosts);
router.get("/posts/:id", protect, adminOnly, getPostById);
router.delete("/posts/:id", protect, adminOnly, deleteAnyPost);

/* ============================================================
 🧾 SUBMISSION MANAGEMENT
============================================================ */
router.get("/submissions", protect, adminOnly, getAllSubmissions);
router.get("/submissions/:id", protect, adminOnly, getSubmissionById);
router.delete("/submissions/:id", protect, adminOnly, deleteAnySubmission);

/* ============================================================
 🧩 TEACHER EDIT REQUEST MANAGEMENT
============================================================ */
router.get("/teacher-requests", protect, adminOnly, getAllTeacherRequests);
router.get("/teacher-requests/pending", protect, adminOnly, getPendingTeacherRequests);
router.get("/teacher-requests/:id", protect, adminOnly, getTeacherRequestById);
router.put("/teacher-requests/:requestId/approve", protect, adminOnly, approveTeacherEdit);
router.put("/teacher-requests/:requestId/reject", protect, adminOnly, rejectTeacherEdit);

export default router;