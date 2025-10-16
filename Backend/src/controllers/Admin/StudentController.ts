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
      .sort({ createdAt: -1 });

    // If search term provided, filter on client side
    if (search) {
      const searchLower = (search as string).toLowerCase();
      students = students.filter(student => 
        student.userId?.fullName?.toLowerCase().includes(searchLower) ||
        student.userId?.email?.toLowerCase().includes(searchLower) ||
        student.studentId?.toLowerCase().includes(searchLower)
      );
    }

    // Format response with combined user and student data
    const formattedStudents = students.map(student => ({
      _id: student._id,
      userId: student.userId?._id,
      studentId: student.studentId,
      fullName: student.userId?.fullName,
      email: student.userId?.email,
      semester: student.currentSemester,
      academicYear: student.enrollmentYear,
      groupId: student.groupId?._id,
      groupName: student.groupId?.name,
      groupSemester: student.groupId?.semester,
      isApproved: student.userId?.isApproved,
      profileCompleted: student.userId?.profileCompleted,
      status: student.status,
      enrollmentDate: student.enrollmentDate,
      academicHistory: student.academicHistory,
      gpa: student.gpa
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
        select: "name code credits grade"
      });

    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    res.status(200).json({
      message: "Student details fetched successfully",
      student
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
    const { semester, status, gpa } = req.body;

    const student = await Student.findByIdAndUpdate(
      studentId,
      {
        ...(semester && { currentSemester: semester }),
        ...(status && { status }),
        ...(gpa && { gpa })
      },
      { new: true }
    )
      .populate("userId", "fullName email")
      .populate("groupId", "name semester");

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
      .populate("userId", "fullName email")
      .populate("groupId", "name capacity studentCount")
      .sort({ studentId: 1 });

    res.status(200).json({
      message: `Students in semester ${semester} fetched successfully`,
      count: students.length,
      students
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
      .populate("userId", "fullName email")
      .sort({ currentSemester: 1, createdAt: -1 });

    res.status(200).json({
      message: "Unassigned students fetched successfully",
      count: students.length,
      students
    });
  } catch (error: any) {
    console.error("Error fetching unassigned students:", error);
    res.status(500).json({
      message: "Failed to fetch unassigned students",
      error: error.message
    });
  }
};