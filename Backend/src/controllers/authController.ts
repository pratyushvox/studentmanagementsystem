import bcrypt from "bcryptjs";
import User from "../models/User";
import { generateToken } from "../utils/generateToken";
import { Request, Response } from "express";

// Student Self-Registration (Requires Approval)
export const registerStudent = async (req: Request, res: Response) => {
  try {
    const { fullName, email, password, grade } = req.body;

    const userExists = await User.findOne({ email });
    if (userExists) return res.status(400).json({ message: "User already exists" });

    const hashedPassword = await bcrypt.hash(password, 10);

    const student = await User.create({
      fullName,
      email,
      password: hashedPassword,
      role: "student",
      grade,
      isApproved: false // Needs admin approval
    });

    res.status(201).json({ message: "Registration successful. Wait for admin approval." });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

// Admin Creates Student (Auto-Approved)
export const createStudent = async (req: Request, res: Response) => {
  try {
    const { fullName, email, password, grade } = req.body;

    const userExists = await User.findOne({ email });
    if (userExists) return res.status(400).json({ message: "User already exists" });

    const hashedPassword = await bcrypt.hash(password, 10);

    const student = await User.create({
      fullName,
      email,
      password: hashedPassword,
      role: "student",
      grade,
      isApproved: true // Auto-approved since admin is creating
    });

    res.status(201).json({ 
      message: "Student created successfully", 
      student: {
        _id: student._id,
        fullName: student.fullName,
        email: student.email,
        role: student.role,
        grade: student.grade,
        isApproved: student.isApproved
      }
    });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

// Admin Creates Teacher
export const createTeacher = async (req: Request, res: Response) => {
  try {
    const { fullName, email, password } = req.body;

    // Regex to enforce domain
    const teacherEmailRegex = /^[a-zA-Z0-9._%+-]+@teacher\.padhaihub\.edu\.np$/;

    if (!teacherEmailRegex.test(email)) {
      return res.status(400).json({ message: "Email must be from @teacher.padhaihub.edu.np domain" });
    }

    const userExists = await User.findOne({ email });
    if (userExists) return res.status(400).json({ message: "User already exists" });

    const hashedPassword = await bcrypt.hash(password, 10);

    const teacher = await User.create({
      fullName,
      email,
      password: hashedPassword,
      role: "teacher",
      isApproved: true
    });

    res.status(201).json({ message: "Teacher created successfully", teacher });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

// Login (Admin / Student / Teacher)
export const loginUser = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (!user) return res.status(404).json({ message: "User not found" });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ message: "Invalid credentials" });

    if (user.role === "student" && !user.isApproved) {
      return res.status(403).json({ message: "Please wait for admin approval." });
    }

    const token = generateToken(user._id.toString(), user.role);
    res.json({ token, role: user.role, fullName: user.fullName });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

// Admin Approves Student
export const approveStudent = async (req: Request, res: Response) => {
  try {
    const { studentId } = req.params;
    const student = await User.findByIdAndUpdate(
      studentId, 
      { isApproved: true }, 
      { new: true }
    );

    if (!student) return res.status(404).json({ message: "Student not found" });

    res.json({ message: "Student approved successfully", student });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
}