// routes/studentRoutes.ts
import express from "express";
import { protect } from "../middleware/authMiddleware";
import { upload } from "../middleware/uploadMiddleware";
import  {uploadProfilePhoto}  from "../controllers/Student/studentprofilecontroller.js"

// Profile Management
import { 
  completeProfile, 
  getStudentProfile, 
  updateStudentProfile,
  checkProfileStatus,
  updateStudentPassword
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
  resubmitAssignment,
  getMySubmissions,
  getSubmissionById
} from "../controllers/Student/submissioncontroller";

// Posts
import {
  getPostsForStudent,
  getPostById
} from "../controllers/Student/postcontroller";

import { getStudentNotices } from "../controllers/Student/noticeController";

// Attendance
import {
  getStudentAttendanceSummary,
  getStudentAttendanceRecords,
  getStudentSubjectAttendance,
  getStudentSubjects
} from "../controllers/Student/studentattendancecontroller";

// Chat
import {
  createChat as createStudentChat,
  getChats as getStudentChats,
  getMessages as getStudentMessages,
  sendMessage as sendStudentMessage,
  getChatParticipant as getStudentChatParticipant,
  getUnreadCount as getStudentUnreadCount
} from "../controllers/Student/chatcontroller";

import {
  getMyTeachers,
  getTeacherDetails,
  getTeacherDepartments
} from "../controllers/Student/teacherController";

const router = express.Router();

// ============================================================
// PROFILE MANAGEMENT (First-time setup & updates)
// ============================================================
router.post("/complete-profile", protect, completeProfile);
router.get("/profile", protect, getStudentProfile);
router.put("/profile", protect, updateStudentProfile);
router.get("/profile-status", protect, checkProfileStatus);
router.put("/password/update", protect, updateStudentPassword);

// ✅ Upload profile photo
router.post(
  "/profile/photo",
  protect,
  upload.single("profilePhoto"), // Multer handles the file
  uploadProfilePhoto
);

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

// ============================================================
// ATTENDANCE
// ============================================================
router.get("/attendance/summary", protect, getStudentAttendanceSummary);
router.get("/attendance/records", protect, getStudentAttendanceRecords);
router.get("/attendance/subject/:subjectId", protect, getStudentSubjectAttendance);
router.get("/attendance/subjects", protect, getStudentSubjects);

// ============================================================
// TEACHER MANAGEMENT
// ============================================================
router.get("/teachers", protect, getMyTeachers);
router.get("/teachers/departments", protect, getTeacherDepartments);
router.get("/teachers/:teacherId", protect, getTeacherDetails);

// ============================================================
// CHAT ROUTES (UPDATED)
// ============================================================
router.post("/chat", protect, createStudentChat);
router.get("/chat/:studentId", protect, getStudentChats);
router.get("/chat/messages/:chatId", protect, getStudentMessages);
router.post("/chat/send", protect, sendStudentMessage); // Fixed endpoint to match teacher
router.get("/chat/participant/:chatId/:studentId", protect, getStudentChatParticipant);
router.get("/chat/unread/:studentId", protect, getStudentUnreadCount); // Fixed function name

export default router;