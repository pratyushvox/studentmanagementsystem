import { Request, Response } from "express";
import TeacherEditRequest from "../models/TeacherEditRequest";
import User from "../models/User";

//approving the edit of teacher 

export const approveTeacherEdit = async (req: Request, res: Response) => {
  try {
    const { requestId } = req.params;
    const request = await TeacherEditRequest.findById(requestId);

    if (!request) return res.status(404).json({ message: "Request not found" });

    await User.findByIdAndUpdate(request.teacherId, request.requestedChanges);
    request.status = "approved";
    await request.save();

    res.json({ message: "Teacher update approved" });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

//rejecting the edit of teacher 

export const rejectTeacherEdit = async (req: Request, res: Response) => {
  try {
    const { requestId } = req.params;
    await TeacherEditRequest.findByIdAndUpdate(requestId, { status: "rejected" });
    res.json({ message: "Request rejected" });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};
