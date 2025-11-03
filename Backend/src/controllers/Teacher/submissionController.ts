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



export const gradeSubmission = async (req: Request, res: Response) => {
  try {
    const { submissionId, marks } = req.body;

    const submission = await Submission.findById(submissionId)
      .populate("assignmentId", "subjectId type semester maxMarks")
      .populate("studentId", "_id academicHistory groupId");

    if (!submission) {
      return res.status(404).json({ message: "Submission not found" });
    }

    // Update submission first
    submission.marks = marks;
    submission.status = "graded";
    submission.gradedAt = new Date();
    await submission.save();

    const assignment: any = submission.assignmentId;
    const student: any = submission.studentId;

    const { subjectId, semester, type, maxMarks } = assignment;

    // ✅ Calculate percentage for main assignment
    const percentage = (marks / maxMarks) * 100;
    const mainAssignmentPassed = percentage >= 40; // 40% rule

    // 🧠 Find or create semester record
    let semesterRecord = student.academicHistory.find(
      (h: any) => h.semester === semester
    );

    if (!semesterRecord) {
      semesterRecord = {
        semester,
        groupId: student.groupId,
        subjects: []
      };
      student.academicHistory.push(semesterRecord);
    }

    // 🧠 Find or create subject record
    let subjectRecord = semesterRecord.subjects.find(
      (s: any) => s.subjectId.toString() === subjectId.toString()
    );

    if (!subjectRecord) {
      subjectRecord = {
        subjectId,
        weeklyAssignments: [],
        mainAssignment: {},
        totalMarks: 0,
        percentage: 0,
        grade: "N/A",
        passed: false
      };
      semesterRecord.subjects.push(subjectRecord);
    }

    // 📘 Update according to assignment type
    if (type === "weekly") {
      const existingWeekly = subjectRecord.weeklyAssignments.find(
        (wa: any) => wa.assignmentId?.toString() === assignment._id.toString()
      );

      if (existingWeekly) {
        existingWeekly.marks = marks;
        existingWeekly.maxMarks = maxMarks;
        existingWeekly.gradedAt = new Date();
      } else {
        subjectRecord.weeklyAssignments.push({
          assignmentId: assignment._id,
          marks,
          maxMarks,
          gradedAt: new Date()
        });
      }
    } else if (type === "main") {
      subjectRecord.mainAssignment = {
        assignmentId: assignment._id,
        marks,
        maxMarks,
        gradedAt: new Date(),
        passed: mainAssignmentPassed
      };
    }

    // 📊 Calculate total marks and grade
    const totalObtained =
      (subjectRecord.weeklyAssignments?.reduce(
        (sum: number, a: any) => sum + (a.marks || 0),
        0
      ) || 0) + (subjectRecord.mainAssignment?.marks || 0);

    const totalMax =
      (subjectRecord.weeklyAssignments?.reduce(
        (sum: number, a: any) => sum + (a.maxMarks || 0),
        0
      ) || 0) + (subjectRecord.mainAssignment?.maxMarks || 0);

    const subjectPercentage = totalMax > 0 ? (totalObtained / totalMax) * 100 : 0;

    let grade = "F";
    if (subjectPercentage >= 90) grade = "A+";
    else if (subjectPercentage >= 80) grade = "A";
    else if (subjectPercentage >= 70) grade = "B+";
    else if (subjectPercentage >= 60) grade = "B";
    else if (subjectPercentage >= 50) grade = "C+";
    else if (subjectPercentage >= 40) grade = "C";

    // ✅ Apply final grading rules
    subjectRecord.totalMarks = totalObtained;
    subjectRecord.percentage = subjectPercentage;
    subjectRecord.grade = grade;
    subjectRecord.passed = subjectPercentage >= 40 && mainAssignmentPassed;

    await student.save();

    res.status(200).json({
      message: "Marks submitted successfully and academic history updated",
      submissionId: submission._id,
      subject: subjectId,
      semester,
      mainAssignmentPassed,
      updatedStudent: student._id
    });
  } catch (error: any) {
    console.error("Error grading submission:", error);
    res.status(500).json({ message: error.message });
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