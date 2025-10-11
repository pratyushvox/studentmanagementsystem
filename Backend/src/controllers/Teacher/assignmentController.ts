import { Request, Response } from "express";
import { uploadFileToCloudinary } from "../../utils/cloudinaryHelper";
import Assignment from "../../models/Assignment";
import Submission from "../../models/Submission";
import Teacher from "../../models/Teacher";

// Create assignment
export const createAssignment = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    const { title, description, subjectId, type, groups, maxMarks, deadline } = req.body;

    if (!title || !subjectId || !type || !groups || !maxMarks || !deadline) {
      return res.status(400).json({ message: "All required fields must be provided" });
    }

    // Verify teacher teaches this subject in these groups
    const teacher = await Teacher.findOne({ userId: req.user._id });
    if (!teacher) {
      return res.status(404).json({ message: "Teacher profile not found" });
    }

    const hasPermission = teacher.assignedSubjects.some(as =>
      as.subjectId.toString() === subjectId &&
      JSON.parse(groups).every((g: string) => as.groups.some(gr => gr.toString() === g))
    );

    if (!hasPermission) {
      return res.status(403).json({ message: "You don't teach this subject in these groups" });
    }

    let fileUrl = "";
    if (req.file) {
      fileUrl = await uploadFileToCloudinary(req.file.path, "assignments");
    }

    // Get semester from subject
    const Subject = require("../../models/Subject").default;
    const subject = await Subject.findById(subjectId);
    if (!subject) {
      return res.status(404).json({ message: "Subject not found" });
    }

    const assignment = await Assignment.create({
      teacherId: teacher._id,
      subjectId,
      title,
      description,
      type,
      semester: subject.semester,
      groups: JSON.parse(groups),
      maxMarks,
      deadline: new Date(deadline),
      fileUrl
    });

    res.status(201).json({ message: "Assignment created successfully", assignment });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

// Get all assignments by teacher
export const getMyAssignments = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    const teacher = await Teacher.findOne({ userId: req.user._id });
    if (!teacher) {
      return res.status(404).json({ message: "Teacher profile not found" });
    }

    const assignments = await Assignment.find({ teacherId: teacher._id })
      .populate("subjectId", "name code")
      .populate("groups", "name semester")
      .sort({ createdAt: -1 });

    const assignmentsWithStats = await Promise.all(
      assignments.map(async (a) => {
        const submissionCount = await Submission.countDocuments({ assignmentId: a._id });
        const gradedCount = await Submission.countDocuments({
          assignmentId: a._id,
          status: "graded"
        });

        return {
          ...a.toObject(),
          submissionCount,
          gradedCount,
          ungradedCount: submissionCount - gradedCount,
          isOverdue: new Date() > new Date(a.deadline)
        };
      })
    );

    res.json({ message: "Assignments fetched", assignments: assignmentsWithStats });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

// Get specific assignment with submissions
export const getMyAssignmentById = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    const teacher = await Teacher.findOne({ userId: req.user._id });
    if (!teacher) {
      return res.status(404).json({ message: "Teacher profile not found" });
    }

    const { assignmentId } = req.params;

    const assignment = await Assignment.findOne({ _id: assignmentId, teacherId: teacher._id })
      .populate("subjectId", "name code")
      .populate("groups", "name semester");

    if (!assignment) {
      return res.status(404).json({ message: "Assignment not found or no permission" });
    }

    const submissions = await Submission.find({ assignmentId })
      .populate("studentId", "studentId")
      .populate({
        path: "studentId",
        populate: { path: "userId", select: "fullName email" }
      });

    const submissionCount = submissions.length;
    const gradedCount = submissions.filter(s => s.status === "graded").length;

    res.json({
      message: "Assignment details fetched",
      assignment: {
        ...assignment.toObject(),
        submissionCount,
        gradedCount,
        ungradedCount: submissionCount - gradedCount,
        isOverdue: new Date() > new Date(assignment.deadline)
      },
      submissions
    });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

// Update assignment
export const updateAssignment = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    const teacher = await Teacher.findOne({ userId: req.user._id });
    if (!teacher) {
      return res.status(404).json({ message: "Teacher profile not found" });
    }

    const { assignmentId } = req.params;
    const { title, description, deadline, maxMarks } = req.body;

    const assignment = await Assignment.findOne({ _id: assignmentId, teacherId: teacher._id });
    if (!assignment) {
      return res.status(404).json({ message: "Assignment not found or no permission" });
    }

    if (title) assignment.title = title;
    if (description) assignment.description = description;
    if (maxMarks) assignment.maxMarks = maxMarks;
    if (deadline) {
      const newDeadline = new Date(deadline);
      if (newDeadline <= new Date()) {
        return res.status(400).json({ message: "Deadline must be in the future" });
      }
      assignment.deadline = newDeadline;
    }

    await assignment.save();
    res.json({ message: "Assignment updated", assignment });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

// Delete assignment
export const deleteAssignment = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    const teacher = await Teacher.findOne({ userId: req.user._id });
    if (!teacher) {
      return res.status(404).json({ message: "Teacher profile not found" });
    }

    const { assignmentId } = req.params;
    const assignment = await Assignment.findOne({ _id: assignmentId, teacherId: teacher._id });
    if (!assignment) {
      return res.status(404).json({ message: "Not found or no permission" });
    }

    const submissionCount = await Submission.countDocuments({ assignmentId });
    if (submissionCount > 0) {
      return res.status(400).json({ 
        message: `Cannot delete. ${submissionCount} submission(s) exist.` 
      });
    }

    await Assignment.findByIdAndDelete(assignmentId);
    res.json({ message: "Assignment deleted" });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};
