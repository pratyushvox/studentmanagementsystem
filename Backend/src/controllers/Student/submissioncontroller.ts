import { Request, Response } from "express";
import { uploadFileToCloudinary } from "../../utils/cloudinaryHelper";
import Submission from "../../models/Submission";
import Assignment from "../../models/Assignment";
import Student from "../../models/Student";

// Submit assignment
export const submitAssignment = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    const { assignmentId } = req.body;

    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const student = await Student.findOne({ userId: req.user._id });
    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    const assignment = await Assignment.findById(assignmentId);
    if (!assignment) {
      return res.status(404).json({ message: "Assignment not found" });
    }

    // Check if student's group is in assignment's groups
    const hasAccess = assignment.groups.some(
      g => g.toString() === student.groupId?.toString()
    );

    if (!hasAccess) {
      return res.status(403).json({ 
        message: "This assignment is not for your group" 
      });
    }

    // Check deadline
    const isLate = new Date() > new Date(assignment.deadline);

    // Check if already submitted
    const existingSubmission = await Submission.findOne({
      assignmentId,
      studentId: student._id
    });

    if (existingSubmission) {
      return res.status(400).json({ 
        message: "You have already submitted this assignment" 
      });
    }

    const fileUrl = await uploadFileToCloudinary(
      req.file.path, 
      "student_submissions"
    );

    const submission = await Submission.create({
      assignmentId,
      studentId: student._id,
      groupId: student.groupId,
      subjectId: assignment.subjectId,
      fileUrl,
      submittedAt: new Date(),
      status: isLate ? "late" : "pending"
    });

    await submission.populate("assignmentId", "title description deadline maxMarks type");

    res.status(201).json({
      message: isLate 
        ? "Assignment submitted (Late submission)" 
        : "Assignment submitted successfully",
      submission
    });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

// Get student's own submissions
export const getMySubmissions = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    const student = await Student.findOne({ userId: req.user._id });
    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    const submissions = await Submission.find({ studentId: student._id })
      .populate({
        path: "assignmentId",
        select: "title description deadline maxMarks type",
        populate: {
          path: "subjectId",
          select: "name code"
        }
      })
      .populate("groupId", "name semester")
      .populate({
        path: "gradedBy",
        populate: { path: "userId", select: "fullName" }
      })
      .sort({ createdAt: -1 });

    const totalSubmissions = submissions.length;
    const gradedSubmissions = submissions.filter(s => s.status === "graded");
    const averageMarks = gradedSubmissions.length > 0
      ? gradedSubmissions.reduce((sum, s) => sum + (s.marks || 0), 0) / gradedSubmissions.length
      : 0;

    res.json({
      message: "Submissions fetched successfully",
      statistics: {
        total: totalSubmissions,
        graded: gradedSubmissions.length,
        pending: totalSubmissions - gradedSubmissions.length,
        averageMarks: Math.round(averageMarks * 100) / 100
      },
      submissions
    });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

// Get submission by ID
export const getSubmissionById = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    const student = await Student.findOne({ userId: req.user._id });
    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    const { submissionId } = req.params;
    const submission = await Submission.findOne({
      _id: submissionId,
      studentId: student._id
    })
      .populate({
        path: "assignmentId",
        populate: { path: "subjectId", select: "name code" }
      })
      .populate("groupId", "name semester")
      .populate({
        path: "gradedBy",
        populate: { path: "userId", select: "fullName" }
      });

    if (!submission) {
      return res.status(404).json({ message: "Submission not found" });
    }

    res.json({ message: "Submission details fetched", submission });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};