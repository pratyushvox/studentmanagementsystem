import { Request, Response } from "express";
import Submission from "../../models/Submission";

//  Get all submissions
export const getAllSubmissions = async (_req: Request, res: Response) => {
  try {
    const submissions = await Submission.find()
      .populate("studentId", "fullName email")
      .populate("assignmentId", "title");
    res.status(200).json(submissions);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

//  Get single submission
export const getSubmissionById = async (req: Request, res: Response) => {
  try {
    const submission = await Submission.findById(req.params.id)
      .populate("studentId", "fullName")
      .populate("assignmentId", "title");
    if (!submission) return res.status(404).json({ message: "Submission not found" });
    res.status(200).json(submission);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

//  Delete submission
export const deleteAnySubmission = async (req: Request, res: Response) => {
  try {
    await Submission.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: "Submission deleted successfully" });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};
