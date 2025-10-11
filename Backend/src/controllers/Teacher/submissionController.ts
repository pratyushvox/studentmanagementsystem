import { Request, Response } from "express";
import Submission from "../../models/Submission";
import Assignment from "../../models/Assignment";
import Student from "../../models/Student";
import Teacher from "../../models/Teacher";

// Get all submissions for an assignment
export const getAssignmentSubmissions = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    const teacher = await Teacher.findOne({ userId: req.user._id });
    if (!teacher) {
      return res.status(404).json({ message: "Teacher profile not found" });
    }

    const { assignmentId } = req.params;
    const assignment = await Assignment.findOne({ 
      _id: assignmentId, 
      teacherId: teacher._id 
    });

    if (!assignment) {
      return res.status(404).json({ message: "No permission" });
    }

    const submissions = await Submission.find({ assignmentId })
      .populate({
        path: "studentId",
        populate: { path: "userId", select: "fullName email" }
      })
      .populate("groupId", "name")
      .sort({ createdAt: -1 });

    const gradedCount = submissions.filter(s => s.status === "graded").length;

    res.json({
      message: "Submissions fetched successfully",
      assignment: {
        title: assignment.title,
        deadline: assignment.deadline,
        maxMarks: assignment.maxMarks,
        totalSubmissions: submissions.length,
        gradedCount,
        ungradedCount: submissions.length - gradedCount
      },
      submissions
    });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

// Grade submission
export const gradeSubmission = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    const teacher = await Teacher.findOne({ userId: req.user._id });
    if (!teacher) {
      return res.status(404).json({ message: "Teacher profile not found" });
    }

    const { submissionId } = req.params;
    const { marks, feedback } = req.body;

    const submission = await Submission.findById(submissionId)
      .populate("assignmentId");

    if (!submission) {
      return res.status(404).json({ message: "Submission not found" });
    }

    const assignment = await Assignment.findOne({ 
      _id: submission.assignmentId, 
      teacherId: teacher._id 
    });

    if (!assignment) {
      return res.status(403).json({ message: "No permission" });
    }

    if (typeof marks !== "number" || marks < 0 || marks > assignment.maxMarks) {
      return res.status(400).json({ 
        message: `Marks must be between 0 and ${assignment.maxMarks}` 
      });
    }

    submission.marks = marks;
    submission.feedback = feedback;
    submission.gradedBy = teacher._id;
    submission.gradedAt = new Date();
    submission.status = "graded";
    await submission.save();

    // Update student's academic history
    const student = await Student.findById(submission.studentId);
    if (student) {
      const semesterHistory = student.academicHistory.find(
        h => h.semester === assignment.semester
      );

      if (semesterHistory) {
        const subjectRecord = semesterHistory.subjects.find(
          s => s.subjectId.toString() === assignment.subjectId.toString()
        );

        if (subjectRecord) {
          if (assignment.type === "weekly") {
            const weeklyAssignment = subjectRecord.weeklyAssignments.find(
              wa => wa.assignmentId?.toString() === assignment._id.toString()
            );
            if (weeklyAssignment) {
              weeklyAssignment.marks = marks;
              weeklyAssignment.gradedAt = new Date();
            } else {
              subjectRecord.weeklyAssignments.push({
                assignmentId: assignment._id,
                marks,
                maxMarks: assignment.maxMarks,
                submittedAt: submission.submittedAt,
                gradedAt: new Date()
              });
            }
          } else if (assignment.type === "main") {
            subjectRecord.mainAssignment = {
              assignmentId: assignment._id,
              marks,
              maxMarks: assignment.maxMarks,
              submittedAt: submission.submittedAt,
              gradedAt: new Date()
            };
          }
          await student.save();
        }
      }
    }

    res.json({ message: "Submission graded successfully", submission });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

// Get specific submission
export const getSubmissionById = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    const teacher = await Teacher.findOne({ userId: req.user._id });
    if (!teacher) {
      return res.status(404).json({ message: "Teacher profile not found" });
    }

    const { submissionId } = req.params;
    const submission = await Submission.findById(submissionId)
      .populate({
        path: "studentId",
        populate: { path: "userId", select: "fullName email" }
      })
      .populate("assignmentId", "title description deadline maxMarks type")
      .populate("groupId", "name semester")
      .populate("subjectId", "name code");

    if (!submission) {
      return res.status(404).json({ message: "Submission not found" });
    }

    const assignment = await Assignment.findOne({ 
      _id: submission.assignmentId, 
      teacherId: teacher._id 
    });

    if (!assignment) {
      return res.status(403).json({ message: "No permission" });
    }

    res.json({ message: "Submission details fetched", submission });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};