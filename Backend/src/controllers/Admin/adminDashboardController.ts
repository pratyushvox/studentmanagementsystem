import { Request, Response } from "express";
import User from "../../models/User";
import Assignment from "../../models/Assignment";
import Submission from "../../models/Submission";
import Post from "../../models/Post";


// Dashboard overview
export const getDashboardStats = async (_req: Request, res: Response) => {
  try {
    const [students, teachers, posts, assignments, submissions, requests] = await Promise.all([
      User.countDocuments({ role: "student" }),
      User.countDocuments({ role: "teacher" }),
      Post.countDocuments(),
      Assignment.countDocuments(),
      Submission.countDocuments(),
      TeacherEditRequest.countDocuments({ status: "pending" }),
    ]);

    res.status(200).json({
      totalStudents: students,
      totalTeachers: teachers,
      totalPosts: posts,
      totalAssignments: assignments,
      totalSubmissions: submissions,
      pendingRequests: requests,
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};
