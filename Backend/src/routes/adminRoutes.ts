// Updated Admin Routes with Notice Management
import express from "express";
import { protect, adminOnly } from "../middleware/authMiddleware";

// Dashboard
import { getDashboardStats ,
  getSemesterStats
} from "../controllers/Admin/adminDashboardController";

// Subject Management
import {
  createSubject,
  getAllSubjects,
  getSubjectsBySemester,
  getSubjectById,        
  updateSubject,
  deleteSubject,
  getSubjectStatistics,
} from "../controllers/Admin/subjectController";

// Group Management
import {
  createGroup,
  getAllGroups,
  getGroupsBySemester,
  assignTeacherToGroup,
  assignStudentToGroup,
  autoAssignStudents
} from "../controllers/Admin/groupController";

// Promotion & Results
import {
  promoteSemester,
  calculateSubjectResult,
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
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
} from "../controllers/Admin/Adminusercontroller";

// Student details 
import {
  getAllStudentsWithDetails,
  getStudentDetails,
  updateStudentDetails,
  getStudentsBySemester,
  getUnassignedStudents
} from "../controllers/Admin/StudentController";

// Teacher details
import {
  getAllTeachersWithDetails,
  getTeacherDetails,
  updateTeacherDetails,
  getUnassignedTeachers,
  assignSubjectToTeacher,
  removeSubjectFromTeacher,
  assignGroupsToTeacherSubject,
  getTeacherWorkload
} from "../controllers/Admin/Teachercontroller";

// Notice Management
import {
  createNotice,
  getAllNotices,
  getNoticeById,
  updateNotice,
  deleteNotice,
} from '../controllers/Admin/Noticecontroller';

const router = express.Router();

/* ============================================================
 📊 DASHBOARD
============================================================ */
router.get("/dashboard", protect, adminOnly, getDashboardStats);
router.get('/semester-stats', protect, adminOnly, getSemesterStats);

/* ============================================================
 👥 USER CREATION & APPROVAL
============================================================ */
router.post("/create-student", protect, adminOnly, createStudent);
router.post("/create-teacher", protect, adminOnly, createTeacher);
router.patch("/users/:id/approve", protect, adminOnly, approveStudent);

/* ============================================================
 👤 USER MANAGEMENT
============================================================ */
router.get("/users", protect, adminOnly, getAllUsers);          
router.get("/users/:id", protect, adminOnly, getUserById);      
router.put("/users/:id", protect, adminOnly, updateUser);       
router.delete("/users/:id", protect, adminOnly, deleteUser);    

/* ============================================================
 📚 SUBJECT MANAGEMENT
============================================================ */
router.get("/subjects/statistics", protect, adminOnly, getSubjectStatistics);
router.get("/subjects", protect, adminOnly, getAllSubjects);
router.get("/subjects/:id", protect, adminOnly, getSubjectById);
router.get("/subjects/semester/:semester", protect, adminOnly, getSubjectsBySemester);
router.post("/subjects", protect, adminOnly, createSubject);
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
router.post("/groups/auto-assign-students", protect, adminOnly, autoAssignStudents);

/* ============================================================
 🎓 PROMOTION & RESULTS
============================================================ */
router.post("/promote/:semester", protect, adminOnly, promoteSemester);
router.post("/calculate-result", protect, adminOnly, calculateSubjectResult);

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

/* ============================================================
 🎓 STUDENT DETAILS MANAGEMENT
============================================================ */
router.get("/students-with-details", protect, adminOnly, getAllStudentsWithDetails);
router.get("/students/:studentId", protect, adminOnly, getStudentDetails);
router.put("/students/:studentId", protect, adminOnly, updateStudentDetails);
router.get("/students/semester/:semester", protect, adminOnly, getStudentsBySemester);
router.get("/students/unassigned/list", protect, adminOnly, getUnassignedStudents);

/* ============================================================
 👨‍🏫 TEACHER DETAILS MANAGEMENT
============================================================ */
router.get("/teachers-with-details", protect, adminOnly, getAllTeachersWithDetails);
router.get("/teachers/unassigned/list", protect, adminOnly, getUnassignedTeachers);
router.get("/teachers/:teacherId", protect, adminOnly, getTeacherDetails);
router.put("/teachers/:teacherId", protect, adminOnly, updateTeacherDetails);
router.get("/teachers/:teacherId/workload", protect, adminOnly, getTeacherWorkload);
router.post("/teachers/:teacherId/subjects", protect, adminOnly, assignSubjectToTeacher);
router.delete("/teachers/:teacherId/subjects/:subjectId", protect, adminOnly, removeSubjectFromTeacher);
router.patch("/teachers/:teacherId/subjects/:subjectId/groups", protect, adminOnly, assignGroupsToTeacherSubject);

/* ============================================================
 📢 NOTICE MANAGEMENT
============================================================ */
// Create new notice
router.post("/create/notices", protect, adminOnly, createNotice);

// Get all notices (with filters: priority, isActive, targetAudience, search)
router.get("/notices", protect, adminOnly, getAllNotices);

// Get single notice with detailed info
router.get("/notices/:id", protect, adminOnly, getNoticeById);

// Update notice
router.put("/notices/:id", protect, adminOnly, updateNotice);

// Delete notice
router.delete("/notices/:id", protect, adminOnly, deleteNotice);

export default router;

