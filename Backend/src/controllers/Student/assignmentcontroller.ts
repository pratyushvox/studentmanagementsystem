
import { Request, Response } from "express";
import Assignment from "../../models/Assignment";
import Submission from "../../models/Submission";
import User from "../../models/User";
import mongoose from "mongoose";

//  Get all assignments for student
export const getAssignmentsForStudent = async (req: Request, res: Response) => {
  try {
   
    if (!req.user) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    const student = await User.findById(req.user._id);
    if (!student) return res.status(404).json({ message: "Student not found" });

    const query: any = { grade: student.grade };
    
    // Fix 2: Proper check for assignedSubjects
    if (student.assignedSubjects && student.assignedSubjects.length > 0) {
      query.subject = { $in: student.assignedSubjects };
    }

    const assignments = await Assignment.find(query)
      .populate("teacherId", "fullName email")
      .sort({ deadline: 1 });

    const submittedIds = await Submission.find({ studentId: req.user._id }).distinct("assignmentId");

    const assignmentsWithStatus = assignments.map((assignment) => {
     
      const assignmentId = (assignment._id as mongoose.Types.ObjectId).toString();
      const isSubmitted = submittedIds.some((id) => id.toString() === assignmentId);
      const isOverdue = new Date() > new Date(assignment.deadline);

      return {
        ...assignment.toObject(),
        isSubmitted,
        isOverdue,
        canSubmit: !isSubmitted && !isOverdue,
      };
    });

    res.json({
      message: "Assignments fetched successfully",
      count: assignments.length,
      assignments: assignmentsWithStatus,
    });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

//  Get specific assignment by ID
export const getAssignmentById = async (req: Request, res: Response) => {
  try {
    
    if (!req.user) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    const { assignmentId } = req.params;
    const assignment = await Assignment.findById(assignmentId)
      .populate("teacherId", "fullName email grade subject");

    if (!assignment) return res.status(404).json({ message: "Assignment not found" });

    const submission = await Submission.findOne({
      assignmentId,
      studentId: req.user._id, 
    });

    const isOverdue = new Date() > new Date(assignment.deadline);

    res.json({
      message: "Assignment details fetched",
      assignment,
      submission: submission || null,
      isSubmitted: !!submission,
      isOverdue,
      canSubmit: !submission && !isOverdue,
    });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};