import express from "express";
import { protect, teacherOnly } from "../middleware/authMiddleware";
import { upload } from "../middleware/uploadMiddleware";


// Dashboard
import { getTeacherDashboard } from "../controllers/Teacher/dashboardController";

// Profile & Workload
import {
  getTeacherProfile,
  updateMyProfile,
  uploadProfilePhoto,
  getMyWorkload,
  getMySubjects,
  updateTeacherPassword
} from "../controllers/Teacher/Teacherprofilecontroller";

// Assignment Management
import {
  createAssignment,
  getMyAssignments,
  getMyAssignmentById,
  updateAssignment,
  deleteAssignment,
  getMyAssignmentStatistics
} from "../controllers/Teacher/assignmentController";

// Submission & Grading
import {
  getSubmissionsForGrading,
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

// Analytics & Progress Tracking
import {
  getWeeklyProgress,
  getStudentPerformance,
  getRecentActivity
} from "../controllers/Teacher/analyticsController";

// Attendance Management
import {
  getTeacherAttendanceSetup,
  getGroupStudentsForAttendance,
  markAttendance,
  getAttendanceByDate,
  getAttendanceHistory,
  getStudentAttendanceSummary,
  markBulkAttendance
} from "../controllers/Teacher/attendancecontroller";

// Group Management (View Only)
import {
  getMyGroups,
  getGroupStudents,
  getMyGroupsWithDetails,
  getStudentDetails
} from "../controllers/Teacher/Teachergroupcontroller";

// Student Information
import {
  getMyStudents
} from "../controllers/Teacher/Studentcontroller";

// Chat
import {
  createChat,
  getChats,
  sendMessage,
  getMessages,
  getChatParticipant,
   getUnreadCount
} from "../controllers/Teacher/chatcontroller";

const router = express.Router();

/* ============================================================
 📊 DASHBOARD
============================================================ */
router.get("/dashboard", protect, teacherOnly, getTeacherDashboard);

/* ============================================================
 👤 PROFILE & WORKLOAD
============================================================ */
// Get logged-in teacher's full profile with subjects & groups
router.get("/profile", protect, teacherOnly, getTeacherProfile);

// Update teacher's own profile (basic details)
router.put("/profile/update", protect, teacherOnly, updateMyProfile);

router.put("/password/update", protect, teacherOnly, updateTeacherPassword)

// Upload profile photo
router.post("/profile/upload-photo", protect, teacherOnly, upload.single("profilePhoto"), uploadProfilePhoto);

// Get teacher's workload statistics
router.get("/workload", protect, teacherOnly, getMyWorkload);

// Get teacher's assigned subjects and groups
router.get("/subjects", protect, teacherOnly, getMySubjects);

/* ============================================================
 👥 GROUP MANAGEMENT (VIEW ONLY)
============================================================ */
// Get teacher's assigned groups
router.get("/groups/my-groups", protect, teacherOnly, getMyGroups);

// Get teacher's groups with detailed information
router.get("/groups/my-groups/detailed", protect, teacherOnly, getMyGroupsWithDetails);

// Get specific student details (only if student is in teacher's assigned group)
router.get("/groups/students/:studentId", protect, teacherOnly, getStudentDetails);

/* ============================================================
 👨‍🎓 STUDENT INFORMATION
============================================================ */
// Get all students taught by the teacher
router.get("/students", protect, teacherOnly, getMyStudents);

// Get detailed information for a specific student
router.get("/students/:studentId", protect, teacherOnly, getStudentDetails);

/* ============================================================
 📘 ASSIGNMENT MANAGEMENT
============================================================ */
// Get assignment statistics for dashboard
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
 📊 ATTENDANCE MANAGEMENT
============================================================ */
// Get teacher's attendance setup (groups and subjects they teach)
router.get("/attendance/setup", protect, teacherOnly, getTeacherAttendanceSetup);

// IMPORTANT: This route MUST come before the generic /groups/:groupId/students route
// Get students for attendance marking with subject validation
router.get("/groups/:groupId/students", protect, teacherOnly, getGroupStudentsForAttendance);

// Mark attendance for a specific date
router.post("/attendance/mark", protect, teacherOnly, markAttendance);

// Bulk mark attendance for multiple dates
router.post("/attendance/mark-bulk", protect, teacherOnly, markBulkAttendance);

// Get attendance for a specific date
router.get("/attendance/date", protect, teacherOnly, getAttendanceByDate);

// Get attendance history
router.get("/attendance/history", protect, teacherOnly, getAttendanceHistory);

// Get student attendance summary
router.get("/attendance/student-summary", protect, teacherOnly, getStudentAttendanceSummary);

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

/* ============================================================
 💬 CHAT
============================================================ */
// Create or fetch chat
router.post("/chat", protect, teacherOnly, createChat);

// Get all chats for teacher
router.get("/chat/:teacherId", protect, teacherOnly, getChats);

// Get messages for a chat
router.get("/chat/messages/:chatId", protect, teacherOnly, getMessages);

// Send message
router.post("/chat/send", protect, teacherOnly, sendMessage);

// Get other participant of chat
router.get("/chat/participant/:chatId/:teacherId", protect, teacherOnly, getChatParticipant)

//get unread message 
router.get('/unread/:teacherId', protect,teacherOnly,getUnreadCount);

export default router;