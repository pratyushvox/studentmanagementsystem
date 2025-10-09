// controllers/postController.ts
import { Request, Response } from "express";
import Post from "../../models/Post";
import User from "../../models/User";

// ✅ Get all posts (for student's grade/subjects)
export const getPostsForStudent = async (req: Request, res: Response) => {
  try {
     if (!req.user) {
      return res.status(401).json({ message: "User not authenticated" });
    }
    const student = await User.findById(req.user.id);
    if (!student) return res.status(404).json({ message: "Student not found" });

    const { contentType, subject } = req.query;
    const query: any = { grade: student.grade };

    if (student.assignedSubjects?.length > 0) {
      query.subject = { $in: student.assignedSubjects };
    }

    if (contentType) query.contentType = contentType;
    if (subject) query.subject = subject;

    const posts = await Post.find(query)
      .populate("teacherId", "fullName email")
      .sort({ createdAt: -1 });

    res.json({ message: "Posts fetched successfully", count: posts.length, posts });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

// ✅ Get single post by ID
export const getPostById = async (req: Request, res: Response) => {
  try {
    const { postId } = req.params;
    const post = await Post.findById(postId)
      .populate("teacherId", "fullName email grade subject");

    if (!post) return res.status(404).json({ message: "Post not found" });

    res.json({ message: "Post details fetched", post });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};
