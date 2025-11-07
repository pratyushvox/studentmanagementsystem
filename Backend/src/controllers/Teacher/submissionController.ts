import { Request, Response } from "express";
import mongoose from "mongoose";
import Submission from "../../models/Submission";
import Assignment from "../../models/Assignment";
import Student from "../../models/Student";
import Teacher from "../../models/Teacher";

// ✅ Helper function - calculate total marks, percentage, and grade
const calculateSubjectPerformance = (subjectRecord: any) => {
  let totalObtained = 0;
  let totalMax = 0;

  if (subjectRecord.mainAssignment?.marks !== undefined) {
    totalObtained += subjectRecord.mainAssignment.marks;
    totalMax += subjectRecord.mainAssignment.maxMarks;
  }

  subjectRecord.weeklyAssignments.forEach((wa: any) => {
    if (wa.marks !== undefined) {
      totalObtained += wa.marks;
      totalMax += wa.maxMarks;
    }
  });

  subjectRecord.totalMarks = totalObtained;

  if (totalMax > 0) {
    const percentage = (totalObtained / totalMax) * 100;
    subjectRecord.percentage = Math.round(percentage * 100) / 100;

    if (percentage >= 90) subjectRecord.grade = "A+";
    else if (percentage >= 80) subjectRecord.grade = "A";
    else if (percentage >= 70) subjectRecord.grade = "B+";
    else if (percentage >= 60) subjectRecord.grade = "B";
    else if (percentage >= 50) subjectRecord.grade = "C+";
    else if (percentage >= 40) subjectRecord.grade = "C";
    else subjectRecord.grade = "F";

    subjectRecord.passed = percentage >= 40;
  }
};

// Get all submissions for an assignment
export const getAssignmentSubmissions = async (req: Request, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ message: "User not authenticated" });

    const teacher = await Teacher.findOne({ userId: req.user._id });
    if (!teacher) return res.status(404).json({ message: "Teacher profile not found" });

    const { assignmentId } = req.params;
    const assignment = await Assignment.findOne({
      _id: assignmentId,
      teacherId: teacher._id,
    });

    if (!assignment) return res.status(404).json({ message: "No permission" });

    const submissions = await Submission.find({ assignmentId })
      .populate({
        path: "studentId",
        populate: { path: "userId", select: "fullName email" },
      })
      .populate("groupId", "name")
      .sort({ createdAt: -1 });

    const gradedCount = submissions.filter((s) => s.status === "graded").length;

    res.json({
      message: "Submissions fetched successfully",
      assignment: {
        title: assignment.title,
        deadline: assignment.deadline,
        maxMarks: assignment.maxMarks,
        totalSubmissions: submissions.length,
        gradedCount,
        ungradedCount: submissions.length - gradedCount,
      },
      submissions,
    });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

// Grade a submission and update academic history
export const gradeSubmission = async (req: Request, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ message: "User not authenticated" });

    const { submissionId } = req.params;
    const { marks, feedback } = req.body;

    if (marks === undefined || marks === null)
      return res.status(400).json({ message: "Marks are required" });

    const teacher = await Teacher.findOne({ userId: req.user._id });
    if (!teacher) return res.status(404).json({ message: "Teacher profile not found" });

    const submission = await Submission.findById(submissionId).populate("assignmentId");
    if (!submission) return res.status(404).json({ message: "Submission not found" });

    if (submission.assignedTeacherId?.toString() !== teacher._id.toString()) {
      return res
        .status(403)
        .json({ message: "You are not authorized to grade this submission" });
    }

    let assignment: any =
      typeof submission.assignmentId === "object" && "_id" in submission.assignmentId
        ? submission.assignmentId
        : await Assignment.findById(submission.assignmentId);

    if (!assignment) return res.status(404).json({ message: "Assignment not found" });

    if (!assignment.semester)
      return res.status(400).json({ message: "Assignment is missing semester information" });
    if (!assignment.subjectId)
      return res.status(400).json({ message: "Assignment is missing subject information" });
    if (!assignment.teacherId)
      return res.status(400).json({ message: "Assignment is missing teacher information" });

    if (marks > assignment.maxMarks)
      return res
        .status(400)
        .json({ message: `Marks cannot exceed maximum marks (${assignment.maxMarks})` });
    if (marks < 0) return res.status(400).json({ message: "Marks cannot be negative" });

    // Update submission
    submission.marks = marks;
    submission.feedback = feedback || "";
    submission.gradedBy = teacher._id;
    submission.gradedAt = new Date();
    submission.status = "graded";
    await submission.save();

    const student = await Student.findById(submission.studentId);
    if (!student) return res.status(404).json({ message: "Student not found" });

    if (!student.academicHistory) student.academicHistory = [];

    // Find or create semester record
    let semesterIndex = student.academicHistory.findIndex(
      (record) => record.semester === assignment.semester
    );

    if (semesterIndex === -1) {
      if (!submission.groupId)
        return res.status(400).json({ message: "Submission is missing group information" });

      student.academicHistory.push({
        semester: assignment.semester,
        groupId: submission.groupId,
        subjects: [],
        semesterPassed: false,
      } as any);
      semesterIndex = student.academicHistory.length - 1;
    }

    const semesterRecord = student.academicHistory[semesterIndex];

    // Find or create subject record
    let subjectIndex = semesterRecord.subjects.findIndex(
      (subject) => subject.subjectId.toString() === assignment.subjectId.toString()
    );

    if (subjectIndex === -1) {
      semesterRecord.subjects.push({
        subjectId: assignment.subjectId,
        teacherId: assignment.teacherId,
        weeklyAssignments: [],
        passed: false,
      } as any);
      subjectIndex = semesterRecord.subjects.length - 1;
    }

    const subjectRecord = semesterRecord.subjects[subjectIndex];

    // Update marks
    if (assignment.type === "main") {
      subjectRecord.mainAssignment = {
        assignmentId: assignment._id,
        marks,
        maxMarks: assignment.maxMarks,
        submittedAt: submission.submittedAt,
        gradedAt: new Date(),
      } as any;
    } else {
      const weeklyIndex = subjectRecord.weeklyAssignments.findIndex(
        (wa) => wa.assignmentId.toString() === assignment._id.toString()
      );

      const weeklyData = {
        assignmentId: assignment._id,
        marks,
        maxMarks: assignment.maxMarks,
        submittedAt: submission.submittedAt,
        gradedAt: new Date(),
      } as any;

      if (weeklyIndex !== -1) subjectRecord.weeklyAssignments[weeklyIndex] = weeklyData;
      else subjectRecord.weeklyAssignments.push(weeklyData);
    }

    // Calculate subject performance
    calculateSubjectPerformance(subjectRecord);

    // Save student academic history
    student.markModified("academicHistory");
    student.markModified(`academicHistory.${semesterIndex}`);
    student.markModified(`academicHistory.${semesterIndex}.subjects`);
    const savedStudent = await student.save();

    const updatedSubmission = await Submission.findById(submissionId)
      .populate("assignmentId", "title type maxMarks")
      .populate({
        path: "studentId",
        select: "studentId",
        populate: { path: "userId", select: "fullName email" },
      })
      .populate("gradedBy", "fullName email");

    res.json({
      message: "Submission graded successfully and academic history updated",
      submission: updatedSubmission,
      academicHistory: savedStudent.academicHistory,
    });
  } catch (err: any) {
    res.status(500).json({
      message: "Failed to grade submission",
      error: err.message,
    });
  }
};

// Get submissions for grading
export const getSubmissionsForGrading = async (req: Request, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ message: "User not authenticated" });

    const teacher = await Teacher.findOne({ userId: req.user._id });
    if (!teacher) return res.status(404).json({ message: "Teacher profile not found" });

    const { assignmentId, status, subjectId } = req.query;

    const filter: any = {
      assignedTeacherId: teacher._id,
      fileUrl: { $ne: "" },
    };

    if (assignmentId) filter.assignmentId = assignmentId;
    if (status) filter.status = status;
    if (subjectId) filter.subjectId = subjectId;

    const submissions = await Submission.find(filter)
      .populate({
        path: "assignmentId",
        select: "title type maxMarks deadline isModuleLeaderAssignment",
        populate: { path: "teacherId", select: "fullName" },
      })
      .populate({
        path: "studentId",
        select: "studentId",
        populate: { path: "userId", select: "fullName email" },
      })
      .populate("groupId", "name semester")
      .populate("subjectId", "name code")
      .populate("gradedBy", "fullName")
      .sort({ submittedAt: -1 });

    res.json({
      message: "Submissions fetched successfully",
      submissions,
      count: submissions.length,
    });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

// Get a specific submission
export const getSubmissionById = async (req: Request, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ message: "User not authenticated" });

    const teacher = await Teacher.findOne({ userId: req.user._id });
    if (!teacher) return res.status(404).json({ message: "Teacher profile not found" });

    const { submissionId } = req.params;
    const submission = await Submission.findById(submissionId)
      .populate({
        path: "studentId",
        populate: { path: "userId", select: "fullName email" },
      })
      .populate("assignmentId", "title description deadline maxMarks type")
      .populate("groupId", "name semester")
      .populate("subjectId", "name code");

    if (!submission) return res.status(404).json({ message: "Submission not found" });

    const assignment = await Assignment.findOne({
      _id: submission.assignmentId,
      teacherId: teacher._id,
    });

    if (!assignment) return res.status(403).json({ message: "No permission" });

    res.json({ message: "Submission details fetched", submission });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};
