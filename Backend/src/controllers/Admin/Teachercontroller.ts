import { Request, Response } from "express";
import User from "../../models/User";
import Teacher from "../../models/Teacher";

// Get All Teachers with Detailed Information
export const getAllTeachersWithDetails = async (req: Request, res: Response) => {
  try {
    const { department, search } = req.query;

    // Build query for Teacher collection
    const query: any = {};

    if (department) {
      query.department = department;
    }

    // Fetch all teachers with populated references
    let teachers = await Teacher.find(query)
      .populate({
        path: "userId",
        select: "fullName email isApproved profileCompleted role",
        model: User
      })
      .populate({
        path: "assignedSubjects.subjectId",
        select: "name code credits"
      })
      .populate({
        path: "assignedSubjects.groups",
        select: "name semester academicYear studentCount"
      })
      .sort({ createdAt: -1 });

    // If search term provided, filter on client side
    if (search) {
      const searchLower = (search as string).toLowerCase();
      teachers = teachers.filter(teacher => 
        teacher.userId?.fullName?.toLowerCase().includes(searchLower) ||
        teacher.userId?.email?.toLowerCase().includes(searchLower) ||
        teacher.teacherId?.toLowerCase().includes(searchLower) ||
        teacher.department?.toLowerCase().includes(searchLower)
      );
    }

    // Format response with combined user and teacher data
    const formattedTeachers = teachers.map(teacher => ({
      _id: teacher._id,
      userId: teacher.userId?._id,
      teacherId: teacher.teacherId,
      fullName: teacher.userId?.fullName,
      email: teacher.userId?.email,
      department: teacher.department,
      specialization: teacher.specialization,
      isApproved: teacher.userId?.isApproved,
      profileCompleted: teacher.userId?.profileCompleted,
      assignedSubjectsCount: teacher.assignedSubjects?.length || 0,
      totalGroups: teacher.assignedSubjects?.reduce((sum, subject) => 
        sum + (subject.groups?.length || 0), 0) || 0,
      createdAt: teacher.createdAt
    }));

    res.status(200).json({
      message: "Teachers fetched successfully",
      count: formattedTeachers.length,
      teachers: formattedTeachers
    });
  } catch (error: any) {
    console.error("Error fetching teachers with details:", error);
    res.status(500).json({
      message: "Failed to fetch teachers",
      error: error.message
    });
  }
};

// Get Single Teacher with Full Details (for detail view/modal)
export const getTeacherDetails = async (req: Request, res: Response) => {
  try {
    const { teacherId } = req.params;

    const teacher = await Teacher.findById(teacherId)
      .populate({
        path: "userId",
        select: "-password",
        model: User
      })
      .populate({
        path: "assignedSubjects.subjectId",
        select: "name code credits description"
      })
      .populate({
        path: "assignedSubjects.groups",
        select: "name semester academicYear capacity studentCount"
      });

    if (!teacher) {
      return res.status(404).json({ message: "Teacher not found" });
    }

    res.status(200).json({
      message: "Teacher details fetched successfully",
      teacher
    });
  } catch (error: any) {
    console.error("Error fetching teacher details:", error);
    res.status(500).json({
      message: "Failed to fetch teacher details",
      error: error.message
    });
  }
};

// Update Teacher Details (admin only)
export const updateTeacherDetails = async (req: Request, res: Response) => {
  try {
    const { teacherId } = req.params;
    const { department, specialization } = req.body;

    const teacher = await Teacher.findByIdAndUpdate(
      teacherId,
      {
        ...(department && { department }),
        ...(specialization && { specialization })
      },
      { new: true }
    )
      .populate("userId", "fullName email")
      .populate("assignedSubjects.subjectId", "name code")
      .populate("assignedSubjects.groups", "name semester");

    if (!teacher) {
      return res.status(404).json({ message: "Teacher not found" });
    }

    res.status(200).json({
      message: "Teacher updated successfully",
      teacher
    });
  } catch (error: any) {
    console.error("Error updating teacher:", error);
    res.status(500).json({
      message: "Failed to update teacher",
      error: error.message
    });
  }
};

// Get Teachers with No Assignments
export const getUnassignedTeachers = async (req: Request, res: Response) => {
  try {
    const teachers = await Teacher.find({
      $or: [
        { assignedSubjects: { $size: 0 } },
        { assignedSubjects: { $exists: false } }
      ]
    })
      .populate("userId", "fullName email")
      .sort({ createdAt: -1 });

    res.status(200).json({
      message: "Unassigned teachers fetched successfully",
      count: teachers.length,
      teachers
    });
  } catch (error: any) {
    console.error("Error fetching unassigned teachers:", error);
    res.status(500).json({
      message: "Failed to fetch unassigned teachers",
      error: error.message
    });
  }
};

// Assign Subject to Teacher
export const assignSubjectToTeacher = async (req: Request, res: Response) => {
  try {
    const { teacherId } = req.params;
    const { subjectId, semester, groups } = req.body;

    if (!subjectId || !semester) {
      return res.status(400).json({ 
        message: "Subject ID and semester are required" 
      });
    }

    const teacher = await Teacher.findById(teacherId);

    if (!teacher) {
      return res.status(404).json({ message: "Teacher not found" });
    }

    // Check if subject already assigned
    const existingAssignment = teacher.assignedSubjects.find(
      subject => subject.subjectId.toString() === subjectId && subject.semester === semester
    );

    if (existingAssignment) {
      return res.status(400).json({ 
        message: "Subject already assigned to this teacher for this semester" 
      });
    }

    // Add new subject assignment
    teacher.assignedSubjects.push({
      subjectId,
      semester,
      groups: groups || []
    });

    await teacher.save();

    const updatedTeacher = await Teacher.findById(teacherId)
      .populate("userId", "fullName email")
      .populate("assignedSubjects.subjectId", "name code")
      .populate("assignedSubjects.groups", "name semester");

    res.status(200).json({
      message: "Subject assigned to teacher successfully",
      teacher: updatedTeacher
    });
  } catch (error: any) {
    console.error("Error assigning subject to teacher:", error);
    res.status(500).json({
      message: "Failed to assign subject",
      error: error.message
    });
  }
};

// Remove Subject Assignment from Teacher
export const removeSubjectFromTeacher = async (req: Request, res: Response) => {
  try {
    const { teacherId, subjectId } = req.params;

    const teacher = await Teacher.findById(teacherId);

    if (!teacher) {
      return res.status(404).json({ message: "Teacher not found" });
    }

    // Remove the subject assignment
    teacher.assignedSubjects = teacher.assignedSubjects.filter(
      subject => subject.subjectId.toString() !== subjectId
    );

    await teacher.save();

    const updatedTeacher = await Teacher.findById(teacherId)
      .populate("userId", "fullName email")
      .populate("assignedSubjects.subjectId", "name code")
      .populate("assignedSubjects.groups", "name semester");

    res.status(200).json({
      message: "Subject removed from teacher successfully",
      teacher: updatedTeacher
    });
  } catch (error: any) {
    console.error("Error removing subject from teacher:", error);
    res.status(500).json({
      message: "Failed to remove subject",
      error: error.message
    });
  }
};

// Assign Groups to Teacher's Subject
export const assignGroupsToTeacherSubject = async (req: Request, res: Response) => {
  try {
    const { teacherId, subjectId } = req.params;
    const { groups } = req.body;

    if (!groups || !Array.isArray(groups)) {
      return res.status(400).json({ 
        message: "Groups array is required" 
      });
    }

    const teacher = await Teacher.findById(teacherId);

    if (!teacher) {
      return res.status(404).json({ message: "Teacher not found" });
    }

    // Find the subject assignment
    const subjectAssignment = teacher.assignedSubjects.find(
      subject => subject.subjectId.toString() === subjectId
    );

    if (!subjectAssignment) {
      return res.status(404).json({ 
        message: "Subject not assigned to this teacher" 
      });
    }

    // Update groups
    subjectAssignment.groups = groups;

    await teacher.save();

    const updatedTeacher = await Teacher.findById(teacherId)
      .populate("userId", "fullName email")
      .populate("assignedSubjects.subjectId", "name code")
      .populate("assignedSubjects.groups", "name semester");

    res.status(200).json({
      message: "Groups assigned to teacher's subject successfully",
      teacher: updatedTeacher
    });
  } catch (error: any) {
    console.error("Error assigning groups to teacher's subject:", error);
    res.status(500).json({
      message: "Failed to assign groups",
      error: error.message
    });
  }
};

// Get Teacher's Workload Statistics
export const getTeacherWorkload = async (req: Request, res: Response) => {
  try {
    const { teacherId } = req.params;

    const teacher = await Teacher.findById(teacherId)
      .populate("assignedSubjects.subjectId", "name code credits")
      .populate("assignedSubjects.groups", "name studentCount");

    if (!teacher) {
      return res.status(404).json({ message: "Teacher not found" });
    }

    const workload = {
      totalSubjects: teacher.assignedSubjects.length,
      totalGroups: teacher.assignedSubjects.reduce((sum, subject) => 
        sum + subject.groups.length, 0),
      totalStudents: teacher.assignedSubjects.reduce((sum, subject) => 
        sum + subject.groups.reduce((groupSum: number, group: any) => 
          groupSum + (group.studentCount || 0), 0), 0),
      subjectBreakdown: teacher.assignedSubjects.map(subject => ({
        subjectName: (subject.subjectId as any).name,
        subjectCode: (subject.subjectId as any).code,
        semester: subject.semester,
        groupCount: subject.groups.length,
        studentCount: subject.groups.reduce((sum: number, group: any) => 
          sum + (group.studentCount || 0), 0)
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