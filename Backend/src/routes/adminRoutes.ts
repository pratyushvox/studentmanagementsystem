// Updated Admin Routes with Module Leader Management
import express from "express";
import { protect, adminOnly } from "../middleware/authMiddleware";

// Dashboard
import { 
  getDashboardStats,
  getSemesterStats
} from "../controllers/Admin/adminDashboardController";

// Subject Management
import { 
  createSubject,
  getAllSubjects,
  getSubjectById,
  getSubjectsBySemester,
  updateSubject,
  deleteSubject,
  assignModuleLeader,
  removeModuleLeader,
  getSubjectStatistics,
  getModuleLeaderSubjects
} from "../controllers/Admin/subjectController";

// Group Management
import { 
  createGroup, 
  getAllGroups, 
  getGroupsBySemester,
  updateGroup,
  deleteGroup,
  assignTeacherToGroup,
  assignStudentToGroup,
  autoAssignStudents,
  getStudentsByGroup
} from "../controllers/admin/groupController";

// Promotion & Results
import {
  promoteSemester,
  manuallyPromoteStudents,
  getPromotionReport,
  calculateSubjectResult,
  getStudentMainAssignments
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

const adminRouter = express.Router();

/* ============================================================
 📊 DASHBOARD
============================================================ */
adminRouter.get("/dashboard", protect, adminOnly, getDashboardStats);
adminRouter.get('/semester-stats', protect, adminOnly, getSemesterStats);

/* ============================================================
 👥 USER CREATION & APPROVAL
============================================================ */
adminRouter.post("/create-student", protect, adminOnly, createStudent);
adminRouter.post("/create-teacher", protect, adminOnly, createTeacher);
adminRouter.patch("/users/:id/approve", protect, adminOnly, approveStudent);

/* ============================================================
 👤 USER MANAGEMENT
============================================================ */
adminRouter.get("/users", protect, adminOnly, getAllUsers);          
adminRouter.get("/users/:id", protect, adminOnly, getUserById);      
adminRouter.put("/users/:id", protect, adminOnly, updateUser);       
adminRouter.delete("/users/:id", protect, adminOnly, deleteUser);    

/* ============================================================
 📚 SUBJECT MANAGEMENT
============================================================ */
// Statistics
adminRouter.get("/subjects/statistics", protect, adminOnly, getSubjectStatistics);

// CRUD
adminRouter.post("/subjects", protect, adminOnly, createSubject);
adminRouter.get("/subjects", protect, adminOnly, getAllSubjects);
adminRouter.get("/subjects/:id", protect, adminOnly, getSubjectById);
adminRouter.get("/subjects/semester/:semester", protect, adminOnly, getSubjectsBySemester);
adminRouter.put("/subjects/:id", protect, adminOnly, updateSubject);
adminRouter.delete("/subjects/:id", protect, adminOnly, deleteSubject);

// Module Leader Management (NEW)
adminRouter.patch("/subjects/:subjectId/module-leader", protect, adminOnly, assignModuleLeader);
adminRouter.delete("/subjects/:subjectId/module-leader", protect, adminOnly, removeModuleLeader);
adminRouter.get("/subjects/module-leader/:teacherId", protect, adminOnly, getModuleLeaderSubjects);

/* ============================================================
 👨‍👩‍👧‍👦 GROUP MANAGEMENT
============================================================ */
adminRouter.post("/groups", protect, adminOnly, createGroup);
adminRouter.get("/groups", protect, adminOnly, getAllGroups);
adminRouter.get("/groups/semester/:semester", protect, adminOnly, getGroupsBySemester);
adminRouter.put("/groups/:id", protect, adminOnly, updateGroup);
adminRouter.delete("/groups/:id", protect, adminOnly, deleteGroup);

// Group Assignments
adminRouter.post("/groups/assign-teacher", protect, adminOnly, assignTeacherToGroup);
adminRouter.post("/groups/assign-student", protect, adminOnly, assignStudentToGroup);
adminRouter.post("/groups/auto-assign-students", protect, adminOnly, autoAssignStudents);
adminRouter.get("/groups/:id/students", protect, adminOnly, getStudentsByGroup); 

/* ============================================================
 🎓 PROMOTION & RESULTS
============================================================ */
// Automatic promotion for semester
adminRouter.post("/promote/:semester", protect, adminOnly, promoteSemester);

// Manual promotion for specific students
adminRouter.post("/manual-promote", protect, adminOnly, manuallyPromoteStudents);

// Promotion reports and analytics
adminRouter.get("/promotion-report/:semester", protect, adminOnly, getPromotionReport);

// Student main assignment details
adminRouter.get("/students/:studentId/main-assignments/:semester", protect, adminOnly, getStudentMainAssignments);

// Calculate subject results
adminRouter.post("/calculate-result", protect, adminOnly, calculateSubjectResult);

/* ============================================================
 📘 ASSIGNMENT MANAGEMENT (View/Delete Only)
============================================================ */
adminRouter.get("/assignments", protect, adminOnly, getAllAssignments);
adminRouter.get("/assignments/:id", protect, adminOnly, getAssignmentById);
adminRouter.delete("/assignments/:id", protect, adminOnly, deleteAnyAssignment);

/* ============================================================
 📰 POST MANAGEMENT (View/Delete Only)
============================================================ */
adminRouter.get("/posts", protect, adminOnly, getAllPosts);
adminRouter.get("/posts/:id", protect, adminOnly, getPostById);
adminRouter.delete("/posts/:id", protect, adminOnly, deleteAnyPost);

/* ============================================================
 🧾 SUBMISSION MANAGEMENT (View/Delete Only)
============================================================ */
adminRouter.get("/submissions", protect, adminOnly, getAllSubmissions);
adminRouter.get("/submissions/:id", protect, adminOnly, getSubmissionById);
adminRouter.delete("/submissions/:id", protect, adminOnly, deleteAnySubmission);

/* ============================================================
 🎓 STUDENT DETAILS MANAGEMENT
============================================================ */
adminRouter.get("/students-with-details", protect, adminOnly, getAllStudentsWithDetails);
adminRouter.get("/students/unassigned/list", protect, adminOnly, getUnassignedStudents);
adminRouter.get("/students/semester/:semester", protect, adminOnly, getStudentsBySemester);
adminRouter.get("/students/:studentId", protect, adminOnly, getStudentDetails);
adminRouter.put("/students/:studentId", protect, adminOnly, updateStudentDetails);

/* ============================================================
 👨‍🏫 TEACHER DETAILS MANAGEMENT
============================================================ */
adminRouter.get("/teachers-with-details", protect, adminOnly, getAllTeachersWithDetails);
adminRouter.get("/teachers/unassigned/list", protect, adminOnly, getUnassignedTeachers);
adminRouter.get("/teachers/:teacherId", protect, adminOnly, getTeacherDetails);
adminRouter.put("/teachers/:teacherId", protect, adminOnly, updateTeacherDetails);
adminRouter.get("/teachers/:teacherId/workload", protect, adminOnly, getTeacherWorkload);

// Teacher-Subject Assignment
adminRouter.post("/teachers/:teacherId/subjects", protect, adminOnly, assignSubjectToTeacher);
adminRouter.delete("/teachers/:teacherId/subjects/:subjectId", protect, adminOnly, removeSubjectFromTeacher);
adminRouter.patch("/teachers/:teacherId/subjects/:subjectId/groups", protect, adminOnly, assignGroupsToTeacherSubject);

/* ============================================================
 📢 NOTICE MANAGEMENT
============================================================ */
adminRouter.post("/notices", protect, adminOnly, createNotice);
adminRouter.get("/notices", protect, adminOnly, getAllNotices);
adminRouter.get("/notices/:id", protect, adminOnly, getNoticeById);
adminRouter.put("/notices/:id", protect, adminOnly, updateNotice);
adminRouter.delete("/notices/:id", protect, adminOnly, deleteNotice);

export default adminRouter;