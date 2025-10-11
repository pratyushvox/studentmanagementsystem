import { Request, Response } from "express";
import { uploadFileToCloudinary } from "../../utils/cloudinaryHelper";
import Post from "../../models/Post";

//  Create a new post (video/pdf)
export const createPost = async (req: Request, res: Response) => {
  try {
    
    if (!req.user) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    const { title, contentType, grade, subject } = req.body;

    if (!req.file) return res.status(400).json({ message: "No file uploaded" });
    if (!title || !contentType || !grade || !subject)
      return res.status(400).json({ message: "All fields are required" });

    const fileUrl = await uploadFileToCloudinary(req.file.path, "teacher_posts");

    const post = await Post.create({
      teacherId: req.user._id, 
      title,
      contentType,
      fileUrl,
      grade,
      subject
    });

    res.status(201).json({ message: "Post uploaded successfully", post });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

//  Get all posts created by this teacher
export const getMyPosts = async (req: Request, res: Response) => {
  try {
    // Fix 1: Add type guard for req.user
    if (!req.user) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    const { contentType, subject } = req.query;
    const filter: any = { teacherId: req.user._id }; 
    if (contentType) filter.contentType = contentType;
    if (subject) filter.subject = subject;

    const posts = await Post.find(filter).sort({ createdAt: -1 });
    res.json({ message: "Posts fetched successfully", count: posts.length, posts });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

//  Get a specific post
export const getMyPostById = async (req: Request, res: Response) => {
  try {
    // Fix 1: Add type guard for req.user
    if (!req.user) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    const { postId } = req.params;
    const post = await Post.findOne({ _id: postId, teacherId: req.user._id }); 
    if (!post) return res.status(404).json({ message: "Post not found or you don't have permission" });
    res.json({ message: "Post details fetched", post });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

//  Update post title
export const updatePost = async (req: Request, res: Response) => {
  try {
    // Fix 1: Add type guard for req.user
    if (!req.user) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    const { postId } = req.params;
    const { title } = req.body;
    if (!title) return res.status(400).json({ message: "Title is required" });

    const post = await Post.findOne({ _id: postId, teacherId: req.user._id }); 
    if (!post) return res.status(404).json({ message: "Post not found or no permission" });

    post.title = title;
    await post.save();
    res.json({ message: "Post updated successfully", post });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

//  Delete a post
export const deletePost = async (req: Request, res: Response) => {
  try {
    
    if (!req.user) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    const { postId } = req.params;
    const post = await Post.findOne({ _id: postId, teacherId: req.user._id }); 
    if (!post) return res.status(404).json({ message: "Post not found or you don't have permission" });

    await Post.findByIdAndDelete(postId);
    res.json({ message: "Post deleted successfully" });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};