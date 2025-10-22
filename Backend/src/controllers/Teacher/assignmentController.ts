import { Request, Response } from "express";
import { uploadFileToCloudinary } from "../../utils/cloudinaryHelper";
import Assignment from "../../models/Assignment";
import Submission from "../../models/Submission";
import Teacher from "../../models/Teacher";
import Subject from "../../models/Subject";
import Group from "../../models/Group";
import Student from "../../models/Student";

// Create assignment (Module Leader or Regular Teacher)
export const createAssignment = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    const { title, description, subjectId, type, groups, maxMarks, deadline } = req.body;

    if (!title || !subjectId || !type || !maxMarks || !deadline) {
      return res.status(400).json({ message: "All required fields must be provided" });
    }

    // Get teacher profile
    const teacher = await Teacher.findOne({ userId: req.user._id });
    if (!teacher) {
      return res.status(404).json({ message: "Teacher profile not found" });
    }

    // Get subject details
    const subject = await Subject.findById(subjectId);
    if (!subject) {
      return res.status(404).json({ message: "Subject not found" });
    }

    // Handle file upload if present
    let fileUrl = "";
    if (req.file) {
      fileUrl = await uploadFileToCloudinary(req.file.path, "assignments");
    }

    // ========== MAIN ASSIGNMENT LOGIC (Module Leader) ==========
    if (type === "main") {
      // Only module leader can create main assignments
      if (!subject.moduleLeader || subject.moduleLeader.toString() !== teacher._id.toString()) {
        return res.status(403).json({ 
          message: "Only the module leader can create main assignments for this subject" 
        });
      }

      // Main assignments go to all groups in the semester
      const allGroups = await Group.find({ 
        semester: subject.semester,
        isActive: true 
      });

      if (allGroups.length === 0) {
        return res.status(400).json({ 
          message: "No active groups found for this semester" 
        });
      }

      const assignment = await Assignment.create({
        teacherId: teacher._id,
        subjectId,
        title,
        description,
        type: "main",
        semester: subject.semester,
        groups: allGroups.map(g => g._id),
        maxMarks,
        deadline: new Date(deadline),
        fileUrl,
        isModuleLeaderAssignment: true,
        postedToAllStudents: true
      });

      // REMOVED: Automatic creation of submission records
      // Submission records will be created when students actually submit

      const populatedAssignment = await Assignment.findById(assignment._id)
        .populate("subjectId", "name code")
        .populate("groups", "name semester");

      return res.status(201).json({ 
        message: `Main assignment created successfully for ${allGroups.length} groups`,
        assignment: populatedAssignment,
        stats: {
          groupsCount: allGroups.length,
          studentsCount: 0 // No submissions created yet
        }
      });
    } 
    
    // ========== WEEKLY ASSIGNMENT LOGIC (Regular Teacher) ==========
    else if (type === "weekly") {
      if (!groups || groups.length === 0) {
        return res.status(400).json({ 
          message: "Groups must be specified for weekly assignments" 
        });
      }

      // Parse groups if it's a string
      const groupIds = typeof groups === 'string' ? JSON.parse(groups) : groups;

      // Verify teacher is assigned to teach this subject
      const teacherAssignment = teacher.assignedSubjects.find(
        (s: any) => s.subjectId.toString() === subjectId
      );

      if (!teacherAssignment) {
        return res.status(403).json({ 
          message: "You are not assigned to teach this subject" 
        });
      }

      // Verify teacher is assigned to these specific groups
      const assignedGroupIds = teacherAssignment.groups.map((g: any) => g.toString());
      const invalidGroups = groupIds.filter((g: string) => !assignedGroupIds.includes(g));

      if (invalidGroups.length > 0) {
        return res.status(403).json({ 
          message: "You can only create assignments for groups assigned to you" 
        });
      }

      // Verify groups belong to the subject's semester
      const verifiedGroups = await Group.find({
        _id: { $in: groupIds },
        semester: subject.semester
      });

      if (verifiedGroups.length !== groupIds.length) {
        return res.status(400).json({
          message: "Some groups are invalid or don't match the subject's semester"
        });
      }

      const assignment = await Assignment.create({
        teacherId: teacher._id,
        subjectId,
        title,
        description,
        type: "weekly",
        semester: subject.semester,
        groups: groupIds,
        maxMarks,
        deadline: new Date(deadline),
        fileUrl,
        isModuleLeaderAssignment: false,
        postedToAllStudents: false
      });

      // REMOVED: Automatic creation of submission records
      // Submission records will be created when students actually submit

      const populatedAssignment = await Assignment.findById(assignment._id)
        .populate("subjectId", "name code")
        .populate("groups", "name semester");

      return res.status(201).json({ 
        message: `Weekly assignment created successfully for ${groupIds.length} groups`,
        assignment: populatedAssignment,
        stats: {
          groupsCount: groupIds.length,
          studentsCount: 0 // No submissions created yet
        }
      });
    }

    return res.status(400).json({ message: "Invalid assignment type. Must be 'main' or 'weekly'" });

  } catch (err: any) {
    console.error("Error creating assignment:", err);
    res.status(500).json({ message: err.message });
  }
};
  

// Get all assignments by teacher
export const getMyAssignments = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    const teacher = await Teacher.findOne({ userId: req.user._id });
    if (!teacher) {
      return res.status(404).json({ message: "Teacher profile not found" });
    }

    const assignments = await Assignment.find({ teacherId: teacher._id })
      .populate("subjectId", "name code moduleLeader")
      .populate("groups", "name semester")
      .sort({ createdAt: -1 });

    const assignmentsWithStats = await Promise.all(
      assignments.map(async (a) => {
        const submissionCount = await Submission.countDocuments({ assignmentId: a._id });
        const gradedCount = await Submission.countDocuments({
          assignmentId: a._id,
          status: "graded"
        });
        const submittedCount = await Submission.countDocuments({
          assignmentId: a._id,
          fileUrl: { $ne: "" }
        });

        return {
          ...a.toObject(),
          submissionCount,
          gradedCount,
          submittedCount,
          ungradedCount: submittedCount - gradedCount,
          notSubmittedCount: submissionCount - submittedCount,
          isOverdue: new Date() > new Date(a.deadline)
        };
      })
    );

    res.json({ 
      message: "Assignments fetched", 
      assignments: assignmentsWithStats 
    });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

// Get specific assignment with submissions
export const getMyAssignmentById = async (req: Request, res: Response) => {
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
    })
      .populate("subjectId", "name code moduleLeader")
      .populate("groups", "name semester");

    if (!assignment) {
      return res.status(404).json({ message: "Assignment not found or no permission" });
    }

    const submissions = await Submission.find({ assignmentId })
      .populate("studentId", "studentId")
      .populate({
        path: "studentId",
        populate: { path: "userId", select: "fullName email" }
      })
      .populate("groupId", "name")
      .populate("gradedBy", "fullName")
      .sort({ submittedAt: -1 });

    const submissionCount = submissions.length;
    const gradedCount = submissions.filter(s => s.status === "graded").length;
    const submittedCount = submissions.filter(s => s.fileUrl && s.fileUrl !== "").length;

    res.json({
      message: "Assignment details fetched",
      assignment: {
        ...assignment.toObject(),
        submissionCount,
        gradedCount,
        submittedCount,
        ungradedCount: submittedCount - gradedCount,
        notSubmittedCount: submissionCount - submittedCount,
        isOverdue: new Date() > new Date(assignment.deadline)
      },
      submissions
    });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

// Get submissions for grading (including from module leader assignments)
export const getSubmissionsForGrading = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    const teacher = await Teacher.findOne({ userId: req.user._id });
    if (!teacher) {
      return res.status(404).json({ message: "Teacher profile not found" });
    }

    const { assignmentId, status, subjectId } = req.query;

    // Build filter - teacher sees submissions assigned to them
    const filter: any = {
      assignedTeacherId: teacher._id,
      fileUrl: { $ne: "" } // Only show submitted assignments
    };

    if (assignmentId) {
      filter.assignmentId = assignmentId;
    }

    if (status) {
      filter.status = status;
    }

    if (subjectId) {
      filter.subjectId = subjectId;
    }

    const submissions = await Submission.find(filter)
      .populate({
        path: "assignmentId",
        select: "title type maxMarks deadline isModuleLeaderAssignment",
        populate: { path: "teacherId", select: "fullName" }
      })
      .populate({
        path: "studentId",
        select: "studentId",
        populate: { path: "userId", select: "fullName email" }
      })
      .populate("groupId", "name semester")
      .populate("subjectId", "name code")
      .populate("gradedBy", "fullName")
      .sort({ submittedAt: -1 });

    res.json({
      message: "Submissions fetched successfully",
      submissions,
      count: submissions.length
    });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

// Grade a submission
export const gradeSubmission = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    const { submissionId } = req.params;
    const { marks, feedback } = req.body;

    if (marks === undefined || marks === null) {
      return res.status(400).json({ message: "Marks are required" });
    }

    const teacher = await Teacher.findOne({ userId: req.user._id });
    if (!teacher) {
      return res.status(404).json({ message: "Teacher profile not found" });
    }

    const submission = await Submission.findById(submissionId)
      .populate("assignmentId");

    if (!submission) {
      return res.status(404).json({ message: "Submission not found" });
    }

    // Verify teacher is assigned to grade this submission
    if (submission.assignedTeacherId?.toString() !== teacher._id.toString()) {
      return res.status(403).json({ 
        message: "You are not authorized to grade this submission" 
      });
    }

    const assignment: any = submission.assignmentId;
    if (marks > assignment.maxMarks) {
      return res.status(400).json({ 
        message: `Marks cannot exceed maximum marks (${assignment.maxMarks})` 
      });
    }

    if (marks < 0) {
      return res.status(400).json({ message: "Marks cannot be negative" });
    }

    submission.marks = marks;
    submission.feedback = feedback || "";
    submission.gradedBy = teacher._id;
    submission.gradedAt = new Date();
    submission.status = "graded";

    await submission.save();

    const updatedSubmission = await Submission.findById(submissionId)
      .populate("assignmentId", "title type maxMarks")
      .populate({
        path: "studentId",
        select: "studentId",
        populate: { path: "userId", select: "fullName email" }
      })
      .populate("gradedBy", "fullName email");

    res.json({
      message: "Submission graded successfully",
      submission: updatedSubmission
    });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

// Update assignment
export const updateAssignment = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    const teacher = await Teacher.findOne({ userId: req.user._id });
    if (!teacher) {
      return res.status(404).json({ message: "Teacher profile not found" });
    }

    const { assignmentId } = req.params;
    const { title, description, deadline, maxMarks } = req.body;

    const assignment = await Assignment.findOne({ 
      _id: assignmentId, 
      teacherId: teacher._id 
    });

    if (!assignment) {
      return res.status(404).json({ message: "Assignment not found or no permission" });
    }

    // Check if any submissions have been graded
    const gradedCount = await Submission.countDocuments({
      assignmentId,
      status: "graded"
    });

    if (gradedCount > 0 && maxMarks && maxMarks !== assignment.maxMarks) {
      return res.status(400).json({ 
        message: "Cannot change max marks after submissions have been graded" 
      });
    }

    if (title) assignment.title = title;
    if (description !== undefined) assignment.description = description;
    if (maxMarks) assignment.maxMarks = maxMarks;
    if (deadline) {
      const newDeadline = new Date(deadline);
      if (newDeadline <= new Date()) {
        return res.status(400).json({ message: "Deadline must be in the future" });
      }
      assignment.deadline = newDeadline;
    }

    await assignment.save();

    const updatedAssignment = await Assignment.findById(assignmentId)
      .populate("subjectId", "name code")
      .populate("groups", "name semester");

    res.json({ 
      message: "Assignment updated successfully", 
      assignment: updatedAssignment 
    });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

// Delete assignment
export const deleteAssignment = async (req: Request, res: Response) => {
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
      return res.status(404).json({ message: "Assignment not found or no permission" });
    }

    // Check if there are any actual submissions (not just empty records)
    const submittedCount = await Submission.countDocuments({ 
      assignmentId,
      fileUrl: { $ne: "" }
    });

    if (submittedCount > 0) {
      return res.status(400).json({ 
        message: `Cannot delete assignment. ${submittedCount} student(s) have already submitted.` 
      });
    }

    // Delete all submission records (including empty ones)
    await Submission.deleteMany({ assignmentId });

    // Delete the assignment
    await Assignment.findByIdAndDelete(assignmentId);

    res.json({ message: "Assignment deleted successfully" });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

// Get assignment statistics for teacher dashboard
export const getMyAssignmentStatistics = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    const teacher = await Teacher.findOne({ userId: req.user._id });
    if (!teacher) {
      return res.status(404).json({ message: "Teacher profile not found" });
    }

    const totalAssignments = await Assignment.countDocuments({ teacherId: teacher._id });
    const mainAssignments = await Assignment.countDocuments({ 
      teacherId: teacher._id, 
      type: "main" 
    });
    const weeklyAssignments = await Assignment.countDocuments({ 
      teacherId: teacher._id, 
      type: "weekly" 
    });

    // Submissions assigned to this teacher for grading
    const totalSubmissionsToGrade = await Submission.countDocuments({ 
      assignedTeacherId: teacher._id,
      fileUrl: { $ne: "" }
    });
    const gradedSubmissions = await Submission.countDocuments({ 
      assignedTeacherId: teacher._id,
      status: "graded" 
    });
    const pendingGrading = totalSubmissionsToGrade - gradedSubmissions;

    // Overdue assignments
    const overdueAssignments = await Assignment.countDocuments({
      teacherId: teacher._id,
      deadline: { $lt: new Date() }
    });

    res.json({
      message: "Statistics fetched successfully",
      statistics: {
        totalAssignments,
        mainAssignments,
        weeklyAssignments,
        overdueAssignments,
        totalSubmissionsToGrade,
        gradedSubmissions,
        pendingGrading
      }
    });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};