// controllers/attendanceController.ts
import { Request, Response } from "express";
import mongoose from "mongoose";
import Attendance from "../../models/Attendance";
import Student from "../../models/Student";
import Subject from "../../models/Subject";
import Group from "../../models/Group";
import Teacher from "../../models/Teacher";

// Helper function to determine attendance status
const getAttendanceStatus = (percentage: number): string => {
  if (percentage >= 75) return "excellent";
  if (percentage >= 65) return "good";
  if (percentage >= 50) return "satisfactory";
  return "poor";
};

// Get student's subjects and overall attendance summary
export const getStudentAttendanceSummary = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    // Find student by userId
    const student = await Student.findOne({ userId: req.user._id })
      .populate('groupId', 'name semester academicYear subjectTeachers');
    
    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    if (!student.groupId) {
      return res.status(400).json({ message: "Student is not assigned to any group" });
    }

    const group = student.groupId as any;

    // IMPROVED: Get subjects from group's subjectTeachers for current semester
    // This is more reliable than depending on academicHistory being populated
    let subjectIds: mongoose.Types.ObjectId[] = [];
    
    // First try to get from academic history
    const currentSemesterHistory = student.academicHistory.find(
      (history: any) => history.semester === student.currentSemester
    );

    if (currentSemesterHistory && currentSemesterHistory.subjects.length > 0) {
      // Use subjects from academic history
      subjectIds = currentSemesterHistory.subjects.map((s: any) => s.subjectId);
    } else {
      // Fallback: Get subjects from group's subjectTeachers
      if (group.subjectTeachers && group.subjectTeachers.length > 0) {
        subjectIds = group.subjectTeachers.map((st: any) => st.subjectId);
      } else {
        // Last fallback: Get subjects by semester from Subject collection
        const semesterSubjects = await Subject.find({ 
          semester: student.currentSemester 
        }).select('_id');
        subjectIds = semesterSubjects.map(s => s._id);
      }
    }

    if (subjectIds.length === 0) {
      return res.json({
        message: "No subjects found for current semester",
        data: {
          student: {
            studentId: student.studentId,
            fullName: req.user.fullName,
            currentSemester: student.currentSemester,
            groupId: student.groupId._id,
            groupName: group.name,
            enrollmentYear: student.enrollmentYear,
            status: student.status
          },
          subjects: [],
          attendanceSummary: [],
          overallSummary: {
            totalClasses: 0,
            present: 0,
            absent: 0,
            late: 0,
            excused: 0,
            attendancePercentage: 0,
            status: "poor"
          }
        }
      });
    }

    // Get subjects with details
    const subjects = await Subject.find({
      _id: { $in: subjectIds }
    }).select('code name credits');

    // Calculate attendance summary for each subject
    const attendanceSummary = await Promise.all(
      subjects.map(async (subject) => {
        const attendanceRecords = await Attendance.find({
          groupId: student.groupId,
          subjectId: subject._id,
          isSubmitted: true,
          "attendanceRecords.studentId": student._id
        });

        const totalClasses = attendanceRecords.length;
        const present = attendanceRecords.filter(record => 
          record.attendanceRecords.some(ar => 
            ar.studentId.toString() === student._id.toString() && 
            (ar.status === "present" || ar.status === "late")
          )
        ).length;
        
        const absent = attendanceRecords.filter(record => 
          record.attendanceRecords.some(ar => 
            ar.studentId.toString() === student._id.toString() && 
            ar.status === "absent"
          )
        ).length;
        
        const late = attendanceRecords.filter(record => 
          record.attendanceRecords.some(ar => 
            ar.studentId.toString() === student._id.toString() && 
            ar.status === "late"
          )
        ).length;
        
        const excused = attendanceRecords.filter(record => 
          record.attendanceRecords.some(ar => 
            ar.studentId.toString() === student._id.toString() && 
            ar.status === "excused"
          )
        ).length;

        const attendancePercentage = totalClasses > 0 ? Math.round((present / totalClasses) * 100) : 0;

        return {
          subjectId: subject._id,
          subjectCode: subject.code,
          subjectName: subject.name,
          credits: subject.credits,
          totalClasses,
          present,
          absent,
          late,
          excused,
          attendancePercentage,
          status: getAttendanceStatus(attendancePercentage)
        };
      })
    );

    // Calculate overall summary
    const overallSummary = attendanceSummary.reduce((acc, subject) => ({
      totalClasses: acc.totalClasses + subject.totalClasses,
      present: acc.present + subject.present,
      absent: acc.absent + subject.absent,
      late: acc.late + subject.late,
      excused: acc.excused + subject.excused
    }), { totalClasses: 0, present: 0, absent: 0, late: 0, excused: 0 });

    const overallPercentage = overallSummary.totalClasses > 0 
      ? Math.round((overallSummary.present / overallSummary.totalClasses) * 100) 
      : 0;

    res.json({
      message: "Student attendance summary fetched successfully",
      data: {
        student: {
          studentId: student.studentId,
          fullName: req.user.fullName,
          currentSemester: student.currentSemester,
          groupId: student.groupId._id,
          groupName: group.name,
          enrollmentYear: student.enrollmentYear,
          status: student.status
        },
        subjects: subjects,
        attendanceSummary,
        overallSummary: {
          ...overallSummary,
          attendancePercentage: overallPercentage,
          status: getAttendanceStatus(overallPercentage)
        }
      }
    });
  } catch (err: any) {
    console.error("Error in getStudentAttendanceSummary:", err);
    res.status(500).json({ message: err.message });
  }
};

// Get student's attendance records with filters
export const getStudentAttendanceRecords = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    const student = await Student.findOne({ userId: req.user._id });
    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    if (!student.groupId) {
      return res.status(400).json({ message: "Student is not assigned to any group" });
    }

    const { subjectId, month, year, limit } = req.query;
    
    let query: any = {
      groupId: student.groupId,
      isSubmitted: true,
      "attendanceRecords.studentId": student._id
    };

    // Filter by subject if provided
    if (subjectId && subjectId !== 'all') {
      query.subjectId = subjectId;
    }

    // Filter by month and year if provided
    if (month && year) {
      const startDate = new Date(parseInt(year as string), parseInt(month as string) - 1, 1);
      const endDate = new Date(parseInt(year as string), parseInt(month as string), 0);
      query.date = { $gte: startDate, $lte: endDate };
    }

    const attendanceRecords = await Attendance.find(query)
      .populate("subjectId", "code name")
      .populate("teacherId", "teacherId")
      .populate({
        path: "teacherId",
        populate: {
          path: "userId",
          select: "fullName"
        }
      })
      .select("date subjectId teacherId attendanceRecords")
      .sort({ date: -1 })
      .limit(limit ? parseInt(limit as string) : 50)
      .lean();

    // Transform records to student-focused format
    const studentRecords = attendanceRecords.map(record => {
      const studentRecord = record.attendanceRecords.find((ar: any) => 
        ar.studentId.toString() === student._id.toString()
      );

      return {
        _id: record._id,
        date: record.date,
        subjectId: {
          _id: record.subjectId._id,
          code: record.subjectId.code,
          name: record.subjectId.name
        },
        teacher: (record.teacherId as any)?.userId?.fullName || "Unknown",
        status: studentRecord?.status || "absent",
        remarks: studentRecord?.remarks || ""
      };
    });

    res.json({
      message: "Student attendance records fetched successfully",
      data: studentRecords
    });
  } catch (err: any) {
    console.error("Error in getStudentAttendanceRecords:", err);
    res.status(500).json({ message: err.message });
  }
};

// Get detailed attendance for a specific subject
export const getStudentSubjectAttendance = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    const student = await Student.findOne({ userId: req.user._id });
    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    if (!student.groupId) {
      return res.status(400).json({ message: "Student is not assigned to any group" });
    }

    const { subjectId } = req.params;
    const { month, year } = req.query;

    // IMPROVED: More lenient enrollment check
    let isEnrolled = false;
    
    // Check in academic history
    const currentSemesterHistory = student.academicHistory.find(
      (history: any) => history.semester === student.currentSemester
    );

    if (currentSemesterHistory) {
      isEnrolled = currentSemesterHistory.subjects.some(
        (subject: any) => subject.subjectId.toString() === subjectId
      );
    }

    // If not in academic history, check if subject belongs to student's group
    if (!isEnrolled) {
      const group = await Group.findById(student.groupId);
      if (group) {
        isEnrolled = group.subjectTeachers.some(
          (st: any) => st.subjectId.toString() === subjectId
        );
      }
    }

    if (!isEnrolled) {
      return res.status(403).json({ message: "Student is not enrolled in this subject" });
    }

    let query: any = {
      groupId: student.groupId,
      subjectId: subjectId,
      isSubmitted: true,
      "attendanceRecords.studentId": student._id
    };

    if (month && year) {
      const startDate = new Date(parseInt(year as string), parseInt(month as string) - 1, 1);
      const endDate = new Date(parseInt(year as string), parseInt(month as string), 0);
      query.date = { $gte: startDate, $lte: endDate };
    }

    const attendanceRecords = await Attendance.find(query)
      .populate("subjectId", "code name credits")
      .populate("teacherId", "teacherId")
      .populate({
        path: "teacherId",
        populate: {
          path: "userId",
          select: "fullName"
        }
      })
      .select("date subjectId teacherId attendanceRecords")
      .sort({ date: -1 });

    const subjectDetails = await Subject.findById(subjectId).select("code name credits");
    
    if (!subjectDetails) {
      return res.status(404).json({ message: "Subject not found" });
    }

    // Calculate subject statistics
    const totalClasses = attendanceRecords.length;
    const present = attendanceRecords.filter(record => 
      record.attendanceRecords.some(ar => 
        ar.studentId.toString() === student._id.toString() && 
        (ar.status === "present" || ar.status === "late")
      )
    ).length;
    
    const absent = attendanceRecords.filter(record => 
      record.attendanceRecords.some(ar => 
        ar.studentId.toString() === student._id.toString() && 
        ar.status === "absent"
      )
    ).length;
    
    const late = attendanceRecords.filter(record => 
      record.attendanceRecords.some(ar => 
        ar.studentId.toString() === student._id.toString() && 
        ar.status === "late"
      )
    ).length;
    
    const excused = attendanceRecords.filter(record => 
      record.attendanceRecords.some(ar => 
        ar.studentId.toString() === student._id.toString() && 
        ar.status === "excused"
      )
    ).length;

    const attendancePercentage = totalClasses > 0 ? Math.round((present / totalClasses) * 100) : 0;

    // Transform records
    const studentRecords = attendanceRecords.map(record => {
      const studentRecord = record.attendanceRecords.find((ar: any) => 
        ar.studentId.toString() === student._id.toString()
      );

      return {
        _id: record._id,
        date: record.date,
        teacher: (record.teacherId as any)?.userId?.fullName || "Unknown",
        status: studentRecord?.status || "absent",
        remarks: studentRecord?.remarks || ""
      };
    });

    res.json({
      message: "Subject attendance details fetched successfully",
      data: {
        subject: subjectDetails,
        statistics: {
          totalClasses,
          present,
          absent,
          late,
          excused,
          attendancePercentage,
          status: getAttendanceStatus(attendancePercentage)
        },
        attendanceRecords: studentRecords
      }
    });
  } catch (err: any) {
    console.error("Error in getStudentSubjectAttendance:", err);
    res.status(500).json({ message: err.message });
  }
};

// Get only student's subjects (for dropdown)
export const getStudentSubjects = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    const student = await Student.findOne({ userId: req.user._id })
      .populate('groupId', 'name semester subjectTeachers');
    
    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    if (!student.groupId) {
      return res.status(400).json({ message: "Student is not assigned to any group" });
    }

    const group = student.groupId as any;
    let subjectIds: mongoose.Types.ObjectId[] = [];

    // Get current semester subjects from academicHistory
    const currentSemesterHistory = student.academicHistory.find(
      (history: any) => history.semester === student.currentSemester
    );

    if (currentSemesterHistory && currentSemesterHistory.subjects.length > 0) {
      subjectIds = currentSemesterHistory.subjects.map((s: any) => s.subjectId);
    } else if (group.subjectTeachers && group.subjectTeachers.length > 0) {
      // Fallback to group's subjects
      subjectIds = group.subjectTeachers.map((st: any) => st.subjectId);
    }

    // Get subjects with details
    const subjects = await Subject.find({
      _id: { $in: subjectIds }
    }).select('code name credits');

    res.json({
      message: "Student subjects fetched successfully",
      data: {
        student: {
          studentId: student.studentId,
          fullName: req.user.fullName,
          semester: student.currentSemester,
          groupName: group.name,
          enrollmentYear: student.enrollmentYear
        },
        subjects: subjects
      }
    });
  } catch (err: any) {
    console.error("Error in getStudentSubjects:", err);
    res.status(500).json({ message: err.message });
  }
};