import { Request, Response } from "express";
import User from "../../models/User";
import Assignment from "../../models/Assignment";
import Post from "../../models/Post";

//  Get all users 
export const getAllUsers = async (_req: Request, res: Response) => {
  try {
    const users = await User.find().select("-password");
    res.status(200).json(users);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

//  Get user profile with activity
export const getUserById = async (req: Request, res: Response) => {
  try {
    const user = await User.findById(req.params.id).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });

    const posts = await Post.countDocuments({ teacherId: user._id });
    const assignments = await Assignment.countDocuments({ teacherId: user._id });

    res.status(200).json({ user, stats: { posts, assignments } });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

//  Update user
export const updateAnyUser = async (req: Request, res: Response) => {
  try {
    const updated = await User.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.status(200).json(updated);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

//  Delete user
export const deleteAnyUser = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await Assignment.deleteMany({ teacherId: id });
    await Post.deleteMany({ teacherId: id });
    await User.findByIdAndDelete(id);
    res.status(200).json({ message: "User and related data deleted" });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};
