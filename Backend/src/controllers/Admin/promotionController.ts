import { Request, Response } from "express";
import Student from "../../models/Student";
import Group from "../../models/Group";
import Assignment from "../../models/Assignment";
import Attendance from "../../models/Attendance";
import mongoose from "mongoose";

interface CustomRequest extends Request {
  user?: any;
}

// Calculate attendance percentage for a student in a semester
const calculateAttendancePercentage = async (studentId: mongoose.Types.ObjectId, semester: number): Promise<number> => {
  try {
    const attendanceRecords = await Attendance.find({
      semester,
      "attendanceRecords.studentId": studentId
    });

    if (attendanceRecords.length === 0) return 0;

    let totalClasses = 0;
    let attendedClasses = 0;

    attendanceRecords.forEach(record => {
      const studentRecord = record.attendanceRecords.find(
        r => r.studentId.toString() === studentId.toString()
      );

      if (studentRecord) {
        totalClasses++;
        if (studentRecord.status === "present" || studentRecord.status === "late") {
          attendedClasses++;
        }
      }
    });

    return totalClasses > 0 ? (attendedClasses / totalClasses) * 100 : 0;
  } catch (error) {
    console.error("Error calculating attendance:", error);
    return 0;
  }
};

// Check if student passed all main assignments (obtainedMarks >= passingMarks)
const checkMainAssignmentsPassed = (semesterHistory: any[]): boolean => {
  const mainAssignments = semesterHistory.filter(a => a.assignmentType === "main");
  if (mainAssignments.length === 0) return false;
  return mainAssignments.every(a => a.obtainedMarks !== undefined && a.obtainedMarks >= (a.passingMarks || 40));
};

// Check if main assignments are completed (submitted)
const checkMainAssignmentsCompleted = (semesterHistory: any[]): boolean => {
  const mainAssignments = semesterHistory.filter(a => a.assignmentType === "main");
  return mainAssignments.length > 0 && mainAssignments.every(a => a.obtainedMarks !== undefined);
};

// Get main assignment results for reporting
const getMainAssignmentResults = (semesterHistory: any[]): any[] => {
  const mainAssignments = semesterHistory.filter(a => a.assignmentType === "main");
  return mainAssignments.map(a => ({
    assignmentId: a._id,
    subjectId: a.subjectId,
    obtainedMarks: a.obtainedMarks,
    totalMarks: a.totalMarks,
    passingMarks: a.passingMarks,
    passed: a.obtainedMarks >= (a.passingMarks || 40),
  }));
};


// Promote students from a specific semester with attendance and assignment checks
export const promoteSemester = async (req: CustomRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    const { semester } = req.params;
    const semesterNum = parseInt(semester);

    if (semesterNum < 1 || semesterNum > 8) {
      return res.status(400).json({ message: "Invalid semester" });
    }

    const students = await Student.find({
      currentSemester: semesterNum,
      status: { $in: ["active", "failed"] }
    });

    let promoted = 0;
    let failed = 0;
    let graduated = 0;
    const manualPromotionRequired: any[] = [];
    const results: any[] = [];

    for (const student of students) {
      // Filter assignments of this semester - academicHistory is an array of assignment records
      const semesterHistory = student.academicHistory.filter((h: any) => h.semester === semesterNum);

      if (!semesterHistory || semesterHistory.length === 0) {
        failed++;
        results.push({
          studentId: student._id,
          studentCode: student.studentId,
          status: "failed",
          reason: "No academic history found"
        });
        continue;
      }

      const attendancePercentage = await calculateAttendancePercentage(student._id, semesterNum);
      const mainAssignmentsPassed = checkMainAssignmentsPassed(semesterHistory);
      const mainAssignmentsCompleted = checkMainAssignmentsCompleted(semesterHistory);
      const assignmentResults = getMainAssignmentResults(semesterHistory);

      if (attendancePercentage >= 75 && mainAssignmentsPassed) {
        // Auto promotion - mark all semester assignments as passed
        semesterHistory.forEach((h: any) => h.semesterPassed = true);
        
        if (semesterNum === 8) {
          student.status = "graduated";
          student.currentSemester = 8;
          graduated++;
          results.push({
            studentId: student._id,
            studentCode: student.studentId,
            status: "graduated",
            attendancePercentage,
            mainAssignmentsPassed: true,
            assignmentResults
          });
        } else {
          student.status = "promoted";
          student.currentSemester = semesterNum + 1;
          student.groupId = undefined;
          promoted++;
          results.push({
            studentId: student._id,
            studentCode: student.studentId,
            status: "promoted",
            attendancePercentage,
            mainAssignmentsPassed: true,
            assignmentResults
          });
        }
      } else if (mainAssignmentsPassed && attendancePercentage < 75) {
        // Manual promotion required
        manualPromotionRequired.push({
          studentId: student._id,
          studentCode: student.studentId,
          attendancePercentage,
          mainAssignmentsPassed: true,
          currentStatus: student.status,
          assignmentResults
        });
        results.push({
          studentId: student._id,
          studentCode: student.studentId,
          status: "manual_review_required",
          attendancePercentage,
          mainAssignmentsPassed: true,
          assignmentResults,
          reason: "Low attendance but passed main assignments"
        });
      } else if (!mainAssignmentsCompleted) {
        student.status = "failed";
        semesterHistory.forEach((h: any) => h.semesterPassed = false);
        failed++;
        results.push({
          studentId: student._id,
          studentCode: student.studentId,
          status: "failed",
          attendancePercentage,
          mainAssignmentsPassed: false,
          assignmentResults,
          reason: "Main assignments not completed"
        });
      } else {
        student.status = "failed";
        semesterHistory.forEach((h: any) => h.semesterPassed = false);
        failed++;
        results.push({
          studentId: student._id,
          studentCode: student.studentId,
          status: "failed",
          attendancePercentage,
          mainAssignmentsPassed: false,
          assignmentResults,
          reason: "Failed main assignments (marks below passing marks)"
        });
      }

      await student.save();
    }

    res.status(200).json({
      message: "Promotion process completed",
      semester: semesterNum,
      total: students.length,
      promoted,
      failed,
      graduated,
      manualPromotionRequired: manualPromotionRequired.length,
      manualPromotionList: manualPromotionRequired,
      results
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// Manually promote specific students (for cases with low attendance but passed assignments)
export const manuallyPromoteStudents = async (req: CustomRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    const { studentIds, semester, reason } = req.body;

    if (!studentIds || !Array.isArray(studentIds) || studentIds.length === 0) {
      return res.status(400).json({ message: "Student IDs array is required" });
    }

    const semesterNum = parseInt(semester);
    const promoted: any[] = [];
    const failed: any[] = [];

    for (const studentId of studentIds) {
      try {
        const student = await Student.findById(studentId);
        if (!student) {
          failed.push({ studentId, reason: "Student not found" });
          continue;
        }

        // Get current semester history - filter all records for this semester
        const semesterHistory = student.academicHistory.filter(
          (h: any) => h.semester === semesterNum
        );

        if (!semesterHistory || semesterHistory.length === 0) {
          failed.push({ studentId, reason: "No academic history for this semester" });
          continue;
        }

        // Verify that main assignments are passed
        const mainAssignmentsPassed = checkMainAssignmentsPassed(semesterHistory);
        if (!mainAssignmentsPassed) {
          failed.push({ 
            studentId, 
            reason: "Main assignments not passed (need at least passing marks in each)",
            assignmentResults: getMainAssignmentResults(semesterHistory)
          });
          continue;
        }

        // Manual promotion - mark all semester records as passed
        semesterHistory.forEach((h: any) => {
          h.semesterPassed = true;
          h.promotedAt = new Date();
          h.promotedBy = req.user._id;
          h.manualPromotionReason = reason;
        });

        if (semesterNum === 8) {
          student.status = "graduated";
          student.currentSemester = 8;
        } else {
          student.status = "promoted";
          student.currentSemester = semesterNum + 1;
          student.groupId = undefined;
        }

        await student.save();
        promoted.push({
          studentId: student._id,
          studentCode: student.studentId,
          newSemester: student.currentSemester,
          status: student.status,
          assignmentResults: getMainAssignmentResults(semesterHistory)
        });
      } catch (error: any) {
        failed.push({ studentId, reason: error.message });
      }
    }

    res.status(200).json({
      message: "Manual promotion completed",
      promoted: promoted.length,
      failed: failed.length,
      promotedStudents: promoted,
      failedStudents: failed
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// Get promotion eligibility report for a semester
export const getPromotionReport = async (req: Request, res: Response) => {
  try {
    const { semester } = req.params;
    const semesterNum = parseInt(semester);

    if (semesterNum < 1 || semesterNum > 8) {
      return res.status(400).json({ message: "Invalid semester" });
    }

    const students = await Student.find({
      currentSemester: semesterNum
    }).select("studentId userId status academicHistory");

    const report = await Promise.all(
      students.map(async (student) => {
        // Filter semester history - it's an array of assignment records
        const semesterHistory = student.academicHistory.filter(
          (h: any) => h.semester === semesterNum
        );

        const attendancePercentage = await calculateAttendancePercentage(student._id, semesterNum);
        const mainAssignmentsPassed = checkMainAssignmentsPassed(semesterHistory);
        const mainAssignmentsCompleted = checkMainAssignmentsCompleted(semesterHistory);
        const assignmentResults = getMainAssignmentResults(semesterHistory);

        let eligibility = "failed";
        let reason = "";

        if (!mainAssignmentsCompleted) {
          eligibility = "failed";
          reason = "Main assignments not completed";
        } else if (attendancePercentage >= 75 && mainAssignmentsPassed) {
          eligibility = "auto_promote";
          reason = "Meets all criteria";
        } else if (mainAssignmentsPassed && attendancePercentage < 75) {
          eligibility = "manual_promote";
          reason = "Passed assignments but low attendance";
        } else {
          eligibility = "failed";
          reason = "Failed main assignments (marks below passing marks)";
        }

        return {
          studentId: student._id,
          studentCode: student.studentId,
          currentStatus: student.status,
          attendancePercentage: Math.round(attendancePercentage * 100) / 100,
          mainAssignmentsPassed,
          mainAssignmentsCompleted,
          assignmentResults,
          promotionEligibility: eligibility,
          reason,
          totalAssignments: semesterHistory.length,
          mainAssignmentsCount: semesterHistory.filter((h: any) => h.assignmentType === "main").length
        };
      })
    );

    res.status(200).json({
      semester: semesterNum,
      totalStudents: report.length,
      autoPromote: report.filter(r => r.promotionEligibility === "auto_promote").length,
      manualPromote: report.filter(r => r.promotionEligibility === "manual_promote").length,
      failed: report.filter(r => r.promotionEligibility === "failed").length,
      report
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// Calculate student's subject result based on submissions
export const calculateSubjectResult = async (req: Request, res: Response) => {
  try {
    const { studentId, semester } = req.body;

    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    const semesterHistory = student.academicHistory.filter(
      (h: any) => h.semester === semester
    );

    if (!semesterHistory || semesterHistory.length === 0) {
      return res.status(404).json({ message: "Semester history not found" });
    }

    // Group by subject
    const subjectResults: any = {};

    semesterHistory.forEach((record: any) => {
      const subjectId = record.subjectId.toString();
      
      if (!subjectResults[subjectId]) {
        subjectResults[subjectId] = {
          subjectId: record.subjectId,
          totalObtained: 0,
          totalMax: 0,
          assignments: []
        };
      }

      subjectResults[subjectId].totalObtained += record.obtainedMarks || 0;
      subjectResults[subjectId].totalMax += record.totalMarks || 0;
      subjectResults[subjectId].assignments.push({
        type: record.assignmentType,
        obtainedMarks: record.obtainedMarks,
        totalMarks: record.totalMarks,
        passingMarks: record.passingMarks,
        status: record.status
      });
    });

    // Calculate grades for each subject
    Object.values(subjectResults).forEach((subject: any) => {
      const percentage = subject.totalMax > 0 ? (subject.totalObtained / subject.totalMax) * 100 : 0;
      subject.percentage = percentage;

      // Grading system
      if (percentage >= 90) subject.grade = "A+";
      else if (percentage >= 80) subject.grade = "A";
      else if (percentage >= 70) subject.grade = "B+";
      else if (percentage >= 60) subject.grade = "B";
      else if (percentage >= 50) subject.grade = "C+";
      else if (percentage >= 40) subject.grade = "C";
      else subject.grade = "F";

      subject.passed = percentage >= 40;
    });

    res.status(200).json({
      message: "Subject results calculated",
      student: {
        _id: student._id,
        studentId: student.studentId,
        status: student.status
      },
      subjects: Object.values(subjectResults)
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// Get student's main assignment details
export const getStudentMainAssignments = async (req: Request, res: Response) => {
  try {
    const { studentId, semester } = req.params;
    const semesterNum = parseInt(semester);

    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    const semesterHistory = student.academicHistory.filter(
      (h: any) => h.semester === semesterNum && h.assignmentType === "main"
    );

    if (!semesterHistory || semesterHistory.length === 0) {
      return res.status(404).json({ message: "No main assignments found for this semester" });
    }

    const mainAssignments = semesterHistory.map((assignment: any) => ({
      assignmentId: assignment._id,
      subjectId: assignment.subjectId,
      obtainedMarks: assignment.obtainedMarks !== undefined ? assignment.obtainedMarks : 'Not graded',
      totalMarks: assignment.totalMarks || 0,
      passingMarks: assignment.passingMarks || 40,
      passed: assignment.obtainedMarks !== undefined && assignment.obtainedMarks >= (assignment.passingMarks || 40),
      completed: assignment.obtainedMarks !== undefined,
      status: assignment.status,
      updatedAt: assignment.updatedAt
    }));

    res.status(200).json({
      studentId: student._id,
      studentCode: student.studentId,
      semester: semesterNum,
      mainAssignments,
      allPassed: mainAssignments.every((ma: any) => ma.passed),
      allCompleted: mainAssignments.every((ma: any) => ma.completed)
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};  