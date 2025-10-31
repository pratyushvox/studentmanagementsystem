// controllers/attendanceController.ts
import { Request, Response } from "express";
import Attendance from "../../models/Attendance";
import Group from "../../models/Group";
import Student from "../../models/Student";
import Subject from "../../models/Subject";
import Teacher from "../../models/Teacher";

// Get teacher's assigned groups and subjects for attendance
export const getTeacherAttendanceSetup = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    const teacher = await Teacher.findOne({ userId: req.user._id });
    if (!teacher) {
      return res.status(404).json({ message: "Teacher not found" });
    }

    // Find groups where this teacher is assigned to teach subjects
    const groups = await Group.find({
      "subjectTeachers.teacherId": teacher._id,
      isActive: true
    })
    .populate("students", "studentId userId")
    .populate({
      path: "subjectTeachers",
      match: { teacherId: teacher._id },
      populate: {
        path: "subjectId",
        select: "code name credits"
      }
    })
    .select("name semester academicYear students subjectTeachers")
    .lean();

    // Transform the data for frontend
    const attendanceSetup = groups.map(group => ({
      groupId: group._id,
      groupName: group.name,
      semester: group.semester,
      academicYear: group.academicYear,
      students: group.students,
      subjects: group.subjectTeachers
        .filter((st: any) => st.teacherId.toString() === teacher._id.toString())
        .map((st: any) => ({
          subjectId: st.subjectId._id,
          subjectCode: st.subjectId.code,
          subjectName: st.subjectId.name,
          credits: st.subjectId.credits
        }))
    }));

    res.json({
      message: "Attendance setup fetched successfully",
      data: attendanceSetup
    });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

// Create or update attendance
export const markAttendance = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    const teacher = await Teacher.findOne({ userId: req.user._id });
    if (!teacher) {
      return res.status(404).json({ message: "Teacher not found" });
    }

    const {
      date,
      subjectId,
      groupId,
      attendanceRecords
    } = req.body;

    // Validate that teacher is assigned to this subject and group
    const group = await Group.findOne({
      _id: groupId,
      "subjectTeachers": {
        $elemMatch: {
          subjectId: subjectId,
          teacherId: teacher._id
        }
      }
    });

    if (!group) {
      return res.status(403).json({ 
        message: "You are not assigned to teach this subject for the selected group" 
      });
    }

    // Validate that all students belong to the group
    const studentIds = attendanceRecords.map((record: any) => record.studentId);
    const studentsInGroup = await Student.find({
      _id: { $in: studentIds },
      groupId: groupId
    });

    if (studentsInGroup.length !== studentIds.length) {
      return res.status(400).json({ 
        message: "Some students don't belong to the selected group" 
      });
    }

    // Check if attendance already exists for this date-subject-group
    const existingAttendance = await Attendance.findOne({
      date: new Date(date),
      subjectId,
      groupId
    });

    let attendance;

    if (existingAttendance) {
      // Update existing attendance
      existingAttendance.attendanceRecords = attendanceRecords;
      existingAttendance.isSubmitted = true;
      existingAttendance.submittedAt = new Date();
      attendance = await existingAttendance.save();
    } else {
      // Create new attendance
      attendance = new Attendance({
        date: new Date(date),
        semester: group.semester,
        subjectId,
        teacherId: teacher._id,
        groupId,
        attendanceRecords,
        totalStudents: studentIds.length,
        isSubmitted: true,
        submittedAt: new Date()
      });
      await attendance.save();
    }

    const populatedAttendance = await Attendance.findById(attendance._id)
      .populate("subjectId", "code name")
      .populate("groupId", "name")
      .populate({
        path: "attendanceRecords.studentId",
        select: "studentId userId",
        populate: {
          path: "userId",
          select: "fullName"
        }
      });

    res.status(201).json({
      message: "Attendance marked successfully",
      attendance: populatedAttendance
    });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

// Get attendance records for a specific date and subject-group
export const getAttendanceByDate = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    const teacher = await Teacher.findOne({ userId: req.user._id });
    if (!teacher) {
      return res.status(404).json({ message: "Teacher not found" });
    }

    const { date, subjectId, groupId } = req.query;

    const attendance = await Attendance.findOne({
      date: new Date(date as string),
      subjectId,
      groupId,
      teacherId: teacher._id
    })
    .populate("subjectId", "code name")
    .populate("groupId", "name")
    .populate({
      path: "attendanceRecords.studentId",
      select: "studentId userId",
      populate: {
        path: "userId",
        select: "fullName"
      }
    });

    if (!attendance) {
      return res.status(404).json({ 
        message: "No attendance record found for the specified date" 
      });
    }

    res.json({
      message: "Attendance record fetched successfully",
      attendance
    });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

// Get attendance history for a subject-group
export const getAttendanceHistory = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    const teacher = await Teacher.findOne({ userId: req.user._id });
    if (!teacher) {
      return res.status(404).json({ message: "Teacher not found" });
    }

    const { subjectId, groupId, month, year } = req.query;
    
    let query: any = {
      subjectId,
      groupId,
      teacherId: teacher._id
    };

    // Filter by month and year if provided
    if (month && year) {
      const startDate = new Date(parseInt(year as string), parseInt(month as string) - 1, 1);
      const endDate = new Date(parseInt(year as string), parseInt(month as string), 0);
      query.date = { $gte: startDate, $lte: endDate };
    }

    const attendanceHistory = await Attendance.find(query)
      .populate("subjectId", "code name")
      .populate("groupId", "name")
      .select("date totalPresent totalAbsent totalLate totalStudents isSubmitted")
      .sort({ date: -1 });

    res.json({
      message: "Attendance history fetched successfully",
      attendanceHistory
    });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

// Get student attendance summary
export const getStudentAttendanceSummary = async (req: Request, res: Response) => {
  try {
    const { studentId, subjectId, groupId } = req.query;

    const attendanceRecords = await Attendance.find({
      "attendanceRecords.studentId": studentId,
      subjectId,
      groupId,
      isSubmitted: true
    })
    .select("date attendanceRecords")
    .sort({ date: 1 });

    const summary = {
      totalClasses: attendanceRecords.length,
      present: attendanceRecords.filter(record => 
        record.attendanceRecords.some(ar => 
          ar.studentId.toString() === studentId && 
          (ar.status === "present" || ar.status === "late")
        )
      ).length,
      absent: attendanceRecords.filter(record => 
        record.attendanceRecords.some(ar => 
          ar.studentId.toString() === studentId && 
          ar.status === "absent"
        )
      ).length,
      late: attendanceRecords.filter(record => 
        record.attendanceRecords.some(ar => 
          ar.studentId.toString() === studentId && 
          ar.status === "late"
        )
      ).length,
      excused: attendanceRecords.filter(record => 
        record.attendanceRecords.some(ar => 
          ar.studentId.toString() === studentId && 
          ar.status === "excused"
        )
      ).length,
      attendancePercentage: 0
    };

    if (summary.totalClasses > 0) {
      summary.attendancePercentage = Math.round(
        (summary.present / summary.totalClasses) * 100
      );
    }

    res.json({
      message: "Student attendance summary fetched successfully",
      summary
    });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

// Bulk attendance for multiple dates
export const markBulkAttendance = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    const teacher = await Teacher.findOne({ userId: req.user._id });
    if (!teacher) {
      return res.status(404).json({ message: "Teacher not found" });
    }

    const { attendanceData } = req.body; // Array of { date, subjectId, groupId, attendanceRecords }

    const results = [];

    for (const data of attendanceData) {
      const { date, subjectId, groupId, attendanceRecords } = data;

      // Validate teacher assignment
      const group = await Group.findOne({
        _id: groupId,
        "subjectTeachers": {
          $elemMatch: {
            subjectId: subjectId,
            teacherId: teacher._id
          }
        }
      });

      if (!group) {
        results.push({
          date,
          subjectId,
          groupId,
          success: false,
          message: "Not authorized to mark attendance for this subject-group"
        });
        continue;
      }

      try {
        const existingAttendance = await Attendance.findOne({
          date: new Date(date),
          subjectId,
          groupId
        });

        let attendance;

        if (existingAttendance) {
          existingAttendance.attendanceRecords = attendanceRecords;
          existingAttendance.isSubmitted = true;
          existingAttendance.submittedAt = new Date();
          attendance = await existingAttendance.save();
        } else {
          attendance = new Attendance({
            date: new Date(date),
            semester: group.semester,
            subjectId,
            teacherId: teacher._id,
            groupId,
            attendanceRecords,
            totalStudents: attendanceRecords.length,
            isSubmitted: true,
            submittedAt: new Date()
          });
          await attendance.save();
        }

        results.push({
          date,
          subjectId,
          groupId,
          success: true,
          message: "Attendance marked successfully",
          attendanceId: attendance._id
        });
      } catch (error: any) {
        results.push({
          date,
          subjectId,
          groupId,
          success: false,
          message: error.message
        });
      }
    }

    res.json({
      message: "Bulk attendance marking completed",
      results
    });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};