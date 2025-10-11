import { Request, Response } from "express";
import Student from "../../models/Student";
import Group from "../../models/Group";

// Promote students from a specific semester
export const promoteSemester = async (req: Request, res: Response) => {
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
      status: "active"
    });

    let promoted = 0;
    let failed = 0;
    let graduated = 0;

    for (const student of students) {
      // Get current semester history
      const currentHistory = student.academicHistory.find(
        h => h.semester === semesterNum
      );

      if (!currentHistory) {
        failed++;
        continue;
      }

      // Check if all subjects are passed
      const allPassed = currentHistory.subjects.every(s => s.passed);

      if (allPassed) {
        currentHistory.semesterPassed = true;
        currentHistory.promotedAt = new Date();
        currentHistory.promotedBy = req.user._id;

        if (semesterNum === 8) {
          student.status = "graduated";
          student.currentSemester = 8;
          graduated++;
        } else {
          student.status = "promoted";
          student.currentSemester = semesterNum + 1;
          // Clear groupId so admin can assign new group
          student.groupId = undefined;
          promoted++;
        }
      } else {
        student.status = "failed";
        currentHistory.semesterPassed = false;
        failed++;
      }

      await student.save();
    }

    res.status(200).json({
      message: "Promotion process completed",
      semester: semesterNum,
      total: students.length,
      promoted,
      failed,
      graduated
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
      h => h.semester === semester
    );

    if (!semesterHistory) {
      return res.status(404).json({ message: "Semester history not found" });
    }

    // Calculate results for each subject
    semesterHistory.subjects.forEach(subject => {
      let totalObtained = 0;
      let totalMax = 0;

      // Weekly assignments
      subject.weeklyAssignments.forEach(wa => {
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
      const percentage = (totalObtained / totalMax) * 100;
      subject.percentage = percentage;

      // Grading system
      if (percentage >= 90) subject.grade = "A+";
      else if (percentage >= 80) subject.grade = "A";
      else if (percentage >= 70) subject.grade = "B+";
      else if (percentage >= 60) subject.grade = "B";
      else if (percentage >= 50) subject.grade = "C+";
      else if (percentage >= 40) subject.grade = "C";
      else subject.grade = "F";

      // Pass/Fail (40% passing)
      subject.passed = percentage >= 40;
    });

    await student.save();

    res.status(200).json({
      message: "Subject results calculated",
      student,
      semesterHistory
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// Get semester statistics
export const getSemesterStats = async (_req: Request, res: Response) => {
  try {
    const stats = [];

    for (let sem = 1; sem <= 8; sem++) {
      const total = await Student.countDocuments({ currentSemester: sem });
      const active = await Student.countDocuments({ currentSemester: sem, status: "active" });
      const groups = await Group.countDocuments({ semester: sem, isActive: true });

      stats.push({
        semester: sem,
        totalStudents: total,
        activeStudents: active,
        groups
      });
    }

    res.status(200).json(stats);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};