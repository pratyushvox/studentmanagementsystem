// controllers/dashboardController.ts
import { Request, Response } from "express";
import Assignment from "../../models/Assignment";
import Submission from "../../models/Submission";
import Post from "../../models/Post";
import User from "../../models/User";

//  Get student dashboard summary
export const getStudentDashboard = async (req: Request, res: Response) => {
  try {
    
    if (!req.user) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    const student = await User.findById(req.user._id);
    if (!student) return res.status(404).json({ message: "Student not found" });

    
    const subjectFilter = student.assignedSubjects && student.assignedSubjects.length > 0
      ? { $in: student.assignedSubjects }
      : { $exists: true };

    const pendingAssignments = await Assignment.countDocuments({
      grade: student.grade,
      subject: subjectFilter,
      deadline: { $gte: new Date() },
    });

    const submittedIds = await Submission.find({ studentId: req.user._id }).distinct("assignmentId");

    const notSubmittedCount = await Assignment.countDocuments({
      _id: { $nin: submittedIds },
      grade: student.grade,
      deadline: { $gte: new Date() },
    });

    const submissions = await Submission.find({ studentId: req.user._id });
    
    // Fix 3: Proper type checking for grade
    const gradedSubmissions = submissions.filter((s) => s.grade !== undefined && s.grade !== null);
    const averageGrade =
      gradedSubmissions.length > 0
        ? gradedSubmissions.reduce((sum, s) => sum + (s.grade ?? 0), 0) / gradedSubmissions.length
        : 0;

    const recentPosts = await Post.countDocuments({
      grade: student.grade,
      createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
    });

    res.json({
      message: "Dashboard data fetched successfully",
      dashboard: {
        student: {
          name: student.fullName,
          grade: student.grade,
          subjects: student.assignedSubjects,
        },
        assignments: {
          pending: notSubmittedCount,
          total: pendingAssignments,
          submitted: submissions.length,
        },
        performance: {
          totalSubmissions: submissions.length,
          gradedSubmissions: gradedSubmissions.length,
          ungradedSubmissions: submissions.length - gradedSubmissions.length,
          averageGrade: Math.round(averageGrade * 100) / 100,
        },
        recentActivity: {
          newPostsThisWeek: recentPosts,
        },
      },
    });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};