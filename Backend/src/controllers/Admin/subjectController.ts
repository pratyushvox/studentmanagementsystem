import { Request, Response } from "express";
import Subject from "../../models/Subject";

// Create new subject
export const createSubject = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    const { code, name, semester, credits, description } = req.body;

    if (!code || !name || !semester || !credits) {
      return res.status(400).json({ message: "All required fields must be provided" });
    }

    const exists = await Subject.findOne({ code });
    if (exists) {
      return res.status(400).json({ message: "Subject code already exists" });
    }

    const subject = await Subject.create({
      code,
      name,
      semester,
      credits,
      description,
      createdBy: req.user._id
    });

    res.status(201).json({ message: "Subject created successfully", subject });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// Get all subjects
export const getAllSubjects = async (_req: Request, res: Response) => {
  try {
    const subjects = await Subject.find().populate("createdBy", "fullName");
    res.status(200).json(subjects);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// Get subjects by semester
export const getSubjectsBySemester = async (req: Request, res: Response) => {
  try {
    const { semester } = req.params;
    const subjects = await Subject.find({ semester: parseInt(semester), isActive: true });
    res.status(200).json(subjects);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// Update subject
export const updateSubject = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const subject = await Subject.findByIdAndUpdate(id, updates, { new: true });
    if (!subject) {
      return res.status(404).json({ message: "Subject not found" });
    }

    res.status(200).json({ message: "Subject updated", subject });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// Delete subject
export const deleteSubject = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await Subject.findByIdAndDelete(id);
    res.status(200).json({ message: "Subject deleted successfully" });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};
