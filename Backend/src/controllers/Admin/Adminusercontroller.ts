import { Request, Response } from "express";
import User from "../../models/User";
import Student from "../../models/Student";
import Teacher from "../../models/Teacher"; // If you have this

// Get All Users (with filters - handles pending students too!)
export const getAllUsers = async (req: Request, res: Response) => {
  try {
    const { role, isApproved, search } = req.query;

    // Build query
    const query: any = {};
    
    if (role) {
      query.role = role;
    }
    
    if (isApproved !== undefined) {
      query.isApproved = isApproved === "true";
    }

    if (search) {
      query.$or = [
        { fullName: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } }
      ];
    }

    const users = await User.find(query)
      .select("-password")
      .sort({ createdAt: -1 });

    res.status(200).json(users);
  } catch (error: any) {
    console.error("Error fetching users:", error);
    res.status(500).json({ 
      message: "Failed to fetch users", 
      error: error.message 
    });
  }
};

// Get User by ID
export const getUserById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id).select("-password");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // If student, get additional student info
    let additionalInfo = null;
    if (user.role === "student") {
      additionalInfo = await Student.findOne({ userId: id })
        .populate("groupId", "name semester")
        .populate("academicHistory.groupId", "name semester");
    }

    res.status(200).json({
      ...user.toObject(),
      studentInfo: additionalInfo
    });
  } catch (error: any) {
    console.error("Error fetching user:", error);
    res.status(500).json({ 
      message: "Failed to fetch user", 
      error: error.message 
    });
  }
};

//admin creating the student
export const createStudent = async (req: Request, res: Response) => {
  try {
    const { fullName, email, password, enrollmentYear, semester } = req.body;

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // Create User
    const user = await User.create({
      fullName,
      email,
      password: hashedPassword,
      role: "student",
      isApproved: true // Auto-approved since admin is creating
    });

    // Generate unique student ID
    const year = new Date().getFullYear().toString().slice(-2);
    const count = await Student.countDocuments();
    const studentId = `STU${year}${String(count + 1).padStart(4, "0")}`;

    // Create Student Profile
    const student = await Student.create({
      userId: user._id,
      studentId,
      currentSemester: semester || 1,
      enrollmentYear: enrollmentYear || new Date().getFullYear(),
      status: "active"
    });

    res.status(201).json({ 
      message: "Student created successfully", 
      student: {
        _id: student._id,
        userId: user._id,
        studentId: student.studentId,
        fullName: user.fullName,
        email: user.email,
        currentSemester: student.currentSemester,
        enrollmentYear: student.enrollmentYear,
        isApproved: user.isApproved
      }
    });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};
// Approve Student
export const approveStudent = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.role !== "student") {
      return res.status(400).json({ message: "User is not a student" });
    }

    if (user.isApproved) {
      return res.status(400).json({ message: "Student is already approved" });
    }

    // Approve the user
    user.isApproved = true;
    await user.save();

    res.status(200).json({ 
      message: "Student approved successfully", 
      user: {
        _id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        isApproved: user.isApproved
      }
    });
  } catch (error: any) {
    console.error("Error approving student:", error);
    res.status(500).json({ 
      message: "Failed to approve student", 
      error: error.message 
    });
  }
};

// Delete User (handles rejection too)
export const deleteUser = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Prevent deleting admin users
    if (user.role === "admin") {
      return res.status(403).json({ message: "Cannot delete admin users" });
    }

    // If student, also delete student record
    if (user.role === "student") {
      await Student.findOneAndDelete({ userId: id });
    }

    // If teacher, also delete teacher record
    if (user.role === "teacher") {
      await Teacher.findOneAndDelete({ userId: id }).catch(() => {});
    }

    await User.findByIdAndDelete(id);

    res.status(200).json({ 
      message: "User deleted successfully",
      deletedUser: {
        _id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role
      }
    });
  } catch (error: any) {
    console.error("Error deleting user:", error);
    res.status(500).json({ 
      message: "Failed to delete user", 
      error: error.message 
    });
  }
};

// Update User (role or approval status)
export const updateUser = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { role, isApproved } = req.body;

    const user = await User.findById(id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Prevent changing admin role
    if (user.role === "admin" && role && role !== "admin") {
      return res.status(403).json({ message: "Cannot change admin role" });
    }

    if (role) user.role = role;
    if (isApproved !== undefined) user.isApproved = isApproved;

    await user.save();

    res.status(200).json({ 
      message: "User updated successfully", 
      user: {
        _id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        isApproved: user.isApproved
      }
    });
  } catch (error: any) {
    console.error("Error updating user:", error);
    res.status(500).json({ 
      message: "Failed to update user", 
      error: error.message 
    });
  }
};
//admin creates teacher 


export const createTeacher = async (req: Request, res: Response) => {
  try {
    const { fullName, email, password, department, specialization } = req.body;

    // Regex to enforce domain
    const teacherEmailRegex = /^[a-zA-Z0-9._%+-]+@teacher\.padhaihub\.edu\.np$/;

    if (!teacherEmailRegex.test(email)) {
      return res.status(400).json({ 
        message: "Email must be from @teacher.padhaihub.edu.np domain"
      });
    }

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // Create User
    const user = await User.create({
      fullName,
      email,
      password: hashedPassword,
      role: "teacher",
      isApproved: true
    });

    // Generate unique teacher ID
    const year = new Date().getFullYear().toString().slice(-2);
    const count = await Teacher.countDocuments();
    const teacherId = `TCH${year}${String(count + 1).padStart(4, "0")}`;

    // Create Teacher Profile
    const teacher = await Teacher.create({
      userId: user._id,
      teacherId,
      department,
      specialization,
      assignedSubjects: []
    });

    res.status(201).json({ 
      message: "Teacher created successfully", 
      teacher: {
        _id: teacher._id,
        userId: user._id,
        teacherId: teacher.teacherId,
        fullName: user.fullName,
        email: user.email,
        department: teacher.department,
        specialization: teacher.specialization
      }
    });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};
