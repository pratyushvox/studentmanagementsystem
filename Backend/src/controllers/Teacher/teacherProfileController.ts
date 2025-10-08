import { Request, Response } from "express";
import TeacherEditRequest from "../../models/TeacherEditRequest";

export const requestGradeOrSubjectChange = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    const { grade, subject } = req.body;
    if (!grade && !subject)
      return res.status(400).json({ message: "At least one field required" });

    const existing = await TeacherEditRequest.findOne({
      teacherId: req.user._id, 
      status: "pending"
    });

    if (existing)
      return res.status(400).json({ message: "You already have a pending request" });

    const request = await TeacherEditRequest.create({
      teacherId: req.user._id, 
      requestedChanges: { grade, subject }
    });

    res.json({ message: "Request submitted successfully", request });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

export const getMyEditRequests = async (req: Request, res: Response) => {
  try {
    
    if (!req.user) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    const requests = await TeacherEditRequest.find({ teacherId: req.user._id }).sort({ createdAt: -1 }); 
    res.json({ message: "Edit requests fetched successfully", requests });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};