import { Request, Response } from "express";
import Assignment from "../../models/Assignment";
import Submission from "../../models/Submission";

// 📋 Get all assignments
export const getAllAssignments = async (_req: Request, res: Response) => {
  try {
    const assignments = await Assignment.find().populate("teacherId", "fullName email");
    res.status(200).json(assignments);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// 🔍 Get single assignment
export const getAssignmentById = async (req: Request, res: Response) => {
  try {
    const assignment = await Assignment.findById(req.params.id)
      .populate("teacherId", "fullName")
      .lean();

    if (!assignment) return res.status(404).json({ message: "Assignment not found" });

    const submissions = await Submission.find({ assignmentId: req.params.id });
    res.status(200).json({ ...assignment, submissions });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

//  Delete any assignment
export const deleteAnyAssignment = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await Submission.deleteMany({ assignmentId: id });
    await Assignment.findByIdAndDelete(id);
    res.status(200).json({ message: "Assignment and related submissions deleted" });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};
