import { Request, Response } from "express";
import TeacherEditRequest from "../../models/TeacherEditRequest";
import User from "../../models/User";

//  Approve a teacher edit request
export const approveTeacherEdit = async (req: Request, res: Response) => {
  try {
    const { requestId } = req.params;
    const editRequest = await TeacherEditRequest.findById(requestId);
    if (!editRequest) return res.status(404).json({ message: "Request not found" });

    await User.findByIdAndUpdate(editRequest.teacherId, {
     grade: editRequest.requestedChanges.grade,
     subject: editRequest.requestedChanges.subject,
    });

    editRequest.status = "approved";
    await editRequest.save();

    res.status(200).json({ message: "Request approved", editRequest });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

//  Reject teacher edit request
export const rejectTeacherEdit = async (req: Request, res: Response) => {
  try {
    const { requestId } = req.params;
    const editRequest = await TeacherEditRequest.findByIdAndUpdate(
      requestId,
      { status: "rejected" },
      { new: true }
    );
    if (!editRequest) return res.status(404).json({ message: "Request not found" });
    res.status(200).json({ message: "Request rejected", editRequest });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

//  Get all pending requests
export const getPendingTeacherRequests = async (_req: Request, res: Response) => {
  try {
    const requests = await TeacherEditRequest.find({ status: "pending" }).populate("teacherId");
    res.status(200).json(requests);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// Get all requests
export const getAllTeacherRequests = async (_req: Request, res: Response) => {
  try {
    const requests = await TeacherEditRequest.find().populate("teacherId");
    res.status(200).json(requests);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

//  Get one request
export const getTeacherRequestById = async (req: Request, res: Response) => {
  try {
    const request = await TeacherEditRequest.findById(req.params.id).populate("teacherId");
    if (!request) return res.status(404).json({ message: "Request not found" });
    res.status(200).json(request);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};
