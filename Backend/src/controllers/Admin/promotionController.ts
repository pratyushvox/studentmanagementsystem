import { Request, Response } from "express";
import Student from "../../models/Student";
import Submission from "../../models/Submission";
import Assignment from "../../models/Assignment";
import Attendance from "../../models/Attendance";
import mongoose from "mongoose";

interface CustomRequest extends Request {
  user?: any;
}

// Calculate attendance percentage for a student in a semester
export const calculateAttendancePercentage = async (
  studentId: mongoose.Types.ObjectId,
  semester: number
): Promise<number> => {
  try {
    const attendanceRecords = await Attendance.find({
      semester,
      "attendanceRecords.studentId": studentId,
    });

    if (attendanceRecords.length === 0) return 0;

    let totalClasses = 0;
    let attendedClasses = 0;

    attendanceRecords.forEach((record) => {
      const studentRecord = record.attendanceRecords.find(
        (r) => r.studentId.toString() === studentId.toString()
      );

      if (studentRecord) {
        totalClasses++;
        if (
          studentRecord.status === "present" ||
          studentRecord.status === "late"
        ) {
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

// Get student's graded submissions for a semester
export const getStudentSubmissions = async (
  studentId: mongoose.Types.ObjectId,
  semester: number
) => {
  try {
    // Fetch all graded submissions for the student
    const submissions = await Submission.find({
      studentId: studentId,
      status: "graded",
    })
      .populate({
        path: "assignmentId",
        select: "title type maxMarks semester subjectId",
      })
      .populate("subjectId", "name code")
      .lean();

    // Filter by semester (from assignment)
    const semesterSubmissions = submissions.filter(
      (sub: any) => sub.assignmentId?.semester === semester
    );

    return semesterSubmissions;
  } catch (error) {
    console.error("Error fetching submissions:", error);
    return [];
  }
};

// Check if all main assignments are passed
export const checkMainAssignmentsPassed = (submissions: any[]): boolean => {
  const mainSubmissions = submissions.filter(
    (s: any) => s.assignmentId?.type === "main" && s.type === "main"
  );

  if (mainSubmissions.length === 0) return false;

  // Check if all main assignments have passing marks (40% or more)
  return mainSubmissions.every((sub: any) => {
    const percentage = (sub.marks / sub.assignmentId.maxMarks) * 100;
    return percentage >= 40;
  });
};

// Check if main assignments are completed
export const checkMainAssignmentsCompleted = (submissions: any[]): boolean => {
  const mainSubmissions = submissions.filter(
    (s: any) => s.assignmentId?.type === "main" && s.type === "main"
  );
  return mainSubmissions.length > 0;
};

// Get detailed main assignment results
export const getMainAssignmentResults = (submissions: any[]): any[] => {
  const mainSubmissions = submissions.filter(
    (s: any) => s.assignmentId?.type === "main" && s.type === "main"
  );

  return mainSubmissions.map((sub: any) => {
    const percentage = (sub.marks / sub.assignmentId.maxMarks) * 100;
    return {
      submissionId: sub._id,
      assignmentTitle: sub.assignmentId?.title,
      subjectId: sub.subjectId?._id,
      subjectName: sub.subjectId?.name,
      subjectCode: sub.subjectId?.code,
      obtainedMarks: sub.marks,
      maxMarks: sub.assignmentId?.maxMarks,
      percentage: Math.round(percentage * 100) / 100,
      passed: percentage >= 40,
      gradedAt: sub.gradedAt,
      feedback: sub.feedback,
    };
  });
};

// Calculate subject-wise results
export const calculateSubjectResults = (submissions: any[]): any[] => {
  const subjectMap = new Map();

  submissions.forEach((sub: any) => {
    const subjectId = sub.subjectId?._id?.toString();
    if (!subjectId) return;

    if (!subjectMap.has(subjectId)) {
      subjectMap.set(subjectId, {
        subjectId: sub.subjectId._id,
        subjectName: sub.subjectId.name,
        subjectCode: sub.subjectId.code,
        totalObtained: 0,
        totalMax: 0,
        mainAssignment: null,
        weeklyAssignments: [],
      });
    }

    const subject = subjectMap.get(subjectId);
    subject.totalObtained += sub.marks;
    subject.totalMax += sub.assignmentId.maxMarks;

    if (sub.assignmentId?.type === "main") {
      subject.mainAssignment = {
        marks: sub.marks,
        maxMarks: sub.assignmentId.maxMarks,
        percentage: (sub.marks / sub.assignmentId.maxMarks) * 100,
      };
    } else {
      subject.weeklyAssignments.push({
        marks: sub.marks,
        maxMarks: sub.assignmentId.maxMarks,
      });
    }
  });

  // Calculate percentage and grade for each subject
  return Array.from(subjectMap.values()).map((subject: any) => {
    const percentage =
      subject.totalMax > 0 ? (subject.totalObtained / subject.totalMax) * 100 : 0;

    let grade = "F";
    if (percentage >= 90) grade = "A+";
    else if (percentage >= 80) grade = "A";
    else if (percentage >= 70) grade = "B+";
    else if (percentage >= 60) grade = "B";
    else if (percentage >= 50) grade = "C+";
    else if (percentage >= 40) grade = "C";

    return {
      ...subject,
      percentage: Math.round(percentage * 100) / 100,
      grade,
      passed: percentage >= 40,
    };
  });
};

// Helper function to update academic history
const updateAcademicHistory = async (
  student: any, 
  semester: number, 
  passed: boolean, 
  promotedBy: mongoose.Types.ObjectId
) => {
  try {
    // Find the academic history record for this semester
    const semesterRecordIndex = student.academicHistory.findIndex(
      (record: any) => record.semester === semester
    );

    if (semesterRecordIndex !== -1) {
      // Update existing record
      student.academicHistory[semesterRecordIndex].semesterPassed = passed;
      student.academicHistory[semesterRecordIndex].promotedAt = new Date();
      student.academicHistory[semesterRecordIndex].promotedBy = promotedBy;
    } else {
      // Create new record if it doesn't exist
      student.academicHistory.push({
        semester,
        groupId: student.groupId, // Keep the current group ID
        subjects: [], // You might want to populate this with subject data later
        semesterPassed: passed,
        promotedAt: new Date(),
        promotedBy: promotedBy,
      });
    }
  } catch (error) {
    console.error("Error updating academic history:", error);
  }
};

// Promote students from a specific semester
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

    //  Select academicHistory field
    const students = await Student.find({
      currentSemester: semesterNum,
      status: { $in: ["active", "failed"] },
    }).select("studentId userId fullName status currentSemester groupId academicHistory");

    let promoted = 0;
    let failed = 0;
    let graduated = 0;
    const manualPromotionRequired: any[] = [];
    const results: any[] = [];

    for (const student of students) {
      const submissions = await getStudentSubmissions(student._id, semesterNum);

      if (!submissions || submissions.length === 0) {
        failed++;
        student.status = "failed";
        
        //  Set semesterPassed to false in academic history
        await updateAcademicHistory(student, semesterNum, false, req.user._id);
        await student.save();
        
        results.push({
          studentId: student._id,
          studentCode: student.studentId,
          fullName: student.fullName,
          status: "failed",
          reason: "No graded submissions found",
          attendancePercentage: 0,
          submissions: [],
        });
        continue;
      }

      const attendancePercentage = await calculateAttendancePercentage(
        student._id,
        semesterNum
      );
      const mainAssignmentsPassed = checkMainAssignmentsPassed(submissions);
      const mainAssignmentsCompleted = checkMainAssignmentsCompleted(submissions);
      const mainAssignmentResults = getMainAssignmentResults(submissions);
      const subjectResults = calculateSubjectResults(submissions);

      if (attendancePercentage >= 75 && mainAssignmentsPassed) {
        // Auto promotion
        if (semesterNum === 8) {
          student.status = "graduated";
          student.currentSemester = 8;
          
          //  Set semesterPassed to true in academic history
          await updateAcademicHistory(student, semesterNum, true, req.user._id);
          
          graduated++;
          results.push({
            studentId: student._id,
            studentCode: student.studentId,
            fullName: student.fullName,
            status: "graduated",
            attendancePercentage: Math.round(attendancePercentage * 100) / 100,
            mainAssignmentsPassed: true,
            mainAssignmentResults,
            subjectResults,
          });
        } else {
          student.status = "promoted";
          student.currentSemester = semesterNum + 1;
          student.groupId = undefined;
          
          //  Set semesterPassed to true in academic history
          await updateAcademicHistory(student, semesterNum, true, req.user._id);
          
          promoted++;
          results.push({
            studentId: student._id,
            studentCode: student.studentId,
            fullName: student.fullName,
            status: "promoted",
            newSemester: semesterNum + 1,
            attendancePercentage: Math.round(attendancePercentage * 100) / 100,
            mainAssignmentsPassed: true,
            mainAssignmentResults,
            subjectResults,
          });
        }
      } else if (mainAssignmentsPassed && attendancePercentage < 75) {
        // Manual promotion required
        manualPromotionRequired.push({
          studentId: student._id,
          studentCode: student.studentId,
          fullName: student.fullName,
          attendancePercentage: Math.round(attendancePercentage * 100) / 100,
          mainAssignmentsPassed: true,
          mainAssignmentResults,
          subjectResults,
        });
        results.push({
          studentId: student._id,
          studentCode: student.studentId,
          fullName: student.fullName,
          status: "manual_review_required",
          attendancePercentage: Math.round(attendancePercentage * 100) / 100,
          mainAssignmentsPassed: true,
          mainAssignmentResults,
          subjectResults,
          reason: "Low attendance but passed main assignments",
        });
      } else if (!mainAssignmentsCompleted) {
        student.status = "failed";
        
        //  Set semesterPassed to false in academic history
        await updateAcademicHistory(student, semesterNum, false, req.user._id);
        
        failed++;
        results.push({
          studentId: student._id,
          studentCode: student.studentId,
          fullName: student.fullName,
          status: "failed",
          attendancePercentage: Math.round(attendancePercentage * 100) / 100,
          mainAssignmentsPassed: false,
          mainAssignmentResults,
          subjectResults,
          reason: "Main assignments not completed",
        });
      } else {
        student.status = "failed";
        
        // Set semesterPassed to false in academic history
        await updateAcademicHistory(student, semesterNum, false, req.user._id);
        
        failed++;
        results.push({
          studentId: student._id,
          studentCode: student.studentId,
          fullName: student.fullName,
          status: "failed",
          attendancePercentage: Math.round(attendancePercentage * 100) / 100,
          mainAssignmentsPassed: false,
          mainAssignmentResults,
          subjectResults,
          reason: "Failed main assignments (marks below 40%)",
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
      results,
    });
  } catch (error: any) {
    console.error("Error in promoteSemester:", error);
    res.status(500).json({ message: error.message });
  }
};

// Manually promote specific students
export const manuallyPromoteStudents = async (
  req: CustomRequest,
  res: Response
) => {
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
        // ✅ UPDATED: Select academicHistory field
        const student = await Student.findById(studentId).select("studentId fullName status currentSemester groupId academicHistory");
        if (!student) {
          failed.push({ studentId, reason: "Student not found" });
          continue;
        }

        const submissions = await getStudentSubmissions(student._id, semesterNum);

        if (!submissions || submissions.length === 0) {
          failed.push({
            studentId,
            reason: "No graded submissions for this semester",
          });
          continue;
        }

        const mainAssignmentsPassed = checkMainAssignmentsPassed(submissions);
        if (!mainAssignmentsPassed) {
          const mainResults = getMainAssignmentResults(submissions);
          failed.push({
            studentId,
            reason: "Main assignments not passed (need at least 40% in each)",
            mainAssignmentResults: mainResults,
          });
          continue;
        }

        // Manual promotion approved
        if (semesterNum === 8) {
          student.status = "graduated";
          student.currentSemester = 8;
          
          // ✅ UPDATE: Set semesterPassed to true in academic history
          await updateAcademicHistory(student, semesterNum, true, req.user._id);
        } else {
          student.status = "promoted";
          student.currentSemester = semesterNum + 1;
          student.groupId = undefined;
          
          // ✅ UPDATE: Set semesterPassed to true in academic history
          await updateAcademicHistory(student, semesterNum, true, req.user._id);
        }

        await student.save();

        const mainResults = getMainAssignmentResults(submissions);
        const subjectResults = calculateSubjectResults(submissions);

        promoted.push({
          studentId: student._id,
          studentCode: student.studentId,
          fullName: student.fullName,
          newSemester: student.currentSemester,
          status: student.status,
          reason: reason || "Manual promotion approved",
          mainAssignmentResults: mainResults,
          subjectResults,
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
      failedStudents: failed,
    });
  } catch (error: any) {
    console.error("Error in manuallyPromoteStudents:", error);
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

    // ✅ ADDED: Populate fullName from Student model
    const students = await Student.find({
      currentSemester: semesterNum,
    }).select("studentId userId fullName status currentSemester groupId academicHistory");

    const report = await Promise.all(
      students.map(async (student) => {
        const submissions = await getStudentSubmissions(student._id, semesterNum);
        const attendancePercentage = await calculateAttendancePercentage(
          student._id,
          semesterNum
        );

        // Find academic history for this semester
        const semesterHistory = student.academicHistory.find(
          (history: any) => history.semester === semesterNum
        );

        if (!submissions || submissions.length === 0) {
          return {
            studentId: student._id,
            studentCode: student.studentId,
            fullName: student.fullName,
            currentStatus: student.status,
            attendancePercentage: Math.round(attendancePercentage * 100) / 100,
            mainAssignmentsPassed: false,
            mainAssignmentsCompleted: false,
            assignmentResults: [],
            promotionEligibility: "failed",
            reason: "No graded submissions",
            totalAssignments: 0,
            mainAssignmentsCount: 0,
            subjectResults: [],
            groupId: student.groupId,
            semesterPassed: semesterHistory?.semesterPassed || false,
          };
        }

        const mainAssignmentsPassed = checkMainAssignmentsPassed(submissions);
        const mainAssignmentsCompleted = checkMainAssignmentsCompleted(submissions);
        const mainAssignmentResults = getMainAssignmentResults(submissions);
        const subjectResults = calculateSubjectResults(submissions);

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
          reason = "Failed main assignments (marks below 40%)";
        }

        return {
          studentId: student._id,
          studentCode: student.studentId,
          fullName: student.fullName,
          currentStatus: student.status,
          attendancePercentage: Math.round(attendancePercentage * 100) / 100,
          mainAssignmentsPassed,
          mainAssignmentsCompleted,
          assignmentResults: mainAssignmentResults,
          subjectResults,
          promotionEligibility: eligibility,
          reason,
          totalAssignments: submissions.length,
          mainAssignmentsCount: mainAssignmentResults.length,
          groupId: student.groupId,
          semesterPassed: semesterHistory?.semesterPassed || false, 
        };
      })
    );

    res.status(200).json({
      semester: semesterNum,
      totalStudents: report.length,
      autoPromote: report.filter((r) => r.promotionEligibility === "auto_promote")
        .length,
      manualPromote: report.filter(
        (r) => r.promotionEligibility === "manual_promote"
      ).length,
      failed: report.filter((r) => r.promotionEligibility === "failed").length,
      report,
    });
  } catch (error: any) {
    console.error("Error in getPromotionReport:", error);
    res.status(500).json({ message: error.message });
  }
};

// Get student's main assignment details
export const getStudentMainAssignments = async (req: Request, res: Response) => {
  try {
    const { studentId, semester } = req.params;
    const semesterNum = parseInt(semester);

    // ✅ ADDED: Select fullName field
    const student = await Student.findById(studentId).select("studentId fullName status currentSemester academicHistory");
    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    const submissions = await getStudentSubmissions(student._id, semesterNum);
    const mainAssignmentResults = getMainAssignmentResults(submissions);

    // Find academic history for this semester
    const semesterHistory = student.academicHistory.find(
      (history: any) => history.semester === semesterNum
    );

    if (mainAssignmentResults.length === 0) {
      return res.status(404).json({
        message: "No main assignments found for this semester",
      });
    }

    res.status(200).json({
      studentId: student._id,
      studentCode: student.studentId,
      fullName: student.fullName,
      semester: semesterNum,
      mainAssignments: mainAssignmentResults,
      allPassed: mainAssignmentResults.every((ma: any) => ma.passed),
      allCompleted: mainAssignmentResults.length > 0,
      semesterPassed: semesterHistory?.semesterPassed || false, 
    });
  } catch (error: any) {
    console.error("Error in getStudentMainAssignments:", error);
    res.status(500).json({ message: error.message });
  }
};

// Calculate student's subject result
export const calculateSubjectResult = async (req: Request, res: Response) => {
  try {
    const { studentId, semester } = req.body;

    // ✅ ADDED: Select fullName field
    const student = await Student.findById(studentId).select("studentId fullName status currentSemester academicHistory");
    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    const submissions = await getStudentSubmissions(student._id, semester);

    if (!submissions || submissions.length === 0) {
      return res.status(404).json({
        message: "No submissions found for this semester",
      });
    }

    const subjectResults = calculateSubjectResults(submissions);

    // Find academic history for this semester
    const semesterHistory = student.academicHistory.find(
      (history: any) => history.semester === semester
    );

    res.status(200).json({
      message: "Subject results calculated",
      student: {
        _id: student._id,
        studentId: student.studentId,
        fullName: student.fullName,
        status: student.status,
      },
      semester,
      subjects: subjectResults,
      semesterPassed: semesterHistory?.semesterPassed || false, 
    });
  } catch (error: any) {
    console.error("Error in calculateSubjectResult:", error);
    res.status(500).json({ message: error.message });
  }
};