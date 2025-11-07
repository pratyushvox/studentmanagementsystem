import { Request, Response } from "express";
import User from "../../models/User";
import Student from "../../models/Student";

// Get All Students with Detailed Information
export const getAllStudentsWithDetails = async (req: Request, res: Response) => {
  try {
    const { semester, status, search } = req.query;

    // Build query for Student collection
    const query: any = {};

    if (semester) {
      query.currentSemester = parseInt(semester as string);
    }

    if (status) {
      query.status = status;
    }

    // Fetch all students with populated references
    let students = await Student.find(query)
      .populate({
        path: "userId",
        select: "fullName email isApproved profileCompleted role",
        model: User
      })
      .populate({
        path: "groupId",
        select: "name semester academicYear capacity studentCount",
      })
      .populate({
        path: "academicHistory.groupId",
        select: "name semester"
      })
      .populate({
        path: "academicHistory.subjects.subjectId",
        select: "name code"
      })
      .populate({
        path: "academicHistory.subjects.teacherId",
        select: "fullName email"
      })
      .sort({ createdAt: -1 });

    // If search term provided, filter on client side
    if (search) {
      const searchLower = (search as string).toLowerCase();
      students = students.filter(student => 
        student.userId?.fullName?.toLowerCase().includes(searchLower) ||
        student.userId?.email?.toLowerCase().includes(searchLower) ||
        student.studentId?.toLowerCase().includes(searchLower) ||
        student.fullName?.toLowerCase().includes(searchLower)
      );
    }

    // Format response with combined user and student data
    const formattedStudents = students.map(student => ({
      // Basic Info
      _id: student._id,
      userId: student.userId?._id,
      studentId: student.studentId,
      fullName: student.fullName || student.userId?.fullName,
      email: student.userId?.email,
      
      // Academic Info
      semester: student.currentSemester,
      enrollmentYear: student.enrollmentYear,
      status: student.status,
      
      // Group Info
      groupId: student.groupId?._id,
      groupName: student.groupId?.name,
      groupSemester: student.groupId?.semester,
      
      // User Status
      isApproved: student.userId?.isApproved,
      profileCompleted: student.userId?.profileCompleted,
      
      // Personal Details (from Student model)
      phoneNumber: student.phoneNumber,
      dateOfBirth: student.dateOfBirth,
      bio: student.bio,
      profilePhoto: student.profilePhoto,
      
      // Address Details
      address: student.address ? {
        city: student.address.city,
        province: student.address.province
      } : undefined,
      
      // Guardian Details
      guardian: student.guardian ? {
        name: student.guardian.name,
        relationship: student.guardian.relationship,
        phoneNumber: student.guardian.phoneNumber,
        email: student.guardian.email
      } : undefined,
      
      // Academic History
      academicHistory: student.academicHistory.map(history => ({
        semester: history.semester,
        groupId: history.groupId?._id,
        groupName: history.groupId?.name,
        subjects: history.subjects.map(subject => ({
          subjectId: subject.subjectId?._id,
          subjectName: subject.subjectId?.name,
          subjectCode: subject.subjectId?.code,
          teacherId: subject.teacherId?._id,
          teacherName: (subject.teacherId as any)?.fullName,
          weeklyAssignments: subject.weeklyAssignments,
          mainAssignment: subject.mainAssignment,
          totalMarks: subject.totalMarks,
          percentage: subject.percentage,
          grade: subject.grade,
          passed: subject.passed
        })),
        semesterPassed: history.semesterPassed,
        promotedAt: history.promotedAt,
        promotedBy: history.promotedBy
      })),
      
      // Timestamps
      createdAt: student.createdAt,
      updatedAt: student.updatedAt
    }));

    res.status(200).json({
      message: "Students fetched successfully",
      count: formattedStudents.length,
      students: formattedStudents
    });
  } catch (error: any) {
    console.error("Error fetching students with details:", error);
    res.status(500).json({
      message: "Failed to fetch students",
      error: error.message
    });
  }
};

// Get Single Student with Full Details (for detail view/modal)
export const getStudentDetails = async (req: Request, res: Response) => {
  try {
    const { studentId } = req.params;

    const student = await Student.findById(studentId)
      .populate({
        path: "userId",
        select: "-password",
        model: User
      })
      .populate({
        path: "groupId",
        select: "name semester academicYear capacity studentCount"
      })
      .populate({
        path: "academicHistory.groupId",
        select: "name semester"
      })
      .populate({
        path: "academicHistory.subjects.subjectId",
        select: "name code credits"
      })
      .populate({
        path: "academicHistory.subjects.teacherId",
        select: "fullName email"
      })
      .populate({
        path: "academicHistory.promotedBy",
        select: "fullName email"
      });

    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    // Format the response to include all student details
    const formattedStudent = {
      // Basic Info
      _id: student._id,
      userId: student.userId?._id,
      studentId: student.studentId,
      fullName: student.fullName,
      email: student.userId?.email,
      
      // Academic Info
      currentSemester: student.currentSemester,
      enrollmentYear: student.enrollmentYear,
      status: student.status,
      
      // Group Info
      groupId: student.groupId?._id,
      group: student.groupId ? {
        _id: student.groupId._id,
        name: student.groupId.name,
        semester: student.groupId.semester,
        academicYear: student.groupId.academicYear,
        capacity: student.groupId.capacity,
        studentCount: student.groupId.studentCount
      } : undefined,
      
      // Personal Details
      phoneNumber: student.phoneNumber,
      dateOfBirth: student.dateOfBirth,
      bio: student.bio,
      profilePhoto: student.profilePhoto,
      
      // Address Details
      address: student.address,
      
      // Guardian Details
      guardian: student.guardian,
      
      // Academic History
      academicHistory: student.academicHistory.map(history => ({
        semester: history.semester,
        groupId: history.groupId?._id,
        group: history.groupId ? {
          _id: history.groupId._id,
          name: history.groupId.name,
          semester: history.groupId.semester
        } : undefined,
        subjects: history.subjects.map(subject => ({
          subjectId: subject.subjectId?._id,
          subject: subject.subjectId ? {
            _id: subject.subjectId._id,
            name: subject.subjectId.name,
            code: subject.subjectId.code,
            credits: (subject.subjectId as any).credits
          } : undefined,
          teacherId: subject.teacherId?._id,
          teacher: subject.teacherId ? {
            _id: subject.teacherId._id,
            fullName: (subject.teacherId as any).fullName,
            email: (subject.teacherId as any).email
          } : undefined,
          weeklyAssignments: subject.weeklyAssignments,
          mainAssignment: subject.mainAssignment,
          totalMarks: subject.totalMarks,
          percentage: subject.percentage,
          grade: subject.grade,
          passed: subject.passed
        })),
        semesterPassed: history.semesterPassed,
        promotedAt: history.promotedAt,
        promotedBy: history.promotedBy ? {
          _id: history.promotedBy._id,
          fullName: (history.promotedBy as any).fullName,
          email: (history.promotedBy as any).email
        } : undefined
      })),
      
      // Timestamps
      createdAt: student.createdAt,
      updatedAt: student.updatedAt
    };

    res.status(200).json({
      message: "Student details fetched successfully",
      student: formattedStudent
    });
  } catch (error: any) {
    console.error("Error fetching student details:", error);
    res.status(500).json({
      message: "Failed to fetch student details",
      error: error.message
    });
  }
};

// Update Student Details (admin only)
export const updateStudentDetails = async (req: Request, res: Response) => {
  try {
    const { studentId } = req.params;
    const updates = req.body;

    // Fields that can be updated by admin
    const allowedUpdates = [
      'currentSemester', 
      'status', 
      'phoneNumber', 
      'dateOfBirth', 
      'bio', 
      'profilePhoto',
      'address',
      'guardian'
    ];

    const updateData: any = {};
    
    allowedUpdates.forEach(field => {
      if (updates[field] !== undefined) {
        updateData[field] = updates[field];
      }
    });

    const student = await Student.findByIdAndUpdate(
      studentId,
      updateData,
      { new: true, runValidators: true }
    )
      .populate("userId", "fullName email isApproved")
      .populate("groupId", "name semester")
      .populate("academicHistory.groupId", "name semester")
      .populate("academicHistory.subjects.subjectId", "name code");

    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    res.status(200).json({
      message: "Student updated successfully",
      student
    });
  } catch (error: any) {
    console.error("Error updating student:", error);
    res.status(500).json({
      message: "Failed to update student",
      error: error.message
    });
  }
};

// Get Students by Semester (useful for group assignment)
export const getStudentsBySemester = async (req: Request, res: Response) => {
  try {
    const { semester } = req.params;

    const students = await Student.find({ currentSemester: parseInt(semester) })
      .populate("userId", "fullName email isApproved")
      .populate("groupId", "name capacity studentCount")
      .populate("academicHistory.groupId", "name semester")
      .sort({ studentId: 1 });

    res.status(200).json({
      message: `Students in semester ${semester} fetched successfully`,
      count: students.length,
      students: students.map(student => ({
        _id: student._id,
        studentId: student.studentId,
        fullName: student.fullName,
        email: student.userId?.email,
        semester: student.currentSemester,
        groupId: student.groupId?._id,
        groupName: student.groupId?.name,
        isApproved: student.userId?.isApproved,
        status: student.status,
        phoneNumber: student.phoneNumber,
        dateOfBirth: student.dateOfBirth
      }))
    });
  } catch (error: any) {
    console.error("Error fetching students by semester:", error);
    res.status(500).json({
      message: "Failed to fetch students",
      error: error.message
    });
  }
};

// Get Unassigned Students (no group)
export const getUnassignedStudents = async (req: Request, res: Response) => {
  try {
    const students = await Student.find({ groupId: null })
      .populate("userId", "fullName email isApproved")
      .populate("academicHistory.groupId", "name semester")
      .sort({ currentSemester: 1, createdAt: -1 });

    res.status(200).json({
      message: "Unassigned students fetched successfully",
      count: students.length,
      students: students.map(student => ({
        _id: student._id,
        studentId: student.studentId,
        fullName: student.fullName,
        email: student.userId?.email,
        semester: student.currentSemester,
        isApproved: student.userId?.isApproved,
        status: student.status,
        phoneNumber: student.phoneNumber,
        dateOfBirth: student.dateOfBirth,
        academicHistory: student.academicHistory
      }))
    });
  } catch (error: any) {
    console.error("Error fetching unassigned students:", error);
    res.status(500).json({
      message: "Failed to fetch unassigned students",
      error: error.message
    });
  }
};