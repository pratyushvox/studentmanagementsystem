import { Request, Response } from "express";
import User from "../../models/User";
import Assignment from "../../models/Assignment";
import Submission from "../../models/Submission";
import Post from "../../models/Post";
import TeacherEditRequest from "../../models/TeacherEditRequest";
import mongoose from "mongoose";

export const getTeacherDashboard = async (req: Request, res: Response) => {
  try {
   
    if (!req.user) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    const teacher = await User.findById(req.user._id); // Use _id for consistency
    if (!teacher) return res.status(404).json({ message: "Teacher not found" });

    const totalAssignments = await Assignment.countDocuments({ teacherId: req.user._id });
    const activeAssignments = await Assignment.countDocuments({
      teacherId: req.user._id, deadline: { $gte: new Date() }
    });

    const totalPosts = await Post.countDocuments({ teacherId: req.user._id });

    const assignments = await Assignment.find({ teacherId: req.user._id }).select("_id");
    
    
    const assignmentIds = assignments.map(a => a._id as mongoose.Types.ObjectId);

    const totalSubmissions = await Submission.countDocuments({ assignmentId: { $in: assignmentIds } });
    const ungradedSubmissions = await Submission.countDocuments({
      assignmentId: { $in: assignmentIds },
      grade: { $exists: false }
    });

    const pendingRequests = await TeacherEditRequest.countDocuments({
      teacherId: req.user._id, status: "pending"
    });

    res.json({
      message: "Dashboard fetched successfully",
      dashboard: {
        teacher: { name: teacher.fullName, grade: teacher.grade, subject: teacher.subject },
        assignments: {
          total: totalAssignments,
          active: activeAssignments,
          expired: totalAssignments - activeAssignments
        },
        posts: { total: totalPosts },
        submissions: {
          total: totalSubmissions,
          graded: totalSubmissions - ungradedSubmissions,
          ungraded: ungradedSubmissions
        },
        requests: { pending: pendingRequests }
      }
    });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};