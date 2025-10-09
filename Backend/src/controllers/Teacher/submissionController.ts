import { Request, Response } from "express";
import Assignment from "../../models/Assignment";
import Submission from "../../models/Submission";

//  Get all submissions for a given assignment 
export const getAssignmentSubmissions = async (req: Request, res: Response) => {
  try {
    
    if (!req.user) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    const { assignmentId } = req.params;
    const assignment = await Assignment.findOne({ _id: assignmentId, teacherId: req.user._id }); 
    if (!assignment) return res.status(404).json({ message: "No permission" });

    const submissions = await Submission.find({ assignmentId })
      .populate("studentId", "fullName email grade")
      .sort({ createdAt: -1 });

    const gradedCount = submissions.filter(s => s.grade !== undefined && s.grade !== null).length;

    res.json({
      message: "Submissions fetched successfully",
      assignment: {
        title: assignment.title,
        deadline: assignment.deadline,
        totalSubmissions: submissions.length,
        gradedCount,
        ungradedCount: submissions.length - gradedCount
      },
      submissions
    });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

// Get specific submission 

export const getSubmissionById = async (req: Request, res: Response) => {
  try {

    if (!req.user) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    const { submissionId } = req.params;
    const submission = await Submission.findById(submissionId)
      .populate("studentId", "fullName email grade")
      .populate("assignmentId", "title description deadline grade subject");
    if (!submission) return res.status(404).json({ message: "Submission not found" });

    const assignment = await Assignment.findOne({ _id: submission.assignmentId, teacherId: req.user._id }); 
    if (!assignment) return res.status(403).json({ message: "No permission" });

    res.json({ message: "Submission details fetched", submission });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

// Grade submission 
export const gradeSubmission = async (req: Request, res: Response) => {

  try {
    
    if (!req.user) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    const { submissionId } = req.params;
    const { grade } = req.body;

    if (typeof grade !== "number" || grade < 0 || grade > 100)
      return res.status(400).json({ message: "Grade must be a number between 0 and 100" });

    const submission = await Submission.findById(submissionId)
      .populate("assignmentId")
      .populate("studentId", "fullName email");

    if (!submission) return res.status(404).json({ message: "Submission not found" });

    const assignment = await Assignment.findOne({ _id: submission.assignmentId, teacherId: req.user._id }); 
    if (!assignment) return res.status(403).json({ message: "No permission" });

    submission.grade = grade;
    await submission.save();
    res.json({ message: "Submission graded successfully", submission });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
  
};
