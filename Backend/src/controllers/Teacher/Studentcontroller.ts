import { Request, Response } from "express";
import Student from "../../models/Student";
import User from "../../models/User";
import Teacher from "../../models/Teacher";

// Extended Request type with authenticated user
interface AuthRequest extends Request {
  user?: {
    _id: string;
    role: string;
  };
}

// Get All Students Taught by Current Teacher
export const getMyStudents = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?._id;
    const { semester, search } = req.query;

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    // Find the teacher document
    const teacher = await Teacher.findOne({ userId });
    
    if (!teacher) {
      return res.status(404).json({ message: "Teacher profile not found" });
    }

    const teacherId = teacher._id;

    // Build query to find students who have this teacher in their academic history
    const matchQuery: any = {
      "academicHistory.subjects.teacherId": teacherId
    };

    // Add semester filter if provided
    if (semester) {
      matchQuery.currentSemester = parseInt(semester as string);
    }

    let students = await Student.find(matchQuery)
      .populate({
        path: "userId",
        select: "fullName email isApproved profileCompleted",
        model: User
      })
      .populate({
        path: "groupId",
        select: "name semester academicYear"
      })
      .sort({ fullName: 1 });

    // Apply search filter if provided
    if (search) {
      const searchLower = (search as string).toLowerCase();
      students = students.filter(student => 
        student.fullName?.toLowerCase().includes(searchLower) ||
        student.studentId?.toLowerCase().includes(searchLower) ||
        student.userId?.email?.toLowerCase().includes(searchLower)
      );
    }

    // Format response
    const formattedStudents = students.map(student => ({
      _id: student._id,
      studentId: student.studentId,
      fullName: student.fullName,
      email: student.userId?.email,
      currentSemester: student.currentSemester,
      enrollmentYear: student.enrollmentYear,
      status: student.status,
      
      // Group Info
      groupId: student.groupId?._id,
      groupName: student.groupId?.name,
      groupSemester: student.groupId?.semester,
      
      // Profile
      profilePhoto: student.profilePhoto,
      phoneNumber: student.phoneNumber,
      dateOfBirth: student.dateOfBirth,
      bio: student.bio,
      
      // Address
      address: student.address,
      
      // User status
      isApproved: student.userId?.isApproved,
      profileCompleted: student.userId?.profileCompleted,
      
      createdAt: student.createdAt,
      updatedAt: student.updatedAt
    }));

    res.status(200).json({
      message: "Students fetched successfully",
      count: formattedStudents.length,
      students: formattedStudents
    });
  } catch (error: any) {
    console.error("Error fetching students:", error);
    res.status(500).json({
      message: "Failed to fetch students",
      error: error.message
    });
  }
};

// Get Single Student Details
export const getStudentDetails = async (req: AuthRequest, res: Response) => {
  try {
    const { studentId } = req.params;
    const userId = req.user?._id;

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    // Find teacher document
    const teacher = await Teacher.findOne({ userId });
    
    if (!teacher) {
      return res.status(404).json({ message: "Teacher profile not found" });
    }

    const teacherId = teacher._id;

    const student = await Student.findById(studentId)
      .populate({
        path: "userId",
        select: "fullName email isApproved profileCompleted"
      })
      .populate({
        path: "groupId",
        select: "name semester academicYear capacity studentCount"
      });

    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    // Check if teacher teaches this student
    const teachesStudent = student.academicHistory.some(history =>
      history.subjects.some(sub => sub.teacherId.toString() === teacherId.toString())
    );

    if (!teachesStudent) {
      return res.status(403).json({ 
        message: "You don't have permission to view this student's details" 
      });
    }

    // Format the response
    const formattedStudent = {
      _id: student._id,
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
      } : null,
      
      // Personal Info
      profilePhoto: student.profilePhoto,
      phoneNumber: student.phoneNumber,
      dateOfBirth: student.dateOfBirth,
      bio: student.bio,
      
      // Address
      address: student.address,
      
      // Guardian Info
      guardian: student.guardian,
      
      // User Status
      isApproved: student.userId?.isApproved,
      profileCompleted: student.userId?.profileCompleted,
      
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