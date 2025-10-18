import { Request, Response } from "express";
import { uploadFileToCloudinary } from "../../utils/cloudinaryHelper";
import Post from "../../models/Post";
import Teacher from "../../models/Teacher";

// Create a new post (video/pdf/document)
export const createPost = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    const teacher = await Teacher.findOne({ userId: req.user._id });
    if (!teacher) {
      return res.status(404).json({ message: "Teacher profile not found" });
    }

    const { title, contentType, subjectId, groups, description } = req.body;

    if (!req.file) return res.status(400).json({ message: "No file uploaded" });
    if (!title || !contentType || !subjectId || !groups) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // Verify teacher teaches this subject in these groups
    const hasPermission = teacher.assignedSubjects.some(as =>
      as.subjectId.toString() === subjectId &&
      JSON.parse(groups).every((g: string) => as.groups.some(gr => gr.toString() === g))
    );

    if (!hasPermission) {
      return res.status(403).json({ message: "You don't teach this subject in these groups" });
    }

    const fileUrl = await uploadFileToCloudinary(req.file.path, "teacher_posts");

    // Get semester from subject
    const Subject = require("../../models/Subject").default;
    const subject = await Subject.findById(subjectId);
    if (!subject) {
      return res.status(404).json({ message: "Subject not found" });
    }

    const post = await Post.create({
      teacherId: teacher._id,
      subjectId,
      title,
      contentType,
      fileUrl,
      semester: subject.semester,
      groups: JSON.parse(groups),
      description
    });

    res.status(201).json({ message: "Post uploaded successfully", post });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

// Get all posts created by this teacher
export const getMyPosts = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    const teacher = await Teacher.findOne({ userId: req.user._id });
    if (!teacher) {
      return res.status(404).json({ message: "Teacher profile not found" });
    }

    const { contentType, subjectId, semester } = req.query;
    const filter: any = { teacherId: teacher._id };
    
    if (contentType) filter.contentType = contentType;
    if (subjectId) filter.subjectId = subjectId;
    if (semester) filter.semester = Number(semester);

    const posts = await Post.find(filter)
      .populate("subjectId", "name code")
      .populate("groups", "name semester")
      .sort({ createdAt: -1 });

    res.json({ message: "Posts fetched successfully", count: posts.length, posts });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

// Get a specific post
export const getMyPostById = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    const teacher = await Teacher.findOne({ userId: req.user._id });
    if (!teacher) {
      return res.status(404).json({ message: "Teacher profile not found" });
    }

    const { postId } = req.params;
    const post = await Post.findOne({ _id: postId, teacherId: teacher._id })
      .populate("subjectId", "name code")
      .populate("groups", "name semester");

    if (!post) {
      return res.status(404).json({ message: "Post not found or you don't have permission" });
    }

    res.json({ message: "Post details fetched", post });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

// Update post
export const updatePost = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    const teacher = await Teacher.findOne({ userId: req.user._id });
    if (!teacher) {
      return res.status(404).json({ message: "Teacher profile not found" });
    }

    const { postId } = req.params;
    const { title, description } = req.body;

    if (!title && !description) {
      return res.status(400).json({ message: "At least one field is required" });
    }

    const post = await Post.findOne({ _id: postId, teacherId: teacher._id });
    if (!post) {
      return res.status(404).json({ message: "Post not found or no permission" });
    }

    if (title) post.title = title;
    if (description !== undefined) post.description = description;

    await post.save();
    res.json({ message: "Post updated successfully", post });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

// Delete a post
export const deletePost = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    const teacher = await Teacher.findOne({ userId: req.user._id });
    if (!teacher) {
      return res.status(404).json({ message: "Teacher profile not found" });
    }

    const { postId } = req.params;
    const post = await Post.findOne({ _id: postId, teacherId: teacher._id });
    
    if (!post) {
      return res.status(404).json({ message: "Post not found or you don't have permission" });
    }

    await Post.findByIdAndDelete(postId);
    res.json({ message: "Post deleted successfully" });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};