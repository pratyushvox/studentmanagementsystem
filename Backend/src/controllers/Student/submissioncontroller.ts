import { Request, Response } from "express";
import { uploadFileToCloudinary } from "../../utils/cloudinaryHelper";
import Submission from "../../models/Submission";
import Assignment from "../../models/Assignment";
import Student from "../../models/Student";
import Group from "../../models/Group";

// Submit assignment (first time submission)
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

    // Check if already submitted (with actual file)
    const existingSubmission = await Submission.findOne({
      assignmentId,
      studentId: student._id,
      fileUrl: { $ne: "" } // Only check for submissions with actual files
    });

    if (existingSubmission) {
      return res.status(400).json({ 
        message: "You have already submitted this assignment. Use resubmit to update your submission." 
      });
    }

    // Determine the assigned teacher for grading
    let assignedTeacherId = assignment.teacherId; // Default to assignment creator

    // For main assignments, find the teacher assigned to this group for this subject
    if (assignment.type === "main") {
      const group = await Group.findById(student.groupId);
      if (group && group.subjectTeachers) {
        const subjectTeacher = group.subjectTeachers.find(
          (st: any) => st.subjectId.toString() === assignment.subjectId.toString()
        );
        if (subjectTeacher) {
          assignedTeacherId = subjectTeacher.teacherId;
        }
      }
    }

    const fileUrl = await uploadFileToCloudinary(
      req.file.path, 
      "student_submissions"
    );

    // Check if there's an existing empty submission record (created by teacher)
    let submission = await Submission.findOne({
      assignmentId,
      studentId: student._id
    });

    if (submission) {
      // Update existing submission record
      submission.fileUrl = fileUrl;
      submission.submittedAt = new Date();
      submission.status = isLate ? "late" : "submitted";
      submission.assignedTeacherId = assignedTeacherId;
      await submission.save();
    } else {
      // Create new submission record
      submission = await Submission.create({
        assignmentId,
        studentId: student._id,
        groupId: student.groupId,
        subjectId: assignment.subjectId,
        assignedTeacherId: assignedTeacherId,
        fileUrl,
        submittedAt: new Date(),
        status: isLate ? "late" : "submitted"
      });
    }

    await submission.populate("assignmentId", "title description deadline maxMarks type");

    res.status(201).json({
      message: isLate 
        ? "Assignment submitted (Late submission)" 
        : "Assignment submitted successfully",
      submission
    });
  } catch (err: any) {
    console.error("Error submitting assignment:", err);
    res.status(500).json({ message: err.message });
  }
};

// Resubmit assignment (update existing submission)
export const resubmitAssignment = async (req: Request, res: Response) => {
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

    // Check deadline for resubmission (optional: you might want to allow resubmission after deadline)
    const isLate = new Date() > new Date(assignment.deadline);

    // Find existing submission
    const existingSubmission = await Submission.findOne({
      assignmentId,
      studentId: student._id,
      fileUrl: { $ne: "" } // Must have an existing submission
    });

    if (!existingSubmission) {
      return res.status(400).json({ 
        message: "No submission found to resubmit. Please use submit instead." 
      });
    }

    // Check if assignment is already graded
    if (existingSubmission.status === "graded") {
      return res.status(400).json({ 
        message: "Cannot resubmit. This assignment has already been graded." 
      });
    }

    const fileUrl = await uploadFileToCloudinary(
      req.file.path, 
      "student_submissions"
    );

    // Update the existing submission
    existingSubmission.fileUrl = fileUrl;
    existingSubmission.submittedAt = new Date();
    existingSubmission.status = isLate ? "late" : "submitted";
    existingSubmission.marks = undefined; // Reset marks if resubmitting
    existingSubmission.feedback = undefined; // Reset feedback if resubmitting
    existingSubmission.gradedBy = undefined;
    existingSubmission.gradedAt = undefined;
    
    await existingSubmission.save();

    await existingSubmission.populate("assignmentId", "title description deadline maxMarks type");

    res.status(200).json({
      message: isLate 
        ? "Assignment resubmitted (Late submission)" 
        : "Assignment resubmitted successfully",
      submission: existingSubmission
    });
  } catch (err: any) {
    console.error("Error resubmitting assignment:", err);
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
      .populate("assignedTeacherId", "teacherId")
      .populate({
        path: "assignedTeacherId",
        populate: { path: "userId", select: "fullName email" }
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
      })
      .populate("assignedTeacherId", "teacherId")
      .populate({
        path: "assignedTeacherId",
        populate: { path: "userId", select: "fullName email" }
      });

    if (!submission) {
      return res.status(404).json({ message: "Submission not found" });
    }

    res.json({ message: "Submission details fetched", submission });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};