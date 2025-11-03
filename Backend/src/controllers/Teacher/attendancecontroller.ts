// controllers/Teacher/attendancecontroller.ts
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
    .populate({
      path: "students",
      select: "studentId userId currentSemester enrollmentYear status",
      populate: {
        path: "userId",
        select: "fullName email"
      }
    })
    .populate({
      path: "subjectTeachers.subjectId",
      select: "code name credits"
    })
    .select("name semester academicYear students subjectTeachers")
    .lean();

    // Transform the data for frontend
    const attendanceSetup = groups.map(group => {
      // Filter subject teachers to only include this teacher's assignments
      const teacherSubjects = (group.subjectTeachers as any[])
        .filter((st: any) => st.teacherId.toString() === teacher._id.toString())
        .map((st: any) => ({
          subjectId: st.subjectId._id,
          subjectCode: st.subjectId.code,
          subjectName: st.subjectId.name,
          credits: st.subjectId.credits
        }));

      // Transform students data
      const students = (group.students || []).map((student: any) => ({
        _id: student._id,
        studentId: student.studentId,
        fullName: student.userId?.fullName || 'N/A',
        email: student.userId?.email || 'N/A',
        currentSemester: student.currentSemester,
        enrollmentYear: student.enrollmentYear,
        status: student.status
      }));

      return {
        groupId: group._id,
        groupName: group.name,
        semester: group.semester,
        academicYear: group.academicYear,
        students: students,
        subjects: teacherSubjects
      };
    });

    res.json({
      message: "Attendance setup fetched successfully",
      data: attendanceSetup
    });
  } catch (err: any) {
    console.error("Error in getTeacherAttendanceSetup:", err);
    res.status(500).json({ message: err.message });
  }
};

// Get students for a specific group (with subject validation) - FIXED VERSION
export const getGroupStudentsForAttendance = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    const teacher = await Teacher.findOne({ userId: req.user._id });
    if (!teacher) {
      return res.status(404).json({ message: "Teacher not found" });
    }

    const { groupId } = req.params;
    const { subjectId } = req.query;

    if (!subjectId) {
      return res.status(400).json({ message: "Subject ID is required" });
    }

    console.log("🔍 === ATTENDANCE DEBUG START ===");
    console.log("📋 Request Details:", {
      groupId,
      subjectId,
      teacherId: teacher._id,
      teacherName: teacher.userId?.fullName
    });

    // ✅ FIX: Use proper population for students
    const group = await Group.findOne({
      _id: groupId,
      isActive: true,
      subjectTeachers: {
        $elemMatch: {
          subjectId: subjectId,
          teacherId: teacher._id
        }
      }
    })
    .populate({
      path: "students", // ✅ FIXED: Proper population
      select: "studentId userId currentSemester enrollmentYear status phoneNumber dateOfBirth",
      populate: {
        path: "userId",
        select: "fullName email"
      }
    })
    .populate('subjectTeachers.subjectId', 'name code')
    .populate('subjectTeachers.teacherId', 'userId')
    .lean();

    console.log("📊 Group Query Result:", group ? "FOUND" : "NOT FOUND");

    if (!group) {
      console.log("❌ Group not found or teacher not assigned");
      return res.status(403).json({ 
        message: "You are not assigned to teach any subject in this group" 
      });
    }

    // ✅ FIX: Directly use populated students from group
    let students = [];
    if (group.students && group.students.length > 0) {
      console.log("✅ Using populated students from group");
      students = (group.students as any[]).map(student => ({
        _id: student._id,
        studentId: student.studentId,
        fullName: student.userId?.fullName || 'N/A',
        email: student.userId?.email || 'N/A',
        currentSemester: student.currentSemester,
        enrollmentYear: student.enrollmentYear,
        status: student.status,
        phoneNumber: student.phoneNumber,
        dateOfBirth: student.dateOfBirth
      }));
    }

    console.log("📈 Group Analysis:", {
      groupName: group.name,
      semester: group.semester,
      studentCount: group.students?.length || 0,
      studentsFound: students.length,
      studentDetails: students.map(s => ({
        id: s._id,
        name: s.fullName,
        studentId: s.studentId
      }))
    });

    console.log("✅ === ATTENDANCE DEBUG END ===");

    res.json({
      message: students.length > 0 
        ? "Students fetched successfully" 
        : "No students found in this group",
      students: students
    });

  } catch (err: any) {
    console.error('❌ ERROR in getGroupStudentsForAttendance:', err);
    res.status(500).json({ 
      message: err.message,
      error: "Internal server error in attendance system"
    });
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

    // Validate required fields
    if (!date || !subjectId || !groupId || !attendanceRecords) {
      return res.status(400).json({ 
        message: "Missing required fields: date, subjectId, groupId, attendanceRecords" 
      });
    }

    if (!Array.isArray(attendanceRecords) || attendanceRecords.length === 0) {
      return res.status(400).json({ 
        message: "Attendance records must be a non-empty array" 
      });
    }

    // Validate that teacher is assigned to this subject and group
    const group = await Group.findOne({
      _id: groupId,
      subjectTeachers: {
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
    console.error("Error in markAttendance:", err);
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

    if (!date || !subjectId || !groupId) {
      return res.status(400).json({ 
        message: "Missing required query parameters: date, subjectId, groupId" 
      });
    }

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
    console.error("Error in getAttendanceByDate:", err);
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
    
    if (!subjectId || !groupId) {
      return res.status(400).json({ 
        message: "Missing required query parameters: subjectId, groupId" 
      });
    }

    let query: any = {
      subjectId,
      groupId,
      teacherId: teacher._id,
      isSubmitted: true
    };

    // Filter by month and year if provided
    if (month && year) {
      const startDate = new Date(parseInt(year as string), parseInt(month as string) - 1, 1);
      const endDate = new Date(parseInt(year as string), parseInt(month as string), 0, 23, 59, 59, 999);
      query.date = { $gte: startDate, $lte: endDate };
    }

    const attendanceHistory = await Attendance.find(query)
      .populate("subjectId", "code name")
      .populate("groupId", "name")
      .select("date totalPresent totalAbsent totalLate totalStudents isSubmitted submittedAt")
      .sort({ date: -1 })
      .lean();

    res.json({
      message: "Attendance history fetched successfully",
      attendanceHistory
    });
  } catch (err: any) {
    console.error("Error in getAttendanceHistory:", err);
    res.status(500).json({ message: err.message });
  }
};

// Get student attendance summary
export const getStudentAttendanceSummary = async (req: Request, res: Response) => {
  try {
    const { studentId, subjectId, groupId } = req.query;

    if (!studentId || !subjectId || !groupId) {
      return res.status(400).json({ 
        message: "Missing required query parameters: studentId, subjectId, groupId" 
      });
    }

    const attendanceRecords = await Attendance.find({
      "attendanceRecords.studentId": studentId,
      subjectId,
      groupId,
      isSubmitted: true
    })
    .select("date attendanceRecords")
    .sort({ date: 1 })
    .lean();

    const summary = {
      totalClasses: attendanceRecords.length,
      present: 0,
      absent: 0,
      late: 0,
      excused: 0,
      attendancePercentage: 0
    };

    attendanceRecords.forEach(record => {
      const studentRecord = record.attendanceRecords.find(
        (ar: any) => ar.studentId.toString() === studentId
      );
      
      if (studentRecord) {
        if (studentRecord.status === "present") summary.present++;
        else if (studentRecord.status === "absent") summary.absent++;
        else if (studentRecord.status === "late") summary.late++;
        else if (studentRecord.status === "excused") summary.excused++;
      }
    });

    if (summary.totalClasses > 0) {
      // Calculate percentage: (present + late) / total * 100
      summary.attendancePercentage = Math.round(
        ((summary.present + summary.late) / summary.totalClasses) * 100
      );
    }

    res.json({
      message: "Student attendance summary fetched successfully",
      summary
    });
  } catch (err: any) {
    console.error("Error in getStudentAttendanceSummary:", err);
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

    const { attendanceData } = req.body;

    if (!Array.isArray(attendanceData) || attendanceData.length === 0) {
      return res.status(400).json({ 
        message: "attendanceData must be a non-empty array" 
      });
    }

    const results = [];

    for (const data of attendanceData) {
      const { date, subjectId, groupId, attendanceRecords } = data;

      // Validate teacher assignment
      const group = await Group.findOne({
        _id: groupId,
        subjectTeachers: {
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
    console.error("Error in markBulkAttendance:", err);
    res.status(500).json({ message: err.message });
  }
};