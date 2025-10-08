import { Request, Response } from "express";
import Post from "../../models/Post";

//  Get all posts
export const getAllPosts = async (_req: Request, res: Response) => {
  try {
    const posts = await Post.find().populate("teacherId", "fullName email");
    res.status(200).json(posts);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

//  Get single post
export const getPostById = async (req: Request, res: Response) => {
  try {
    const post = await Post.findById(req.params.id).populate("teacherId", "fullName");
    if (!post) return res.status(404).json({ message: "Post not found" });
    res.status(200).json(post);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

//  Delete any post
export const deleteAnyPost = async (req: Request, res: Response) => {
  try {
    await Post.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: "Post deleted successfully" });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};
