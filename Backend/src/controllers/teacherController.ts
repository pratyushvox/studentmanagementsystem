import { Request, Response } from "express";
import { uploadFileToCloudinary } from "../utils/cloudinaryHelper";
import TeacherEditRequest from "../models/TeacherEditRequest";
import Post from "../models/Post";
import Assignment from "../models/Assignment";
import fs from "fs";

export const createPost = async (req: Request, res: Response) => {
  try {
    const { title, contentType, grade, subject } = req.body;
    const fileUrl = await uploadFileToCloudinary(req.file.path, "teacher_posts");

    const post = await Post.create({
      teacherId: req.user.id,
      title,
      contentType,
      fileUrl,
      grade,
      subject
    });

    res.status(201).json({ message: "Post uploaded", post });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

export const createAssignment = async (req: Request, res: Response) => {
  try {
    const { title, description, grade, subject, deadline } = req.body;
    let fileUrl = "";
    if (req.file) fileUrl = await uploadFileToCloudinary(req.file.path, "assignments");

    const assignment = await Assignment.create({
      teacherId: req.user.id,
      title,
      description,
      grade,
      subject,
      deadline,
      fileUrl
    });

    res.status(201).json({ message: "Assignment created", assignment });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

export const requestGradeOrSubjectChange = async (req: Request, res: Response) => {
  try {
    const { grade, subject } = req.body;
    const existing = await TeacherEditRequest.findOne({
      teacherId: req.user.id,
      status: "pending"
    });
    if (existing)
      return res.status(400).json({ message: "You already have a pending request" });

    const request = await TeacherEditRequest.create({
      teacherId: req.user.id,
      requestedChanges: { grade, subject }
    });

    res.json({ message: "Change request submitted", request });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};
