import { Request, Response } from "express";
import { uploadFileToCloudinary } from "../../utils/cloudinaryHelper";
import Assignment from "../../models/Assignment";
import Submission from "../../models/Submission";
import mongoose from "mongoose";

// 🧾 Create assignment
export const createAssignment = async (req: Request, res: Response) => {
  try {
    // Fix 1: Add type guard for req.user
    if (!req.user) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    const { title, description, grade, subject, deadline } = req.body;

    if (!title || !grade || !subject || !deadline)
      return res.status(400).json({ message: "Title, grade, subject, and deadline are required" });
    if (new Date(deadline) <= new Date())
      return res.status(400).json({ message: "Deadline must be in the future" });

    let fileUrl = "";
    if (req.file) fileUrl = await uploadFileToCloudinary(req.file.path, "assignments");

    const assignment = await Assignment.create({
      teacherId: req.user._id, // Use _id for consistency
      title,
      description,
      grade,
      subject,
      deadline,
      fileUrl
    });

    res.status(201).json({ message: "Assignment created successfully", assignment });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

// 📋 Get all assignments by teacher
export const getMyAssignments = async (req: Request, res: Response) => {
  try {
    // Fix 1: Add type guard for req.user
    if (!req.user) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    const assignments = await Assignment.find({ teacherId: req.user._id }).sort({ createdAt: -1 });

    const assignmentsWithStats = await Promise.all(assignments.map(async (a) => {
      // Fix 2: Cast _id to mongoose.Types.ObjectId
      const assignmentId = a._id as mongoose.Types.ObjectId;
      const submissionCount = await Submission.countDocuments({ assignmentId });
      const gradedCount = await Submission.countDocuments({
        assignmentId, grade: { $exists: true, $ne: null }
      });
      return {
        ...a.toObject(),
        submissionCount,
        gradedCount,
        ungradedCount: submissionCount - gradedCount,
        isOverdue: new Date() > new Date(a.deadline)
      };
    }));

    res.json({ message: "Assignments fetched", assignments: assignmentsWithStats });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

// 🔍 Get specific assignment
export const getMyAssignmentById = async (req: Request, res: Response) => {
  try {
    // Fix 1: Add type guard for req.user
    if (!req.user) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    const { assignmentId } = req.params;
    const assignment = await Assignment.findOne({ _id: assignmentId, teacherId: req.user._id });
    if (!assignment) return res.status(404).json({ message: "Not found or no permission" });

    const submissionCount = await Submission.countDocuments({ assignmentId });
    const gradedCount = await Submission.countDocuments({ assignmentId, grade: { $exists: true, $ne: null } });

    res.json({
      message: "Assignment details fetched",
      assignment: {
        ...assignment.toObject(),
        submissionCount,
        gradedCount,
        ungradedCount: submissionCount - gradedCount,
        isOverdue: new Date() > new Date(assignment.deadline)
      }
    });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

// ✏️ Update assignment
export const updateAssignment = async (req: Request, res: Response) => {
  try {
    // Fix 1: Add type guard for req.user
    if (!req.user) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    const { assignmentId } = req.params;
    const { title, description, deadline } = req.body;
    const assignment = await Assignment.findOne({ _id: assignmentId, teacherId: req.user._id });
    if (!assignment) return res.status(404).json({ message: "Assignment not found or no permission" });

    if (title) assignment.title = title;
    if (description) assignment.description = description;
    if (deadline) {
      const newDeadline = new Date(deadline);
      if (newDeadline <= new Date())
        return res.status(400).json({ message: "Deadline must be in the future" });
      assignment.deadline = newDeadline;
    }

    await assignment.save();
    res.json({ message: "Assignment updated", assignment });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

// 🗑️ Delete assignment
export const deleteAssignment = async (req: Request, res: Response) => {
  try {
    // Fix 1: Add type guard for req.user
    if (!req.user) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    const { assignmentId } = req.params;
    const assignment = await Assignment.findOne({ _id: assignmentId, teacherId: req.user._id });
    if (!assignment) return res.status(404).json({ message: "Not found or no permission" });

    const submissionCount = await Submission.countDocuments({ assignmentId });
    if (submissionCount > 0)
      return res.status(400).json({ message: `Cannot delete. ${submissionCount} submission(s) exist.` });

    await Assignment.findByIdAndDelete(assignmentId);
    res.json({ message: "Assignment deleted" });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};