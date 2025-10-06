import { Request, Response } from "express";
import { uploadFileToCloudinary } from "../utils/cloudinaryHelper";
import Submission from "../models/Submission";

export const submitAssignment = async (req: Request, res: Response) => {
  try {
    const { assignmentId } = req.body;
    const fileUrl = await uploadFileToCloudinary(req.file.path, "student_submissions");

    const submission = await Submission.create({
      assignmentId,
      studentId: req.user.id,
      fileUrl
    });

    res.status(201).json({ message: "Assignment submitted", submission });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

