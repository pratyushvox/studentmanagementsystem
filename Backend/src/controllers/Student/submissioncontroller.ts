// controllers/submissionController.ts
import { Request, Response } from "express";
import { uploadFileToCloudinary } from "../../utils/cloudinaryHelper";
import Submission from "../../models/Submission";
import Assignment from "../../models/Assignment";

// ✅ Submit assignment
export const submitAssignment = async (req: Request, res: Response) => {
  try {
    // Fix 1: Add type guard for req.user
    if (!req.user) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    const { assignmentId } = req.body;

    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const assignment = await Assignment.findById(assignmentId);
    if (!assignment) {
      return res.status(404).json({ message: "Assignment not found" });
    }

    if (new Date() > new Date(assignment.deadline)) {
      return res.status(400).json({ message: "Assignment deadline has passed" });
    }

    const existingSubmission = await Submission.findOne({
      assignmentId,
      studentId: req.user._id, // Use _id for consistency
    });
    if (existingSubmission) {
      return res.status(400).json({ message: "You have already submitted this assignment" });
    }

    const fileUrl = await uploadFileToCloudinary(req.file.path, "student_submissions");

    const submission = await Submission.create({
      assignmentId,
      studentId: req.user._id, // Use _id for consistency
      fileUrl,
    });

    await submission.populate("assignmentId", "title description deadline");

    res.status(201).json({
      message: "Assignment submitted successfully",
      submission,
    });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

// ✅ Get student's own submissions with grades
export const getMySubmissions = async (req: Request, res: Response) => {
  try {
    // Fix 1: Add type guard for req.user
    if (!req.user) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    const submissions = await Submission.find({ studentId: req.user._id }) // Use _id for consistency
      .populate({
        path: "assignmentId",
        select: "title description deadline grade subject",
        populate: {
          path: "teacherId",
          select: "fullName email",
        },
      })
      .sort({ createdAt: -1 });

    const totalSubmissions = submissions.length;
    
    // Fix 2: Proper type checking for grade
    const gradedSubmissions = submissions.filter((s) => s.grade !== undefined && s.grade !== null);
    const averageGrade =
      gradedSubmissions.length > 0
        ? gradedSubmissions.reduce((sum, s) => sum + (s.grade ?? 0), 0) / gradedSubmissions.length
        : 0;

    res.json({
      message: "Submissions fetched successfully",
      statistics: {
        total: totalSubmissions,
        graded: gradedSubmissions.length,
        ungraded: totalSubmissions - gradedSubmissions.length,
        averageGrade: Math.round(averageGrade * 100) / 100,
      },
      submissions,
    });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};