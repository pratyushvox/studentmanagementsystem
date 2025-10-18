import { Request, Response } from "express";
import Teacher from "../../models/Teacher";
import Assignment from "../../models/Assignment";
import Submission from "../../models/Submission";
import Student from "../../models/Student";

// Get weekly assignment progress for all subjects
export const getWeeklyProgress = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    const teacher = await Teacher.findOne({ userId: req.user._id })
      .populate("assignedSubjects.subjectId", "name code")
      .populate("assignedSubjects.groups", "name semester");

    if (!teacher) {
      return res.status(404).json({ message: "Teacher profile not found" });
    }

    const { subjectId, groupId } = req.query;

    // Build filter
    const filter: any = { teacherId: teacher._id, type: "weekly" };
    if (subjectId) filter.subjectId = subjectId;
    if (groupId) filter.groups = groupId;

    const assignments = await Assignment.find(filter)
      .populate("subjectId", "name code")
      .populate("groups", "name semester")
      .sort({ createdAt: -1 })
      .limit(10); // Last 10 weekly assignments

    const progressData = await Promise.all(
      assignments.map(async (assignment) => {
        // Get all students in the groups
        const Group = require("../../models/Group").default;
        const groups = await Group.find({ _id: { $in: assignment.groups } })
          .populate("students");

        const allStudents = groups.flatMap(g => g.students);
        const totalStudents = allStudents.length;

        // Get submissions
        const submissions = await Submission.find({ assignmentId: assignment._id });
        const submittedCount = submissions.length;
        const gradedCount = submissions.filter(s => s.status === "graded").length;
        const pendingCount = submittedCount - gradedCount;
        const notSubmittedCount = totalStudents - submittedCount;

        return {
          assignment: {
            _id: assignment._id,
            title: assignment.title,
            deadline: assignment.deadline,
            maxMarks: assignment.maxMarks,
            subject: assignment.subjectId,
            groups: assignment.groups
          },
          stats: {
            totalStudents,
            submitted: submittedCount,
            graded: gradedCount,
            pending: pendingCount,
            notSubmitted: notSubmittedCount,
            submissionRate: totalStudents > 0 ? ((submittedCount / totalStudents) * 100).toFixed(1) : 0,
            gradingRate: submittedCount > 0 ? ((gradedCount / submittedCount) * 100).toFixed(1) : 0
          },
          isOverdue: new Date() > new Date(assignment.deadline)
        };
      })
    );

    res.json({
      message: "Weekly progress fetched successfully",
      data: progressData
    });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

// Get student performance for a specific subject/group
export const getStudentPerformance = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    const teacher = await Teacher.findOne({ userId: req.user._id });
    if (!teacher) {
      return res.status(404).json({ message: "Teacher profile not found" });
    }

    const { subjectId, groupId } = req.query;

    if (!subjectId || !groupId) {
      return res.status(400).json({ message: "Subject and Group are required" });
    }

    // Verify teacher has permission
    const hasPermission = teacher.assignedSubjects.some(as =>
      as.subjectId.toString() === subjectId &&
      as.groups.some(g => g.toString() === groupId)
    );

    if (!hasPermission) {
      return res.status(403).json({ message: "No permission for this subject/group" });
    }

    // Get all students in the group
    const Group = require("../../models/Group").default;
    const group = await Group.findById(groupId).populate({
      path: "students",
      populate: { path: "userId", select: "fullName email" }
    });

    if (!group) {
      return res.status(404).json({ message: "Group not found" });
    }

    // Get all assignments for this subject and group
    const assignments = await Assignment.find({
      teacherId: teacher._id,
      subjectId,
      groups: groupId
    });

    const assignmentIds = assignments.map(a => a._id);

    // Get performance for each student
    const studentPerformance = await Promise.all(
      group.students.map(async (student: any) => {
        const submissions = await Submission.find({
          assignmentId: { $in: assignmentIds },
          studentId: student._id
        }).populate("assignmentId", "title type maxMarks");

        const totalAssignments = assignments.length;
        const submittedCount = submissions.length;
        const gradedSubmissions = submissions.filter(s => s.status === "graded");
        const totalMarks = gradedSubmissions.reduce((sum, s) => sum + (s.marks || 0), 0);
        const maxPossibleMarks = gradedSubmissions.reduce(
          (sum, s) => sum + ((s.assignmentId as any).maxMarks || 0), 0
        );

        return {
          student: {
            _id: student._id,
            studentId: student.studentId,
            name: student.userId?.fullName,
            email: student.userId?.email
          },
          stats: {
            totalAssignments,
            submitted: submittedCount,
            graded: gradedSubmissions.length,
            pending: submittedCount - gradedSubmissions.length,
            notSubmitted: totalAssignments - submittedCount,
            totalMarks,
            maxPossibleMarks,
            percentage: maxPossibleMarks > 0 ? ((totalMarks / maxPossibleMarks) * 100).toFixed(1) : 0,
            submissionRate: totalAssignments > 0 ? ((submittedCount / totalAssignments) * 100).toFixed(1) : 0
          },
          recentSubmissions: submissions.slice(0, 5).map(s => ({
            assignment: (s.assignmentId as any).title,
            marks: s.marks,
            maxMarks: (s.assignmentId as any).maxMarks,
            status: s.status,
            submittedAt: s.submittedAt
          }))
        };
      })
    );

    res.json({
      message: "Student performance fetched successfully",
      subject: subjectId,
      group: {
        _id: group._id,
        name: group.name,
        semester: group.semester
      },
      students: studentPerformance
    });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

// Get recent activity feed
export const getRecentActivity = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    const teacher = await Teacher.findOne({ userId: req.user._id });
    if (!teacher) {
      return res.status(404).json({ message: "Teacher profile not found" });
    }

    const { limit = 20 } = req.query;

    // Get teacher's assignments
    const assignments = await Assignment.find({ teacherId: teacher._id })
      .select("_id");
    const assignmentIds = assignments.map(a => a._id);

    // Get recent submissions
    const recentSubmissions = await Submission.find({
      assignmentId: { $in: assignmentIds }
    })
      .populate({
        path: "studentId",
        populate: { path: "userId", select: "fullName" }
      })
      .populate("assignmentId", "title")
      .populate("subjectId", "name code")
      .sort({ submittedAt: -1 })
      .limit(Number(limit));

    const activities = recentSubmissions.map(sub => ({
      id: sub._id,
      type: sub.status === "graded" ? "grading" : "submission",
      title: sub.status === "graded" 
        ? "Grading Completed" 
        : "New Submission Received",
      description: sub.status === "graded"
        ? `You graded ${(sub.studentId as any).userId?.fullName}'s ${(sub.assignmentId as any).title}`
        : `${(sub.studentId as any).userId?.fullName} submitted ${(sub.assignmentId as any).title}`,
      time: sub.status === "graded" ? sub.gradedAt : sub.submittedAt,
      status: sub.status,
      subject: (sub.subjectId as any).name,
      student: (sub.studentId as any).userId?.fullName,
      marks: sub.marks,
      submissionId: sub._id
    }));

    res.json({
      message: "Recent activities fetched",
      activities
    });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};