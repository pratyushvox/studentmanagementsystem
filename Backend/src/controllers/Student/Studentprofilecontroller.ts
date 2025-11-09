
import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import User from "../../models/User.js";
import Student from "../../models/Student.js";
import { uploadFileToCloudinary } from "../../utils/cloudinaryHelper.js";


// ============================================================
// COMPLETE PROFILE (First-Time Login Setup)
// ============================================================

export const completeProfile = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user._id;
    
    const {
      currentSemester,
      enrollmentYear,
      phoneNumber,
      dateOfBirth,
      bio,
      address,
      guardian
    } = req.body;

    // Validate required fields
    if (!currentSemester || !enrollmentYear) {
      return res.status(400).json({ 
        message: "Current semester and enrollment year are required" 
      });
    }

    // Validate semester range
    if (currentSemester < 1 || currentSemester > 8) {
      return res.status(400).json({ 
        message: "Semester must be between 1 and 8" 
      });
    }

    // Find user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.role !== "student") {
      return res.status(403).json({ 
        message: "Only students can complete this profile" 
      });
    }

    // Check if profile already completed
    if (user.profileCompleted) {
      return res.status(400).json({ 
        message: "Profile has already been completed. Use update profile instead." 
      });
    }

    // Find existing student profile
    const student = await Student.findOne({ userId });
    
    if (!student) {
      return res.status(404).json({ 
        message: "Student profile not found. Please contact admin." 
      });
    }

    // Update student profile with complete information
    student.currentSemester = currentSemester;
    student.enrollmentYear = enrollmentYear;
    student.phoneNumber = phoneNumber;
    student.dateOfBirth = dateOfBirth ? new Date(dateOfBirth) : undefined;
    student.bio = bio;
    student.address = address;
    student.guardian = guardian;

    await student.save();

    // Mark user profile as completed
    user.profileCompleted = true;
    await user.save();

    res.status(200).json({
      message: "Profile completed successfully",
      student: {
        _id: student._id,
        studentId: student.studentId,
        currentSemester: student.currentSemester,
        enrollmentYear: student.enrollmentYear,
        phoneNumber: student.phoneNumber,
        dateOfBirth: student.dateOfBirth,
        bio: student.bio,
        address: student.address,
        guardian: student.guardian,
        status: student.status
      }
    });
  } catch (error: any) {
    console.error("Error completing profile:", error);
    res.status(500).json({ 
      message: "Failed to complete profile", 
      error: error.message 
    });
  }
};



// ============================================================
// GET STUDENT PROFILE (Detailed)
// ============================================================

export const getStudentProfile = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user._id;

    const student = await Student.findOne({ userId })
      .populate("groupId", "name semester academicYear")
      .populate("userId", "fullName email profileCompleted")
      .populate("academicHistory.groupId", "name semester")
      .populate("academicHistory.subjects.subjectId", "name code");
     

    if (!student) {
      return res.status(404).json({ message: "Student profile not found" });
    }

    res.status(200).json({
      message: "Student profile fetched successfully",
      student
    });
  } catch (error: any) {
    console.error("Error fetching student profile:", error);
    res.status(500).json({ 
      message: "Failed to fetch student profile", 
      error: error.message 
    });
  }
};

// ============================================================
// UPDATE STUDENT PROFILE (Personal Info Only)
// ============================================================

export const updateStudentProfile = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user._id;
    const { phoneNumber, bio, address, profilePhoto, dateOfBirth, guardian } = req.body;

    const student = await Student.findOne({ userId });
    if (!student) {
      return res.status(404).json({ message: "Student profile not found" });
    }

    // Update allowed fields only
    // NOTE: currentSemester and enrollmentYear are admin-controlled via promotion
    if (phoneNumber !== undefined) student.phoneNumber = phoneNumber;
    if (bio !== undefined) student.bio = bio;
    if (address !== undefined) student.address = address;
    if (profilePhoto !== undefined) student.profilePhoto = profilePhoto;
    if (dateOfBirth !== undefined) {
      student.dateOfBirth = dateOfBirth ? new Date(dateOfBirth) : undefined;
    }
    if (guardian !== undefined) student.guardian = guardian; 

    await student.save();

    res.status(200).json({
      message: "Profile updated successfully",
      student: {
        _id: student._id,
        studentId: student.studentId,
        phoneNumber: student.phoneNumber,
        dateOfBirth: student.dateOfBirth,
        bio: student.bio,
        address: student.address,
        guardian: student.guardian, 
        profilePhoto: student.profilePhoto
      }
    });
  } catch (error: any) {
    console.error("Error updating student profile:", error);
    res.status(500).json({ 
      message: "Failed to update profile", 
      error: error.message 
    });
  }
};

// ============================================================
// UPDATE STUDENT PASSWORD
// ============================================================

export const updateStudentPassword = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user._id;
    const { currentPassword, newPassword, confirmPassword } = req.body;

    // Validate required fields
    if (!currentPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({ 
        message: "Current password, new password, and confirm password are required" 
      });
    }

    // Check if new passwords match
    if (newPassword !== confirmPassword) {
      return res.status(400).json({ 
        message: "New password and confirm password do not match" 
      });
    }

    // Validate password strength
    if (newPassword.length < 6) {
      return res.status(400).json({ 
        message: "New password must be at least 6 characters long" 
      });
    }

    // Find user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isCurrentPasswordValid) {
      return res.status(401).json({ 
        message: "Current password is incorrect" 
      });
    }

    // Check if new password is same as current password
    const isSamePassword = await bcrypt.compare(newPassword, user.password);
    if (isSamePassword) {
      return res.status(400).json({ 
        message: "New password cannot be the same as current password" 
      });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password
    user.password = hashedPassword;
    await user.save();

    res.status(200).json({
      message: "Password updated successfully"
    });
  } catch (error: any) {
    console.error("Error updating password:", error);
    res.status(500).json({ 
      message: "Failed to update password", 
      error: error.message 
    });
  }
};

// ============================================================
// GET ACADEMIC HISTORY
// ============================================================

export const getAcademicHistory = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user._id;

    const student = await Student.findOne({ userId })
      .populate("academicHistory.groupId", "name semester academicYear")
      .populate("academicHistory.subjects.subjectId", "name code")
      .populate("academicHistory.subjects.teacherId", "fullName")
      .select("studentId currentSemester enrollmentYear academicHistory");

    if (!student) {
      return res.status(404).json({ message: "Student profile not found" });
    }

    res.status(200).json({
      message: "Academic history fetched successfully",
      academicHistory: student.academicHistory,
      currentSemester: student.currentSemester,
      studentId: student.studentId
    });
  } catch (error: any) {
    console.error("Error fetching academic history:", error);
    res.status(500).json({ 
      message: "Failed to fetch academic history", 
      error: error.message 
    });
  }
};

// upload propfie picture 
export const uploadProfilePhoto = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user._id;

    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    // Find student
    const student = await Student.findOne({ userId });
    if (!student) {
      return res.status(404).json({ message: "Student profile not found" });
    }

    // Upload to Cloudinary using your helper
    const fileUrl = await uploadFileToCloudinary(req.file.path, "student_profile_photos");

    // Update student profile
    student.profilePhoto = fileUrl;
    await student.save();

    res.status(200).json({
      message: "Profile photo uploaded successfully",
      profilePhoto: student.profilePhoto,
    });
  } catch (error: any) {
    console.error("Error uploading profile photo:", error);
    res.status(500).json({
      message: "Failed to upload profile photo",
      error: error.message,
    });
  }
};

// ============================================================
// CHECK PROFILE COMPLETION STATUS
// ============================================================

export const checkProfileStatus = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user._id;

    const user = await User.findById(userId).select("profileCompleted role");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({
      profileCompleted: user.profileCompleted,
      role: user.role
    });
  } catch (error: any) {
    console.error("Error checking profile status:", error);
    res.status(500).json({ 
      message: "Failed to check profile status", 
      error: error.message 
    });
  }
};