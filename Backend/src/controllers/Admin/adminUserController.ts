import { Request, Response } from "express";
import User from "../../models/User";
import Assignment from "../../models/Assignment";
import Post from "../../models/Post";

//  Get all users 
export const getAllUsers = async (_req: Request, res: Response) => {
  try {
    const users = await User.find().select("-password");
    res.status(200).json(users);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

//  Get user profile with activity
export const getUserById = async (req: Request, res: Response) => {
  try {
    const user = await User.findById(req.params.id).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });

    const posts = await Post.countDocuments({ teacherId: user._id });
    const assignments = await Assignment.countDocuments({ teacherId: user._id });

    res.status(200).json({ user, stats: { posts, assignments } });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

//  Update user
export const updateAnyUser = async (req: Request, res: Response) => {
  try {
    const updated = await User.findByIdAndUpdate(req.params.id, req.body, { new: true }).select("-password");
    if (!updated) return res.status(404).json({ message: "User not found" });
    res.status(200).json(updated);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

//  Delete user
export const deleteAnyUser = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id);
    if (!user) return res.status(404).json({ message: "User not found" });

    // Delete related data based on role
    if (user.role === "teacher") {
      await Assignment.deleteMany({ teacherId: id });
      await Post.deleteMany({ teacherId: id });
    }
    
    await User.findByIdAndDelete(id);
    res.status(200).json({ message: "User and related data deleted" });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

//  Promote all students to next grade
export const promoteAllStudents = async (_req: Request, res: Response) => {
  try {
    // Get all students with valid grades
    const students = await User.find({ 
      role: "student",
      grade: { $in: ["9", "10", "11", "12"] }
    });
    
    let promoted = 0;
    let skipped = 0; // Grade 12 students
    const errors: string[] = [];

    for (const student of students) {
      const currentGrade = parseInt(student.grade || "0");
      
      // Validate grade
      if (!currentGrade || currentGrade < 9 || currentGrade > 12) {
        errors.push(`Invalid grade for student ${student.fullName}: ${student.grade}`);
        continue;
      }

      // Skip Grade 12 students (they graduate)
      if (currentGrade === 12) {
        skipped++;
        continue;
      }

      // Promote students from grade 9-11 to next grade
      try {
        await User.findByIdAndUpdate(student._id, { 
          grade: (currentGrade + 1).toString() 
        });
        promoted++;
      } catch (err: any) {
        errors.push(`Failed to promote ${student.fullName}: ${err.message}`);
      }
    }

    res.status(200).json({ 
      success: true,
      message: "Grade promotion completed",
      promoted,
      skipped, // Grade 12 students not promoted
      total: students.length,
      errors: errors.length > 0 ? errors : undefined
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

//  Promote specific grade to next level
export const promoteGrade = async (req: Request, res: Response) => {
  try {
    const { grade } = req.params;
    const gradeNum = parseInt(grade);

    // Validate grade
    if (isNaN(gradeNum) || gradeNum < 9 || gradeNum > 11) {
      return res.status(400).json({ 
        message: "Can only promote grades 9, 10, or 11. Grade 12 students graduate and cannot be promoted." 
      });
    }

    // Check if any students exist in this grade
    const studentsInGrade = await User.countDocuments({ 
      role: "student", 
      grade: grade 
    });

    if (studentsInGrade === 0) {
      return res.status(404).json({ 
        message: `No students found in Grade ${grade}` 
      });
    }

    // Promote all students in this grade
    const result = await User.updateMany(
      { role: "student", grade: grade },
      { $set: { grade: (gradeNum + 1).toString() } }
    );

    res.status(200).json({ 
      success: true,
      message: `Grade ${grade} promoted to Grade ${gradeNum + 1}`,
      studentsPromoted: result.modifiedCount,
      studentsInGrade
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

//  Get grade statistics
export const getGradeStats = async (_req: Request, res: Response) => {
  try {
    const grades = ["9", "10", "11", "12"];
    const stats = await Promise.all(
      grades.map(async (grade) => {
        const total = await User.countDocuments({ role: "student", grade });
        const approved = await User.countDocuments({ role: "student", grade, isApproved: true });
        return {
          grade,
          total,
          approved,
          pending: total - approved
        };
      })
    );

    res.status(200).json(stats);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};