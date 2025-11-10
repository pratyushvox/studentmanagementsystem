import { Request, Response } from "express";
import Teacher from "../../models/Teacher";
import User from "../../models/User";
import Student from "../../models/Student";

// Extended Request type with authenticated user
interface AuthRequest extends Request {
  user?: {
    _id: string;
    role: string;
  };
}

// Get ALL Teachers (No filtering by semester/group)
export const getMyTeachers = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?._id;
    const { search, department } = req.query;

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    // Build query - NO semester/group filtering
    const matchQuery: any = {};

    // Add department filter if provided
    if (department) {
      matchQuery.department = department;
    }

    let teachers = await Teacher.find(matchQuery)
      .populate({
        path: "userId",
        select: "isApproved profileCompleted"
      })
      .populate({
        path: "assignedSubjects.subjectId",
        select: "name code"
      })
      .populate({
        path: "moduleLeaderSubjects",
        select: "name code"
      })
      .sort({ fullName: 1 });

    // Apply search filter if provided
    if (search) {
      const searchLower = (search as string).toLowerCase();
      teachers = teachers.filter(teacher => 
        teacher.fullName?.toLowerCase().includes(searchLower) ||
        teacher.teacherId?.toLowerCase().includes(searchLower) ||
        teacher.email?.toLowerCase().includes(searchLower) ||
        teacher.department?.toLowerCase().includes(searchLower) ||
        teacher.specialization?.toLowerCase().includes(searchLower)
      );
    }

    // Format response - include ALL subjects
    const formattedTeachers = teachers.map(teacher => {
      // Get ALL subjects this teacher teaches (not filtered by student)
      const allSubjects = teacher.assignedSubjects.map(subject => ({
        _id: subject.subjectId._id,
        name: (subject.subjectId as any).name,
        code: (subject.subjectId as any).code,
        semester: subject.semester
      }));

      return {
        _id: teacher._id,
        teacherId: teacher.teacherId,
        fullName: teacher.fullName,
        email: teacher.email,
        
        // Professional Info
        department: teacher.department,
        specialization: teacher.specialization,
        isModuleLeader: teacher.isModuleLeader,
        
        // ALL subjects taught by this teacher
        subjects: allSubjects,
        moduleLeaderSubjects: teacher.moduleLeaderSubjects,
        
        // Profile
        profilePhoto: teacher.profilePhoto,
        
        // User status
        isApproved: teacher.userId?.isApproved,
        profileCompleted: teacher.userId?.profileCompleted,
        
        createdAt: teacher.createdAt,
        updatedAt: teacher.updatedAt
      };
    });

    res.status(200).json({
      message: "All teachers fetched successfully",
      count: formattedTeachers.length,
      teachers: formattedTeachers
    });
  } catch (error: any) {
    console.error("Error fetching teachers:", error);
    res.status(500).json({
      message: "Failed to fetch teachers",
      error: error.message
    });
  }
};

// Get Single Teacher Details (No student validation)
export const getTeacherDetails = async (req: AuthRequest, res: Response) => {
  try {
    const { teacherId } = req.params;

    const teacher = await Teacher.findById(teacherId)
      .populate({
        path: "userId",
        select: "isApproved profileCompleted"
      })
      .populate({
        path: "assignedSubjects.subjectId",
        select: "name code credits description"
      })
      .populate({
        path: "moduleLeaderSubjects",
        select: "name code credits description"
      })
      .populate({
        path: "assignedSubjects.groups",
        select: "name semester academicYear"
      });

    if (!teacher) {
      return res.status(404).json({ message: "Teacher not found" });
    }

    // Get ALL subjects this teacher teaches
    const allSubjects = teacher.assignedSubjects.map(subject => ({
      _id: subject.subjectId._id,
      name: (subject.subjectId as any).name,
      code: (subject.subjectId as any).code,
      credits: (subject.subjectId as any).credits,
      description: (subject.subjectId as any).description,
      semester: subject.semester,
      groups: subject.groups.map((group: any) => ({
        _id: group._id,
        name: group.name,
        semester: group.semester,
        academicYear: group.academicYear
      }))
    }));

    // Format the response
    const formattedTeacher = {
      _id: teacher._id,
      teacherId: teacher.teacherId,
      fullName: teacher.fullName,
      email: teacher.email,
      
      // Professional Info
      department: teacher.department,
      specialization: teacher.specialization,
      isModuleLeader: teacher.isModuleLeader,
      
      // ALL subjects taught
      subjects: allSubjects,
      moduleLeaderSubjects: teacher.moduleLeaderSubjects,
      
      // Contact Info
      profilePhoto: teacher.profilePhoto,
      
      // User Status
      isApproved: teacher.userId?.isApproved,
      profileCompleted: teacher.userId?.profileCompleted,
      
      // Timestamps
      createdAt: teacher.createdAt,
      updatedAt: teacher.updatedAt
    };

    res.status(200).json({
      message: "Teacher details fetched successfully",
      teacher: formattedTeacher
    });
  } catch (error: any) {
    console.error("Error fetching teacher details:", error);
    res.status(500).json({
      message: "Failed to fetch teacher details",
      error: error.message
    });
  }
};

// Get Available Departments (From ALL teachers)
export const getTeacherDepartments = async (req: AuthRequest, res: Response) => {
  try {
    // Get unique departments from ALL teachers
    const departments = await Teacher.distinct("department", {
      department: { $exists: true, $ne: "" }
    });

    res.status(200).json({
      message: "Departments fetched successfully",
      departments: departments.sort()
    });
  } catch (error: any) {
    console.error("Error fetching departments:", error);
    res.status(500).json({
      message: "Failed to fetch departments",
      error: error.message
    });
  }
};