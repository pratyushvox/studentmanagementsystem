import { Request, Response } from "express";
import Teacher from "../../models/Teacher";
import User from "../../models/User";
import { uploadFileToCloudinary } from "../../utils/cloudinaryHelper";

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
        phoneNumber: teacher.phoneNumber,
        dateOfBirth: teacher.dateOfBirth,
        bio: teacher.bio,
        profilePhoto: teacher.profilePhoto,
        address: teacher.address,
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

// Update teacher's own profile (basic details only)
export const updateMyProfile = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    const updates = req.body;

    // Fields that teachers can update themselves
    const allowedUpdates = [
      'fullName',
      'phoneNumber', 
      'dateOfBirth', 
      'bio', 
      'profilePhoto',
      'address',
      'specialization'
    ];

    // Fields that are read-only (only admin can update)
    const readOnlyFields = [
      'teacherId',
      'email',
      'department',
      'isModuleLeader',
      'moduleLeaderSubjects',
      'assignedSubjects'
    ];

    // Check if user is trying to update read-only fields
    const attemptedReadOnlyUpdates = Object.keys(updates).filter(field => 
      readOnlyFields.includes(field)
    );

    if (attemptedReadOnlyUpdates.length > 0) {
      return res.status(403).json({
        message: "Cannot update protected fields",
        protectedFields: attemptedReadOnlyUpdates,
        note: "These fields can only be updated by administrators"
      });
    }

    // Build update object with only allowed fields
    const updateData: any = {};
    
    allowedUpdates.forEach(field => {
      if (updates[field] !== undefined) {
        updateData[field] = updates[field];
      }
    });

    // If no valid updates provided
    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({
        message: "No valid fields to update",
        allowedFields: allowedUpdates
      });
    }

    // Update teacher profile
    const teacher = await Teacher.findOneAndUpdate(
      { userId: req.user._id },
      updateData,
      { new: true, runValidators: true }
    )
      .populate("userId", "fullName email role")
      .populate("assignedSubjects.subjectId", "name code credits semester")
      .populate("assignedSubjects.groups", "name semester")
      .populate("moduleLeaderSubjects", "name code semester");

    if (!teacher) {
      return res.status(404).json({ message: "Teacher profile not found" });
    }

    // If fullName was updated in Teacher, also update it in User model
    if (updateData.fullName) {
      await User.findByIdAndUpdate(
        req.user._id,
        { fullName: updateData.fullName }
      );
    }

    res.status(200).json({
      message: "Profile updated successfully",
      teacher: {
        _id: teacher._id,
        teacherId: teacher.teacherId,
        fullName: teacher.fullName,
        email: teacher.email,
        phoneNumber: teacher.phoneNumber,
        dateOfBirth: teacher.dateOfBirth,
        bio: teacher.bio,
        profilePhoto: teacher.profilePhoto,
        address: teacher.address,
        department: teacher.department,
        specialization: teacher.specialization,
        isModuleLeader: teacher.isModuleLeader,
        moduleLeaderSubjects: teacher.moduleLeaderSubjects,
        assignedSubjects: teacher.assignedSubjects,
        updatedAt: teacher.updatedAt
      },
      updatedFields: Object.keys(updateData)
    });
  } catch (error: any) {
    console.error("Error updating teacher profile:", error);
    res.status(500).json({
      message: "Failed to update profile",
      error: error.message
    });
  }
};
//update password
export const updateTeacherPassword = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    const userId = req.user._id;
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

    // Verify user is a teacher
    if (user.role !== "teacher") {
      return res.status(403).json({ 
        message: "Only teachers can use this endpoint" 
      });
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
    console.error("Error updating teacher password:", error);
    res.status(500).json({ 
      message: "Failed to update password", 
      error: error.message 
    });
  }
};

// Upload profile photo
export const uploadProfilePhoto = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    // Find teacher
    const teacher = await Teacher.findOne({ userId: req.user._id });
    if (!teacher) {
      return res.status(404).json({ message: "Teacher profile not found" });
    }

    // Upload to Cloudinary using your helper
    const fileUrl = await uploadFileToCloudinary(req.file.path, "teacher_profile_photos");

    // Update teacher profile
    teacher.profilePhoto = fileUrl;
    await teacher.save();

    res.status(200).json({
      message: "Profile photo uploaded successfully",
      profilePhoto: teacher.profilePhoto,
    });
  } catch (error: any) {
    console.error("Error uploading profile photo:", error);
    res.status(500).json({
      message: "Failed to upload profile photo",
      error: error.message,
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