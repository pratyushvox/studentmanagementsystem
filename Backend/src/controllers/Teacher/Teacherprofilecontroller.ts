import { Request, Response } from "express";
import Teacher from "../../models/Teacher";

// Get logged-in teacher's profile with all details
export const getTeacherProfile = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    const teacher = await Teacher.findOne({ userId: req.user._id })
      .populate({
        path: "userId",
        select: "fullName email role profileCompleted"
      })
      .populate({
        path: "assignedSubjects.subjectId",
        select: "name code credits semester description"
      })
      .populate({
        path: "assignedSubjects.groups",
        select: "name semester academicYear capacity studentCount"
      })
      .populate({
        path: "moduleLeaderSubjects",
        select: "name code credits semester description"
      });

    if (!teacher) {
      return res.status(404).json({ message: "Teacher profile not found" });
    }

    // Calculate workload statistics
    const workloadStats = {
      totalSubjects: teacher.assignedSubjects.length,
      totalGroups: teacher.assignedSubjects.reduce((sum, subject) => 
        sum + (subject.groups?.length || 0), 0),
      totalStudents: teacher.assignedSubjects.reduce((sum, subject) => 
        sum + (subject.groups?.reduce((groupSum: number, group: any) => 
          groupSum + (group.studentCount || 0), 0) || 0), 0),
      moduleLeaderSubjectsCount: teacher.moduleLeaderSubjects?.length || 0
    };

    res.status(200).json({
      message: "Teacher profile fetched successfully",
      teacher: {
        _id: teacher._id,
        userId: teacher.userId,
        teacherId: teacher.teacherId,
        fullName: teacher.fullName,
        email: teacher.email || teacher.userId?.email,
        department: teacher.department,
        specialization: teacher.specialization,
        isModuleLeader: teacher.isModuleLeader,
        moduleLeaderSubjects: teacher.moduleLeaderSubjects || [],
        assignedSubjects: teacher.assignedSubjects || [],
        workloadStats,
        createdAt: teacher.createdAt,
        updatedAt: teacher.updatedAt
      }
    });
  } catch (error: any) {
    console.error("Error fetching teacher profile:", error);
    res.status(500).json({
      message: "Failed to fetch teacher profile",
      error: error.message
    });
  }
};

// Get teacher's workload summary
export const getMyWorkload = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    const teacher = await Teacher.findOne({ userId: req.user._id })
      .populate("assignedSubjects.subjectId", "name code credits")
      .populate("assignedSubjects.groups", "name studentCount semester")
      .populate("moduleLeaderSubjects", "name code semester");

    if (!teacher) {
      return res.status(404).json({ message: "Teacher profile not found" });
    }

    const workload = {
      totalSubjects: teacher.assignedSubjects.length,
      moduleLeaderSubjectsCount: teacher.moduleLeaderSubjects?.length || 0,
      totalGroups: teacher.assignedSubjects.reduce((sum, subject) => 
        sum + (subject.groups?.length || 0), 0),
      totalStudents: teacher.assignedSubjects.reduce((sum, subject) => 
        sum + (subject.groups?.reduce((groupSum: number, group: any) => 
          groupSum + (group.studentCount || 0), 0) || 0), 0),
      
      // Breakdown by subject
      subjectBreakdown: teacher.assignedSubjects.map(subject => ({
        subjectId: (subject.subjectId as any)._id,
        subjectName: (subject.subjectId as any).name,
        subjectCode: (subject.subjectId as any).code,
        semester: subject.semester,
        groupCount: subject.groups?.length || 0,
        groups: (subject.groups || []).map((group: any) => ({
          _id: group._id,
          name: group.name,
          studentCount: group.studentCount || 0,
          semester: group.semester
        })),
        studentCount: (subject.groups || []).reduce((sum: number, group: any) => 
          sum + (group.studentCount || 0), 0)
      })),

      // Module leader subjects
      moduleLeaderSubjects: (teacher.moduleLeaderSubjects || []).map((subject: any) => ({
        _id: subject._id,
        name: subject.name,
        code: subject.code,
        semester: subject.semester
      }))
    };

    res.status(200).json({
      message: "Teacher workload fetched successfully",
      workload
    });
  } catch (error: any) {
    console.error("Error fetching teacher workload:", error);
    res.status(500).json({
      message: "Failed to fetch teacher workload",
      error: error.message
    });
  }
};

// Get teacher's assigned subjects with groups
export const getMySubjects = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    const teacher = await Teacher.findOne({ userId: req.user._id })
      .populate({
        path: "assignedSubjects.subjectId",
        select: "name code credits semester description isActive"
      })
      .populate({
        path: "assignedSubjects.groups",
        select: "name semester academicYear capacity studentCount isActive"
      })
      .populate({
        path: "moduleLeaderSubjects",
        select: "name code credits semester description isActive"
      });

    if (!teacher) {
      return res.status(404).json({ message: "Teacher profile not found" });
    }

    res.status(200).json({
      message: "Teacher subjects fetched successfully",
      assignedSubjects: teacher.assignedSubjects || [],
      moduleLeaderSubjects: teacher.moduleLeaderSubjects || [],
      isModuleLeader: teacher.isModuleLeader
    });
  } catch (error: any) {
    console.error("Error fetching teacher subjects:", error);
    res.status(500).json({
      message: "Failed to fetch teacher subjects",
      error: error.message
    });
  }
};