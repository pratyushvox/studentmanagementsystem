import { Request, Response } from "express";
import Teacher from "../../models/Teacher";
import Assignment from "../../models/Assignment";
import Submission from "../../models/Submission";
import Post from "../../models/Post";

export const getTeacherDashboard = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    const teacher = await Teacher.findOne({ userId: req.user._id })
      .populate("assignedSubjects.subjectId", "name code")
      .populate("assignedSubjects.groups", "name semester")
      .populate("moduleLeaderSubjects", "name code"); // Populate module leader subjects

    if (!teacher) {
      return res.status(404).json({ message: "Teacher profile not found" });
    }

    const totalAssignments = await Assignment.countDocuments({ teacherId: teacher._id });
    const activeAssignments = await Assignment.countDocuments({
      teacherId: teacher._id,
      deadline: { $gte: new Date() }
    });

    const totalPosts = await Post.countDocuments({ teacherId: teacher._id });

    const assignments = await Assignment.find({ teacherId: teacher._id }).select("_id");
    const assignmentIds = assignments.map(a => a._id);

    const totalSubmissions = await Submission.countDocuments({ 
      assignmentId: { $in: assignmentIds } 
    });
    const ungradedSubmissions = await Submission.countDocuments({
      assignmentId: { $in: assignmentIds },
      status: "pending"
    });

    res.json({
      message: "Dashboard fetched successfully",
      dashboard: {
        teacher: {
          name: req.user.fullName,
          teacherId: teacher.teacherId,
          department: teacher.department,
          isModuleLeader: teacher.isModuleLeader,
          moduleLeaderSubjects: teacher.moduleLeaderSubjects || [], // Add module leader subjects
          assignedSubjects: teacher.assignedSubjects
        },
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
        }
      }
    });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};