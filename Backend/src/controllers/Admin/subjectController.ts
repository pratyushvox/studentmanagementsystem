import { Request, Response } from "express";
import Subject from "../../models/Subject";
import Teacher from "../../models/Teacher";
import Group from "../../models/Group"; 

// Create new subject
export const createSubject = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    const { code, name, semester, credits, description } = req.body;

    if (!code || !name || !semester || !credits) {
      return res.status(400).json({ message: "All required fields must be provided" });
    }

    const exists = await Subject.findOne({ code });
    if (exists) {
      return res.status(400).json({ message: "Subject code already exists" });
    }

    const subject = await Subject.create({
      code,
      name,
      semester,
      credits,
      description,
      createdBy: req.user._id
    });

    res.status(201).json({ message: "Subject created successfully", subject });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// Get all subjects with teacher and group counts 
export const getAllSubjects = async (_req: Request, res: Response) => {
  try {
    const subjects = await Subject.find()
      .populate("createdBy", "fullName")
      .sort({ semester: 1, name: 1 });

    // Get teacher assignments for each subject
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

        // Calculate total students (optional)
        const groups = await Group.find({ semester: subject.semester });
        const studentsCount = groups.reduce((sum, group) => sum + (group.studentCount || 0), 0);

        return {
          ...subject.toObject(),
          teachersCount,
          groupsCount,
          studentsCount
        };
      })
    );

    res.status(200).json(subjectsWithCounts);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};



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

    // Fetch subject to get semester automatically
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

    
    teacher.assignedSubjects.push({
      subjectId,
      semester: subject.semester, 
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

// Get subjects by semester
export const getSubjectsBySemester = async (req: Request, res: Response) => {
  try {
    const { semester } = req.params;
    const subjects = await Subject.find({ 
      semester: parseInt(semester), 
      isActive: true 
    }).populate("createdBy", "fullName");

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
      .populate("createdBy", "fullName email");

    if (!subject) {
      return res.status(404).json({ message: "Subject not found" });
    }

    // Get assigned teachers
    const teachers = await Teacher.find({
      "assignedSubjects.subjectId": id
    })
      .populate("userId", "fullName email")
      .select("teacherId userId department specialization assignedSubjects");

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
        groupsAssigned: subjectAssignment?.groups || []
      };
    });

    // Get available groups for this semester
    const groups = await Group.find({ semester: subject.semester })
      .populate("teacherId", "fullName")
      .select("name semester capacity studentCount teacherId");

    res.status(200).json({
      message: "Subject details fetched successfully",
      subject: {
        ...subject.toObject(),
        assignedTeachers,
        assignedGroups: groups
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

    const subject = await Subject.findByIdAndUpdate(
      id, 
      updates, 
      { new: true, runValidators: true }
    ).populate("createdBy", "fullName");

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

    const subject = await Subject.findByIdAndDelete(id);

    if (!subject) {
      return res.status(404).json({ message: "Subject not found" });
    }

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

    // Group by semester
    const bySemester = await Subject.aggregate([
      {
        $group: {
          _id: "$semester",
          count: { $sum: 1 },
          totalCredits: { $sum: "$credits" }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    res.status(200).json({
      message: "Subject statistics fetched successfully",
      statistics: {
        totalSubjects,
        activeSubjects,
        inactiveSubjects,
        bySemester
      }
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};