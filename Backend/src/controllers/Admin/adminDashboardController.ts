import { Request, Response } from "express";
import User from "../../models/User";
import Student from "../../models/Student";
import Subject from "../../models/Subject";
import Group from "../../models/Group";
import Assignment from "../../models/Assignment";
import Post from "../../models/Post";

// Get Dashboard Statistics - ONLY COUNTS, NO DUPLICATION
export const getDashboardStats = async (req: Request, res: Response) => {
  try {
    // Count total students (approved only)
    const totalStudents = await User.countDocuments({ 
      role: "student", 
      isApproved: true 
    });

    // Count total teachers (approved only)
    const totalTeachers = await User.countDocuments({ 
      role: "teacher", 
      isApproved: true 
    });

    // Count total subjects
    const totalSubjects = await Subject.countDocuments();

    // Count total groups
    const totalGroups = await Group.countDocuments();

    // Count total posts (optional - if you have Post model)
    const totalPosts = await Post.countDocuments().catch(() => 0);

    // Count pending approvals
    const pendingApprovals = await User.countDocuments({ 
      role: "student", 
      isApproved: false 
    });

    res.status(200).json({
      totalStudents,
      totalTeachers,
      totalSubjects,
      totalGroups,
      totalPosts,
      pendingApprovals,
      success: true
    });
  } catch (error: any) {
    console.error("Error fetching dashboard stats:", error);
    res.status(500).json({ 
      message: "Failed to fetch dashboard statistics", 
      error: error.message 
    });
  }
};

// Get Semester Statistics (Student distribution across semesters)
export const getSemesterStats = async (req: Request, res: Response) => {
  try {
    const semesterStats = [];

    // Loop through semesters 1-8
    for (let semester = 1; semester <= 8; semester++) {
      // Count total students in this semester
      const totalStudents = await Student.countDocuments({ 
        currentSemester: semester 
      });

      // Count active students
      const activeStudents = await Student.countDocuments({ 
        currentSemester: semester,
        status: "active"
      });

      // Count groups for this semester
      const groups = await Group.countDocuments({ semester });

      semesterStats.push({
        semester,
        totalStudents,
        activeStudents,
        groups
      });
    }

    res.status(200).json(semesterStats);
  } catch (error: any) {
    console.error("Error fetching semester stats:", error);
    res.status(500).json({ 
      message: "Failed to fetch semester statistics", 
      error: error.message 
    });
  }
};