import { Request, Response } from "express";
import Subject from "../../models/Subject";
import Teacher from "../../models/Teacher";
import Group from "../../models/Group";
import Assignment from "../../models/Assignment";

// Create new subject
export const createSubject = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    const { code, name, semester, credits, description, moduleLeaderId } = req.body;

    if (!code || !name || !semester || !credits) {
      return res.status(400).json({ message: "All required fields must be provided" });
    }

    const exists = await Subject.findOne({ code });
    if (exists) {
      return res.status(400).json({ message: "Subject code already exists" });
    }

    // Verify module leader if provided
    if (moduleLeaderId) {
      const teacher = await Teacher.findById(moduleLeaderId);
      if (!teacher) {
        return res.status(404).json({ message: "Module leader not found" });
      }
    }

    const subject = await Subject.create({
      code,
      name,
      semester,
      credits,
      description,
      moduleLeader: moduleLeaderId || null,
      createdBy: req.user._id
    });

    // Update teacher's module leader status if assigned
    if (moduleLeaderId) {
      await Teacher.findByIdAndUpdate(moduleLeaderId, {
        isModuleLeader: true,
        $addToSet: { moduleLeaderSubjects: subject._id }
      });
    }

    res.status(201).json({ message: "Subject created successfully", subject });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// Assign or update module leader for a subject (Admin only)
export const assignModuleLeader = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    const { subjectId } = req.params;
    const { moduleLeaderId } = req.body;

    if (!moduleLeaderId) {
      return res.status(400).json({ message: "Module leader ID is required" });
    }

    const subject = await Subject.findById(subjectId);
    if (!subject) {
      return res.status(404).json({ message: "Subject not found" });
    }

    const teacher = await Teacher.findById(moduleLeaderId);
    if (!teacher) {
      return res.status(404).json({ message: "Teacher not found" });
    }

    // Remove previous module leader if exists
    if (subject.moduleLeader) {
      await Teacher.findByIdAndUpdate(subject.moduleLeader, {
        $pull: { moduleLeaderSubjects: subject._id }
      });
      
      // Update isModuleLeader flag if they have no other subjects
      const prevLeader = await Teacher.findById(subject.moduleLeader);
      if (prevLeader && prevLeader.moduleLeaderSubjects.length === 0) {
        prevLeader.isModuleLeader = false;
        await prevLeader.save();
      }
    }

    // Assign new module leader
    subject.moduleLeader = teacher._id;
    await subject.save();

    teacher.isModuleLeader = true;
    if (!teacher.moduleLeaderSubjects.includes(subject._id)) {
      teacher.moduleLeaderSubjects.push(subject._id);
    }
    await teacher.save();

    const updatedSubject = await Subject.findById(subjectId)
      .populate("moduleLeader", "fullName email teacherId department")
      .populate("createdBy", "fullName");

    res.status(200).json({
      message: "Module leader assigned successfully",
      subject: updatedSubject
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// Remove module leader from a subject
export const removeModuleLeader = async (req: Request, res: Response) => {
  try {
    const { subjectId } = req.params;

    const subject = await Subject.findById(subjectId);
    if (!subject) {
      return res.status(404).json({ message: "Subject not found" });
    }

    if (!subject.moduleLeader) {
      return res.status(400).json({ message: "No module leader assigned to this subject" });
    }

    const previousLeaderId = subject.moduleLeader;

    // Remove module leader from subject
    subject.moduleLeader = undefined;
    await subject.save();

    // Update teacher's module leader status
    const teacher = await Teacher.findByIdAndUpdate(
      previousLeaderId,
      { $pull: { moduleLeaderSubjects: subject._id } },
      { new: true }
    );

    if (teacher && teacher.moduleLeaderSubjects.length === 0) {
      teacher.isModuleLeader = false;
      await teacher.save();
    }

    res.status(200).json({ 
      message: "Module leader removed successfully",
      subject 
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// Get all subjects with teacher and group counts
export const getAllSubjects = async (_req: Request, res: Response) => {
  try {
    const subjects = await Subject.find()
      .populate("createdBy", "fullName")
      .populate("moduleLeader", "fullName email teacherId department")
      .sort({ semester: 1, name: 1 });

    const subjectsWithCounts = await Promise.all(
      subjects.map(async (subject) => {
        // Count teachers assigned to this subject
        const teachersCount = await Teacher.countDocuments({
          "assignedSubjects.subjectId": subject._id
        });

        // Count groups for this subject's semester
        const groupsCount = await Group.countDocuments({
          semester: subject.semester
        });

        // Calculate total students
        const groups = await Group.find({ semester: subject.semester });
        const studentsCount = groups.reduce((sum, group) => sum + (group.studentCount || 0), 0);

        // Count main and weekly assignments
        const mainAssignmentsCount = await Assignment.countDocuments({
          subjectId: subject._id,
          type: "main"
        });

        const weeklyAssignmentsCount = await Assignment.countDocuments({
          subjectId: subject._id,
          type: "weekly"
        });

        return {
          ...subject.toObject(),
          teachersCount,
          groupsCount,
          studentsCount,
          mainAssignmentsCount,
          weeklyAssignmentsCount,
          hasModuleLeader: !!subject.moduleLeader
        };
      })
    );

    res.status(200).json(subjectsWithCounts);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// Assign subject to teacher (for teaching groups)
export const assignSubjectToTeacher = async (req: Request, res: Response) => {
  try {
    const { teacherId } = req.params;
    const { subjectId, groups } = req.body;

    if (!subjectId) {
      return res.status(400).json({ 
        message: "Subject ID is required" 
      });
    }

    const teacher = await Teacher.findById(teacherId);
    if (!teacher) {
      return res.status(404).json({ message: "Teacher not found" });
    }

    const subject = await Subject.findById(subjectId);
    if (!subject) {
      return res.status(404).json({ message: "Subject not found" });
    }

    // Check if subject already assigned
    const existingAssignment = teacher.assignedSubjects.find(
      (s) => s.subjectId.toString() === subjectId
    );

    if (existingAssignment) {
      return res.status(400).json({ 
        message: "Subject already assigned to this teacher" 
      });
    }

    // Verify groups exist and belong to the subject's semester
    if (groups && groups.length > 0) {
      const verifiedGroups = await Group.find({
        _id: { $in: groups },
        semester: subject.semester
      });

      if (verifiedGroups.length !== groups.length) {
        return res.status(400).json({
          message: "Some groups are invalid or don't match the subject's semester"
        });
      }

      // Update group's subjectTeachers array
      await Group.updateMany(
        { _id: { $in: groups } },
        {
          $addToSet: {
            subjectTeachers: {
              subjectId: subject._id,
              teacherId: teacher._id,
              assignedAt: new Date()
            }
          }
        }
      );
    }

    teacher.assignedSubjects.push({
      subjectId,
      semester: subject.semester,
      groups: groups || []
    });

    await teacher.save();

    const updatedTeacher = await Teacher.findById(teacherId)
      .populate("userId", "fullName email")
      .populate("assignedSubjects.subjectId", "name code moduleLeader")
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

// Get subjects by semester
export const getSubjectsBySemester = async (req: Request, res: Response) => {
  try {
    const { semester } = req.params;
    const subjects = await Subject.find({ 
      semester: parseInt(semester), 
      isActive: true 
    })
      .populate("createdBy", "fullName")
      .populate("moduleLeader", "fullName email teacherId");

    res.status(200).json(subjects);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// Get single subject with detailed information
export const getSubjectById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const subject = await Subject.findById(id)
      .populate("createdBy", "fullName email")
      .populate("moduleLeader", "fullName email teacherId department specialization");

    if (!subject) {
      return res.status(404).json({ message: "Subject not found" });
    }

    // Get assigned teachers (excluding module leader from regular teacher list)
    const teachers = await Teacher.find({
      "assignedSubjects.subjectId": id
    })
      .populate("userId", "fullName email")
      .select("teacherId userId department specialization assignedSubjects isModuleLeader");

    // Filter to get only this subject's assignments
    const assignedTeachers = teachers.map(teacher => {
      const subjectAssignment = teacher.assignedSubjects.find(
        (s: any) => s.subjectId.toString() === id
      );

      return {
        _id: teacher._id,
        teacherId: teacher.teacherId,
        fullName: teacher.userId?.fullName,
        email: teacher.userId?.email,
        department: teacher.department,
        specialization: teacher.specialization,
        groupsAssigned: subjectAssignment?.groups || [],
        isModuleLeader: teacher.isModuleLeader
      };
    });

    // Get available groups for this semester
    const groups = await Group.find({ semester: subject.semester })
      .populate("subjectTeachers.teacherId", "fullName")
      .select("name semester capacity studentCount students subjectTeachers");

    // Get assignments statistics
    const mainAssignments = await Assignment.find({
      subjectId: id,
      type: "main"
    }).populate("teacherId", "fullName");

    const weeklyAssignments = await Assignment.find({
      subjectId: id,
      type: "weekly"
    }).populate("teacherId", "fullName");

    res.status(200).json({
      message: "Subject details fetched successfully",
      subject: {
        ...subject.toObject(),
        assignedTeachers,
        assignedGroups: groups,
        mainAssignments,
        weeklyAssignments
      }
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// Update subject
export const updateSubject = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Don't allow changing the code after creation
    if (updates.code) {
      delete updates.code;
    }

    // Don't allow direct moduleLeader updates through this route
    if (updates.moduleLeader) {
      delete updates.moduleLeader;
    }

    const subject = await Subject.findByIdAndUpdate(
      id, 
      updates, 
      { new: true, runValidators: true }
    )
      .populate("createdBy", "fullName")
      .populate("moduleLeader", "fullName email teacherId");

    if (!subject) {
      return res.status(404).json({ message: "Subject not found" });
    }

    res.status(200).json({ message: "Subject updated successfully", subject });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// Delete subject
export const deleteSubject = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Check if any teachers are assigned to this subject
    const teachersAssigned = await Teacher.countDocuments({
      "assignedSubjects.subjectId": id
    });

    if (teachersAssigned > 0) {
      return res.status(400).json({ 
        message: "Cannot delete subject. Please remove all teacher assignments first." 
      });
    }

    // Check if there are any assignments
    const assignmentsCount = await Assignment.countDocuments({ subjectId: id });
    if (assignmentsCount > 0) {
      return res.status(400).json({
        message: "Cannot delete subject. Please delete all assignments first."
      });
    }

    const subject = await Subject.findById(id);
    if (!subject) {
      return res.status(404).json({ message: "Subject not found" });
    }

    // Remove module leader reference
    if (subject.moduleLeader) {
      await Teacher.findByIdAndUpdate(subject.moduleLeader, {
        $pull: { moduleLeaderSubjects: subject._id }
      });

      const teacher = await Teacher.findById(subject.moduleLeader);
      if (teacher && teacher.moduleLeaderSubjects.length === 0) {
        teacher.isModuleLeader = false;
        await teacher.save();
      }
    }

    await Subject.findByIdAndDelete(id);

    res.status(200).json({ message: "Subject deleted successfully" });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// Get subject statistics
export const getSubjectStatistics = async (_req: Request, res: Response) => {
  try {
    const totalSubjects = await Subject.countDocuments();
    const activeSubjects = await Subject.countDocuments({ isActive: true });
    const inactiveSubjects = await Subject.countDocuments({ isActive: false });
    const subjectsWithModuleLeader = await Subject.countDocuments({ 
      moduleLeader: { $ne: null } 
    });
    const subjectsWithoutModuleLeader = await Subject.countDocuments({ 
      moduleLeader: null 
    });

    // Group by semester
    const bySemester = await Subject.aggregate([
      {
        $group: {
          _id: "$semester",
          count: { $sum: 1 },
          totalCredits: { $sum: "$credits" },
          withModuleLeader: {
            $sum: { $cond: [{ $ne: ["$moduleLeader", null] }, 1, 0] }
          }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Assignment statistics
    const totalMainAssignments = await Assignment.countDocuments({ type: "main" });
    const totalWeeklyAssignments = await Assignment.countDocuments({ type: "weekly" });

    res.status(200).json({
      message: "Subject statistics fetched successfully",
      statistics: {
        totalSubjects,
        activeSubjects,
        inactiveSubjects,
        subjectsWithModuleLeader,
        subjectsWithoutModuleLeader,
        totalMainAssignments,
        totalWeeklyAssignments,
        bySemester
      }
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};


export const getModuleLeaderSubjects = async (req: Request, res: Response) => {
  try {
    const { teacherId } = req.params;

    const teacher = await Teacher.findById(teacherId);
    if (!teacher) {
      return res.status(404).json({ message: "Teacher not found" });
    }

    const subjects = await Subject.find({ moduleLeader: teacherId })
      .populate("createdBy", "fullName")
      .sort({ semester: 1, name: 1 });

    res.status(200).json({
      message: "Module leader subjects fetched successfully",
      subjects
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};