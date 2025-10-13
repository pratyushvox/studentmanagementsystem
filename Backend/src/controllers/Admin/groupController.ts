import { Request, Response } from "express";
import Group from "../../models/Group";
import Student from "../../models/Student";

// Create group
export const createGroup = async (req: Request, res: Response) => {
  try {
    const { name, semester, academicYear, capacity } = req.body;

    if (!name || !semester || !academicYear) {
      return res.status(400).json({ message: "Name, semester, and academic year are required" });
    }

    const group = await Group.create({
      name,
      semester,
      academicYear,
      capacity: capacity || 50
    });

    res.status(201).json({ message: "Group created successfully", group });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// Get all groups
export const getAllGroups = async (_req: Request, res: Response) => {
  try {
    const groups = await Group.find().populate("subjectTeachers.teacherId", "fullName");
    res.status(200).json(groups);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// Get groups by semester
export const getGroupsBySemester = async (req: Request, res: Response) => {
  try {
    const { semester } = req.params;
    const groups = await Group.find({ semester: parseInt(semester), isActive: true });
    res.status(200).json(groups);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// Assign teacher to subject in group
export const assignTeacherToGroup = async (req: Request, res: Response) => {
  try {
    const { groupId, subjectId, teacherId } = req.body;

    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ message: "Group not found" });
    }

    // Check if assignment already exists
    const exists = group.subjectTeachers.some(
      st => st.subjectId.toString() === subjectId
    );

    if (exists) {
      // Update existing assignment
      group.subjectTeachers = group.subjectTeachers.map(st =>
        st.subjectId.toString() === subjectId
          ? { ...st, teacherId, assignedAt: new Date() }
          : st
      );
    } else {
      // Add new assignment
      group.subjectTeachers.push({
        subjectId,
        teacherId,
        assignedAt: new Date()
      });
    }

    await group.save();

    // Also update teacher's assignedSubjects
    const Teacher = require("../../models/Teacher").default;
    const teacher = await Teacher.findById(teacherId);
    if (teacher) {
      const subjectAssignment = teacher.assignedSubjects.find(
        (as: any) => as.subjectId.toString() === subjectId
      );

      if (subjectAssignment) {
        if (!subjectAssignment.groups.includes(groupId)) {
          subjectAssignment.groups.push(groupId);
        }
      } else {
        teacher.assignedSubjects.push({
          subjectId,
          semester: group.semester,
          groups: [groupId]
        });
      }
      await teacher.save();
    }

    res.status(200).json({ message: "Teacher assigned successfully", group });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// Assign student to group
export const assignStudentToGroup = async (req: Request, res: Response) => {
  try {
    const { studentId, groupId } = req.body;

    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ message: "Group not found" });
    }

    if (group.studentCount >= group.capacity) {
      return res.status(400).json({ message: "Group is full" });
    }

    const student = await Student.findByIdAndUpdate(
      studentId,
      { groupId },
      { new: true }
    );

    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    group.studentCount += 1;
    await group.save();

    res.status(200).json({ message: "Student assigned to group", student, group });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};


//Auto assign to the group 


export const autoAssignStudents = async (req: Request, res: Response) => {
  try {
    // Find all students without groups (unassigned)
    const unassignedStudents = await Student.find({
      $or: [
        { groupId: { $exists: false } },
        { groupId: null }
      ],
      status: "active"
    }).sort({ currentSemester: 1, createdAt: 1 });

    if (unassignedStudents.length === 0) {
      return res.status(200).json({
        success: true,
        message: "No unassigned students found",
        assigned: 0,
        skipped: 0,
        details: []
      });
    }

    console.log(`Found ${unassignedStudents.length} unassigned students`);

    // Group students by semester
    const studentsBySemester: { [key: number]: any[] } = {};
    unassignedStudents.forEach(student => {
      const sem = student.currentSemester;
      if (!studentsBySemester[sem]) {
        studentsBySemester[sem] = [];
      }
      studentsBySemester[sem].push(student);
    });

    let totalAssigned = 0;
    let totalSkipped = 0;
    const assignmentDetails: any[] = [];

    // Process each semester separately
    for (const [semester, students] of Object.entries(studentsBySemester)) {
      const semesterNum = parseInt(semester);
      
      console.log(`\nProcessing Semester ${semesterNum}: ${students.length} students`);

      // Find available groups for this semester (with space)
      const availableGroups = await Group.find({
        semester: semesterNum,
        isActive: true,
        $expr: { $lt: ["$studentCount", "$capacity"] }
      }).sort({ studentCount: 1 }); // Start with least filled groups

      if (availableGroups.length === 0) {
        console.log(` No available groups for Semester ${semesterNum}`);
        totalSkipped += students.length;
        assignmentDetails.push({
          semester: semesterNum,
          assigned: 0,
          skipped: students.length,
          reason: "No available groups for this semester",
          totalStudents: students.length,
          availableGroups: 0
        });
        continue;
      }

      console.log(`✅ Found ${availableGroups.length} available groups`);

      let assigned = 0;
      let skipped = 0;
      let groupIndex = 0; // Track which group to assign next (Round-Robin)

      // ROUND-ROBIN ASSIGNMENT
      for (const student of students) {
        let attempts = 0;
        let studentAssigned = false;

        // Try to assign to a group (try all groups once)
        while (attempts < availableGroups.length && !studentAssigned) {
          const currentGroup = availableGroups[groupIndex];

          // Check if current group has available space
          if (currentGroup.studentCount < currentGroup.capacity) {
            // ✅ ASSIGN STUDENT TO GROUP
            student.groupId = currentGroup._id;
            await student.save();

            // Update group count
            currentGroup.studentCount += 1;
            await currentGroup.save();

            console.log(`✅ Assigned ${student.userId} to ${currentGroup.name} (${currentGroup.studentCount}/${currentGroup.capacity})`);

            assigned++;
            studentAssigned = true;
          } else {
            console.log(`⚠️ ${currentGroup.name} is full (${currentGroup.studentCount}/${currentGroup.capacity})`);
          }

          // Move to next group in round-robin fashion
          groupIndex = (groupIndex + 1) % availableGroups.length;
          attempts++;
        }

        // If student couldn't be assigned after trying all groups
        if (!studentAssigned) {
          console.log(` Could not assign student ${student.userId} - all groups full`);
          skipped++;
        }
      }

      totalAssigned += assigned;
      totalSkipped += skipped;

      assignmentDetails.push({
        semester: semesterNum,
        assigned,
        skipped,
        totalStudents: students.length,
        availableGroups: availableGroups.length,
        groupDistribution: availableGroups.map(g => ({
          groupName: g.name,
          students: g.studentCount,
          capacity: g.capacity
        }))
      });

      console.log(`📊 Semester ${semesterNum} Summary: Assigned ${assigned}, Skipped ${skipped}`);
    }

    // Final response
    res.status(200).json({
      success: true,
      message: `Auto-assignment completed. Assigned ${totalAssigned} students across ${Object.keys(studentsBySemester).length} semester(s).`,
      assigned: totalAssigned,
      skipped: totalSkipped,
      totalProcessed: unassignedStudents.length,
      algorithm: "Round-Robin",
      details: assignmentDetails
    });

  } catch (error: any) {
    console.error(" Error in auto-assign:", error);
    res.status(500).json({ 
      success: false,
      message: "Failed to auto-assign students",
      error: error.message 
    });
  }
};