import { Request, Response } from "express";
import { uploadFileToCloudinary } from "../../utils/cloudinaryHelper";
import Post from "../../models/Post";
import Teacher from "../../models/Teacher";
import Subject from "../../models/Subject";
import Group from "../../models/Group";

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

    const { title, contentType, subjectId, groups, description, tags } = req.body;

    if (!req.file) return res.status(400).json({ message: "No file uploaded" });
    if (!title || !contentType || !subjectId || !groups) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // Parse groups if it's a string
    const groupIds = typeof groups === 'string' ? JSON.parse(groups) : groups;

    // Verify teacher teaches this subject in these groups
    const hasPermission = teacher.assignedSubjects.some(as =>
      as.subjectId.toString() === subjectId &&
      groupIds.every((g: string) => as.groups.some(gr => gr.toString() === g))
    );

    if (!hasPermission) {
      return res.status(403).json({ 
        message: "You don't have permission to post for this subject or groups" 
      });
    }

    // Verify groups belong to the same semester as subject
    const subject = await Subject.findById(subjectId);
    if (!subject) {
      return res.status(404).json({ message: "Subject not found" });
    }

    const groupsData = await Group.find({ _id: { $in: groupIds } });
    const invalidGroups = groupsData.filter(g => g.semester !== subject.semester);
    
    if (invalidGroups.length > 0) {
      return res.status(400).json({ 
        message: "Some groups don't match the subject's semester" 
      });
    }

    // Upload file to Cloudinary with proper folder structure
    const fileUrl = await uploadFileToCloudinary(
      req.file.path, 
      `teacher_posts/${subjectId}/${contentType}`
    );

    // Parse tags if provided
    const parsedTags = tags ? (typeof tags === 'string' ? JSON.parse(tags) : tags) : [];

    const post = await Post.create({
      teacherId: teacher._id,
      subjectId,
      title,
      contentType,
      fileUrl,
      semester: subject.semester,
      groups: groupIds,
      description,
      tags: parsedTags,
      fileSize: req.file.size,
      originalFileName: req.file.originalname
    });

    const populatedPost = await Post.findById(post._id)
      .populate("subjectId", "name code")
      .populate("groups", "name semester");

    res.status(201).json({ 
      message: "Material posted successfully", 
      post: populatedPost 
    });
  } catch (err: any) {
    console.error("Error creating post:", err);
    res.status(500).json({ message: err.message });
  }
};

// Get all posts created by this teacher with advanced filtering
export const getMyPosts = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    const teacher = await Teacher.findOne({ userId: req.user._id });
    if (!teacher) {
      return res.status(404).json({ message: "Teacher profile not found" });
    }

    const { contentType, subjectId, semester, groupId, search, page = 1, limit = 10 } = req.query;
    
    const filter: any = { teacherId: teacher._id };
    
    if (contentType) filter.contentType = contentType;
    if (subjectId) filter.subjectId = subjectId;
    if (semester) filter.semester = Number(semester);
    if (groupId) filter.groups = groupId;
    
    // Search functionality
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } }
      ];
    }

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const posts = await Post.find(filter)
      .populate("subjectId", "name code")
      .populate("groups", "name semester")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    const totalPosts = await Post.countDocuments(filter);
    const totalPages = Math.ceil(totalPosts / limitNum);

    res.json({ 
      message: "Posts fetched successfully", 
      count: posts.length,
      totalPosts,
      totalPages,
      currentPage: pageNum,
      posts 
    });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

// Get posts statistics for dashboard
export const getPostStatistics = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    const teacher = await Teacher.findOne({ userId: req.user._id });
    if (!teacher) {
      return res.status(404).json({ message: "Teacher profile not found" });
    }

    const totalPosts = await Post.countDocuments({ teacherId: teacher._id });
    
    const postsByType = await Post.aggregate([
      { $match: { teacherId: teacher._id } },
      { $group: { _id: "$contentType", count: { $sum: 1 } } }
    ]);

    const postsBySubject = await Post.aggregate([
      { $match: { teacherId: teacher._id } },
      { 
        $group: { 
          _id: "$subjectId", 
          count: { $sum: 1 },
          latestPost: { $max: "$createdAt" }
        } 
      },
      {
        $lookup: {
          from: "subjects",
          localField: "_id",
          foreignField: "_id",
          as: "subject"
        }
      },
      { $unwind: "$subject" },
      { $project: { subjectName: "$subject.name", count: 1, latestPost: 1 } }
    ]);

    const recentPosts = await Post.find({ teacherId: teacher._id })
      .populate("subjectId", "name code")
      .sort({ createdAt: -1 })
      .limit(5);

    res.json({
      message: "Post statistics fetched successfully",
      statistics: {
        totalPosts,
        postsByType: postsByType.reduce((acc, curr) => {
          acc[curr._id] = curr.count;
          return acc;
        }, {}),
        postsBySubject,
        recentPosts
      }
    });
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
      return res.status(404).json({ 
        message: "Post not found or you don't have permission to view it" 
      });
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
    const { title, description, tags } = req.body;

    if (!title && !description && !tags) {
      return res.status(400).json({ 
        message: "At least one field (title, description, or tags) is required" 
      });
    }

    const post = await Post.findOne({ _id: postId, teacherId: teacher._id });
    if (!post) {
      return res.status(404).json({ 
        message: "Post not found or you don't have permission to update it" 
      });
    }

    if (title) post.title = title;
    if (description !== undefined) post.description = description;
    if (tags) {
      const parsedTags = typeof tags === 'string' ? JSON.parse(tags) : tags;
      post.tags = parsedTags;
    }

    await post.save();

    const updatedPost = await Post.findById(postId)
      .populate("subjectId", "name code")
      .populate("groups", "name semester");

    res.json({ 
      message: "Post updated successfully", 
      post: updatedPost 
    });
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
      return res.status(404).json({ 
        message: "Post not found or you don't have permission to delete it" 
      });
    }

    // TODO: Optionally delete file from Cloudinary here
    // await deleteFileFromCloudinary(post.fileUrl);

    await Post.findByIdAndDelete(postId);
    
    res.json({ 
      message: "Post deleted successfully",
      deletedPost: {
        id: postId,
        title: post.title
      }
    });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};