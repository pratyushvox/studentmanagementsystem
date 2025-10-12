// controllers/authController.ts
import bcrypt from "bcryptjs";
import User from "../models/User";
import Student from "../models/Student";
import Teacher from "../models/Teacher";
import { generateToken } from "../utils/generateToken";
import { Request, Response } from "express";



// Student Self-Registration (Requires Approval)
export const registerStudent = async (req: Request, res: Response) => {
  try {
    const { fullName, email, password, enrollmentYear } = req.body;

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
      isApproved: false // Needs admin approval 
    });

    // Generate unique student ID
    const year = new Date().getFullYear().toString().slice(-2);
    const count = await Student.countDocuments();
    const studentId = `STU${year}${String(count + 1).padStart(4, "0")}`;

    // Create Student Profile
    await Student.create({
      userId: user._id,
      studentId,
      currentSemester: 1,
      enrollmentYear: enrollmentYear || new Date().getFullYear(),
      status: "active"
    });

    res.status(201).json({ 
      message: "Registration successful. Wait for admin approval.",
      studentId 
    });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};





// ============================================================
// LOGIN
// ============================================================

// Login (Admin / Student / Teacher)
export const loginUser = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    if (user.role === "student" && !user.isApproved) {
      return res.status(403).json({ 
        message: "Please wait for admin approval." 
      });
    }

    const token = generateToken(user._id.toString(), user.role);

    // Get profile data based on role
    let profileData = null;
    if (user.role === "student") {
      profileData = await Student.findOne({ userId: user._id })
        .populate("groupId", "name semester");
    } else if (user.role === "teacher") {
      profileData = await Teacher.findOne({ userId: user._id })
        .populate("assignedSubjects.subjectId", "name code")
        .populate("assignedSubjects.groups", "name semester");
    }

    res.json({ 
      token, 
      role: user.role, 
      fullName: user.fullName,
      profile: profileData
    });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

// ============================================================
// GET PROFILE
// ============================================================

export const getMyProfile = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    const user = await User.findById(req.user._id).select("-password");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    let profile = null;
    if (user.role === "student") {
      profile = await Student.findOne({ userId: user._id })
        .populate("groupId", "name semester academicYear")
        .populate("academicHistory.groupId", "name")
        .populate("academicHistory.subjects.subjectId", "name code");
    } else if (user.role === "teacher") {
      profile = await Teacher.findOne({ userId: user._id })
        .populate("assignedSubjects.subjectId", "name code")
        .populate("assignedSubjects.groups", "name semester");
    }

    res.json({
      message: "Profile fetched successfully",
      user,
      profile
    });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

// ============================================================
// UPDATE PROFILE (Students/Teachers can update basic info)
// ============================================================

export const updateMyProfile = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    const { fullName, email } = req.body;
    const updates: any = {};

    if (fullName) updates.fullName = fullName;
    if (email) {
      // Check if email is already taken
      const exists = await User.findOne({ 
        email, 
        _id: { $ne: req.user._id } 
      });
      if (exists) {
        return res.status(400).json({ message: "Email already in use" });
      }
      updates.email = email;
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      updates,
      { new: true }
    ).select("-password");

    res.json({ message: "Profile updated successfully", user });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

// ============================================================
// CHANGE PASSWORD
// ============================================================

export const changePassword = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ 
        message: "Current password and new password are required" 
      });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const match = await bcrypt.compare(currentPassword, user.password);
    if (!match) {
      return res.status(401).json({ message: "Current password is incorrect" });
    }

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    res.json({ message: "Password changed successfully" });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};