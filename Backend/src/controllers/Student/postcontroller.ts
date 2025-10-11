import { Request, Response } from "express";
import Post from "../../models/Post";
import Student from "../../models/Student";

// Get posts for student's group
export const getPostsForStudent = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    const student = await Student.findOne({ userId: req.user._id });
    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    if (!student.groupId) {
      return res.status(400).json({ 
        message: "You are not assigned to any group yet" 
      });
    }

    const { contentType, subjectId } = req.query;
    const query: any = {
      semester: student.currentSemester,
      groups: student.groupId
    };

    if (contentType) query.contentType = contentType;
    if (subjectId) query.subjectId = subjectId;

    const posts = await Post.find(query)
      .populate({
        path: "teacherId",
        populate: { path: "userId", select: "fullName email" }
      })
      .populate("subjectId", "name code")
      .populate("groups", "name")
      .sort({ createdAt: -1 });

    res.json({ 
      message: "Posts fetched successfully", 
      count: posts.length, 
      posts 
    });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

// Get single post by ID
export const getPostById = async (req: Request, res: Response) => {
  try {
    const { postId } = req.params;
    const post = await Post.findById(postId)
      .populate({
        path: "teacherId",
        populate: { path: "userId", select: "fullName email" }
      })
      .populate("subjectId", "name code credits")
      .populate("groups", "name semester");

    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    res.json({ message: "Post details fetched", post });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};