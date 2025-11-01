
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

// Check if student passed main assignments for all subjects in a semester
const checkMainAssignmentsPassed = (semesterHistory: any): boolean => {
  if (!semesterHistory || !semesterHistory.subjects || semesterHistory.subjects.length === 0) {
    return false;
  }

  return semesterHistory.subjects.every((subject: any) => {
    if (!subject.mainAssignment) return false;
    
    const marks = subject.mainAssignment.marks;
    const maxMarks = subject.mainAssignment.maxMarks;
    
    // FIXED: Student needs at least 40 marks (absolute value) to pass
    return marks !== undefined && marks >= 40;
  });
};

// Check if student has completed all main assignments (regardless of marks)
const checkMainAssignmentsCompleted = (semesterHistory: any): boolean => {
  if (!semesterHistory || !semesterHistory.subjects || semesterHistory.subjects.length === 0) {
    return false;
  }

  return semesterHistory.subjects.every((subject: any) => {
    return subject.mainAssignment && subject.mainAssignment.marks !== undefined;
  });
};

// Get detailed main assignment results for reporting
const getMainAssignmentResults = (semesterHistory: any): any[] => {
  if (!semesterHistory || !semesterHistory.subjects) return [];

  return semesterHistory.subjects.map((subject: any) => {
    const mainAssignment = subject.mainAssignment || {};
    return {
      subjectId: subject.subjectId,
      marks: mainAssignment.marks || 0,
      maxMarks: mainAssignment.maxMarks || 0,
      passed: mainAssignment.marks !== undefined && mainAssignment.marks >= 40,
      completed: mainAssignment.marks !== undefined
    };
  });
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
      status: { $in: ["active", "failed"] } // Include failed students who might be manually promoted
    }).populate("groupId");

    let promoted = 0;
    let failed = 0;
    let graduated = 0;
    const manualPromotionRequired: any[] = [];
    const results: any[] = [];

    for (const student of students) {
      // Get current semester history
      const currentHistory = student.academicHistory.find(
        (h: any) => h.semester === semesterNum
      );

      if (!currentHistory) {
        failed++;
        results.push({
          studentId: student._id,
          studentCode: student.studentId,
          status: "failed",
          reason: "No academic history found"
        });
        continue;
      }

      // Calculate attendance percentage
      const attendancePercentage = await calculateAttendancePercentage(student._id, semesterNum);
      
      // Check main assignments - FIXED: now checks for 40 marks minimum
      const mainAssignmentsPassed = checkMainAssignmentsPassed(currentHistory);
      const mainAssignmentsCompleted = checkMainAssignmentsCompleted(currentHistory);
      const assignmentResults = getMainAssignmentResults(currentHistory);

      // Determine promotion eligibility
      if (attendancePercentage >= 75 && mainAssignmentsPassed) {
        // Automatic promotion - meets all criteria
        currentHistory.semesterPassed = true;
        currentHistory.promotedAt = new Date();
        currentHistory.promotedBy = req.user._id;

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
          // Clear groupId so admin can assign new group
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
        // Manual promotion required - passed assignments but low attendance
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
        // Failed - main assignments not completed
        student.status = "failed";
        if (currentHistory) {
          currentHistory.semesterPassed = false;
        }
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
        // Failed - didn't pass main assignments (marks below 40)
        student.status = "failed";
        if (currentHistory) {
          currentHistory.semesterPassed = false;
        }
        failed++;
        results.push({
          studentId: student._id,
          studentCode: student.studentId,
          status: "failed",
          attendancePercentage,
          mainAssignmentsPassed: false,
          assignmentResults,
          reason: "Failed main assignments (marks below 40)"
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

        // Get current semester history
        const currentHistory = student.academicHistory.find(
          (h: any) => h.semester === semesterNum
        );

        if (!currentHistory) {
          failed.push({ studentId, reason: "No academic history for this semester" });
          continue;
        }

        // Verify that main assignments are passed (at least 40 marks each)
        const mainAssignmentsPassed = checkMainAssignmentsPassed(currentHistory);
        if (!mainAssignmentsPassed) {
          failed.push({ 
            studentId, 
            reason: "Main assignments not passed (need at least 40 marks in each)",
            assignmentResults: getMainAssignmentResults(currentHistory)
          });
          continue;
        }

        // Manual promotion
        currentHistory.semesterPassed = true;
        currentHistory.promotedAt = new Date();
        currentHistory.promotedBy = req.user._id;
        currentHistory.manualPromotionReason = reason;

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
          assignmentResults: getMainAssignmentResults(currentHistory)
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
        const currentHistory = student.academicHistory.find(
          (h: any) => h.semester === semesterNum
        );

        const attendancePercentage = await calculateAttendancePercentage(student._id, semesterNum);
        const mainAssignmentsPassed = checkMainAssignmentsPassed(currentHistory);
        const mainAssignmentsCompleted = checkMainAssignmentsCompleted(currentHistory);
        const assignmentResults = getMainAssignmentResults(currentHistory);

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
          reason = "Failed main assignments (marks below 40)";
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
          semesterHistory: currentHistory ? {
            semester: currentHistory.semester,
            semesterPassed: currentHistory.semesterPassed,
            subjectsCount: currentHistory.subjects?.length || 0
          } : null
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

    const semesterHistory = student.academicHistory.find(
      (h: any) => h.semester === semester
    );

    if (!semesterHistory) {
      return res.status(404).json({ message: "Semester history not found" });
    }

    // Calculate results for each subject
    semesterHistory.subjects.forEach((subject: any) => {
      let totalObtained = 0;
      let totalMax = 0;

      // Weekly assignments
      subject.weeklyAssignments.forEach((wa: any) => {
        if (wa.marks !== undefined) {
          totalObtained += wa.marks;
        }
        totalMax += wa.maxMarks;
      });

      // Main assignment
      if (subject.mainAssignment) {
        if (subject.mainAssignment.marks !== undefined) {
          totalObtained += subject.mainAssignment.marks;
        }
        totalMax += subject.mainAssignment.maxMarks;
      }

      subject.totalMarks = totalObtained;
      const percentage = totalMax > 0 ? (totalObtained / totalMax) * 100 : 0;
      subject.percentage = percentage;

      // Grading system
      if (percentage >= 90) subject.grade = "A+";
      else if (percentage >= 80) subject.grade = "A";
      else if (percentage >= 70) subject.grade = "B+";
      else if (percentage >= 60) subject.grade = "B";
      else if (percentage >= 50) subject.grade = "C+";
      else if (percentage >= 40) subject.grade = "C";
      else subject.grade = "F";

      // Pass/Fail for the subject (40% passing for overall subject)
      subject.passed = percentage >= 40;

      // Additional check for main assignment minimum marks (40 marks)
      if (subject.mainAssignment) {
        subject.mainAssignment.passed = subject.mainAssignment.marks >= 40;
      }
    });

    await student.save();

    res.status(200).json({
      message: "Subject results calculated",
      student: {
        _id: student._id,
        studentId: student.studentId,
        status: student.status
      },
      semesterHistory
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

    const semesterHistory = student.academicHistory.find(
      (h: any) => h.semester === semesterNum
    );

    if (!semesterHistory) {
      return res.status(404).json({ message: "Semester history not found" });
    }

    const mainAssignments = semesterHistory.subjects.map((subject: any) => {
      const mainAssignment = subject.mainAssignment || {};
      return {
        subjectId: subject.subjectId,
        marks: mainAssignment.marks || 'Not graded',
        maxMarks: mainAssignment.maxMarks || 0,
        passed: mainAssignment.marks !== undefined && mainAssignment.marks >= 40,
        completed: mainAssignment.marks !== undefined,
        submittedAt: mainAssignment.submittedAt,
        gradedAt: mainAssignment.gradedAt
      };
    });

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