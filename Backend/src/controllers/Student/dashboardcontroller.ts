import { Request, Response } from "express";
import Student from "../../models/Student";
import Assignment from "../../models/Assignment";
import Submission from "../../models/Submission";
import Post from "../../models/Post";

export const getStudentDashboard = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    const student = await Student.findOne({ userId: req.user._id })
      .populate("groupId", "name semester academicYear")
      .populate("userId", "fullName email");

    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    // Pending assignments
    const pendingAssignments = student.groupId 
      ? await Assignment.countDocuments({
          semester: student.currentSemester,
          groups: student.groupId,
          deadline: { $gte: new Date() }
        })
      : 0;

    // Submitted assignment IDs
    const submittedIds = await Submission.find({ 
      studentId: student._id 
    }).distinct("assignmentId");

    const notSubmittedCount = student.groupId
      ? await Assignment.countDocuments({
          _id: { $nin: submittedIds },
          semester: student.currentSemester,
          groups: student.groupId,
          deadline: { $gte: new Date() }
        })
      : 0;

    // Submissions
    const submissions = await Submission.find({ studentId: student._id });
    const gradedSubmissions = submissions.filter(s => s.status === "graded");
    const averageMarks = gradedSubmissions.length > 0
      ? gradedSubmissions.reduce((sum, s) => sum + (s.marks || 0), 0) / gradedSubmissions.length
      : 0;

    // Current semester performance
    const currentHistory = student.academicHistory.find(
      h => h.semester === student.currentSemester
    );

    const passedSubjects = currentHistory 
      ? currentHistory.subjects.filter(s => s.passed).length
      : 0;
    const totalSubjects = currentHistory 
      ? currentHistory.subjects.length 
      : 0;

    // Recent posts
    const recentPosts = student.groupId
      ? await Post.countDocuments({
          semester: student.currentSemester,
          groups: student.groupId,
          createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
        })
      : 0;

    res.json({
      message: "Dashboard data fetched successfully",
      dashboard: {
        student: {
          name: req.user.fullName,
          studentId: student.studentId,
          semester: student.currentSemester,
          group: student.groupId,
          status: student.status,
          enrollmentYear: student.enrollmentYear
        },
        assignments: {
          pending: notSubmittedCount,
          total: pendingAssignments,
          submitted: submissions.length
        },
        performance: {
          totalSubmissions: submissions.length,
          gradedSubmissions: gradedSubmissions.length,
          pendingGrading: submissions.length - gradedSubmissions.length,
          averageMarks: Math.round(averageMarks * 100) / 100,
          passedSubjects,
          totalSubjects,
          semesterProgress: totalSubjects > 0 
            ? Math.round((passedSubjects / totalSubjects) * 100) 
            : 0
        },
        recentActivity: {
          newPostsThisWeek: recentPosts
        }
      }
    });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

// Get academic history
export const getAcademicHistory = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    const student = await Student.findOne({ userId: req.user._id })
      .populate("academicHistory.groupId", "name semester")
      .populate("academicHistory.subjects.subjectId", "name code credits")
      .populate("academicHistory.subjects.teacherId", "teacherId")
      .populate({
        path: "academicHistory.subjects.teacherId",
        populate: { path: "userId", select: "fullName" }
      });

    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    res.json({
      message: "Academic history fetched",
      academicHistory: student.academicHistory
    });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};
