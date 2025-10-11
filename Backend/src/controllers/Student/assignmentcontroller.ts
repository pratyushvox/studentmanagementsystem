import { Request, Response } from "express";
import Assignment from "../../models/Assignment";
import Submission from "../../models/Submission";
import Student from "../../models/Student";

// Get all assignments for student's group
export const getAssignmentsForStudent = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    const student = await Student.findOne({ userId: req.user._id })
      .populate("groupId");

    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    if (!student.groupId) {
      return res.status(400).json({ 
        message: "You are not assigned to any group yet. Please contact admin." 
      });
    }

    // Get assignments for student's semester and group
    const assignments = await Assignment.find({
      semester: student.currentSemester,
      groups: student.groupId
    })
      .populate("teacherId", "teacherId")
      .populate({
        path: "teacherId",
        populate: { path: "userId", select: "fullName email" }
      })
      .populate("subjectId", "name code credits")
      .sort({ deadline: 1 });

    // Get submitted assignment IDs
    const submittedIds = await Submission.find({ 
      studentId: student._id 
    }).distinct("assignmentId");

    const assignmentsWithStatus = assignments.map((assignment) => {
      const isSubmitted = submittedIds.some(
        id => id.toString() === assignment._id.toString()
      );
      const isOverdue = new Date() > new Date(assignment.deadline);

      return {
        ...assignment.toObject(),
        isSubmitted,
        isOverdue,
        canSubmit: !isSubmitted && !isOverdue,
        daysLeft: Math.ceil(
          (new Date(assignment.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
        )
      };
    });

    res.json({
      message: "Assignments fetched successfully",
      count: assignments.length,
      semester: student.currentSemester,
      group: student.groupId,
      assignments: assignmentsWithStatus
    });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

// Get specific assignment by ID
export const getAssignmentById = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    const student = await Student.findOne({ userId: req.user._id });
    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    const { assignmentId } = req.params;
    const assignment = await Assignment.findById(assignmentId)
      .populate({
        path: "teacherId",
        populate: { path: "userId", select: "fullName email" }
      })
      .populate("subjectId", "name code credits description")
      .populate("groups", "name semester");

    if (!assignment) {
      return res.status(404).json({ message: "Assignment not found" });
    }

    // Check if student's group is in assignment's groups
    const hasAccess = assignment.groups.some(
      (g: any) => g._id.toString() === student.groupId?.toString()
    );

    if (!hasAccess) {
      return res.status(403).json({ 
        message: "This assignment is not for your group" 
      });
    }

    const submission = await Submission.findOne({
      assignmentId,
      studentId: student._id
    });

    const isOverdue = new Date() > new Date(assignment.deadline);

    res.json({
      message: "Assignment details fetched",
      assignment,
      submission: submission || null,
      isSubmitted: !!submission,
      isOverdue,
      canSubmit: !submission && !isOverdue
    });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};