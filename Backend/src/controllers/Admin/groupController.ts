import { Request, Response } from "express";
import Group from "../../models/Group";
import Student from "../../models/Student";
import Teacher from "../../models/Teacher";

// 🟢 Create group
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
      capacity: capacity || 50,
    });

    res.status(201).json({ message: "Group created successfully", group });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// 🟢 Get all groups (with populated students + teachers)
export const getAllGroups = async (_req: Request, res: Response) => {
  try {
    const groups = await Group.find()
      .populate({
        path: "students",
        select: "fullName email userId currentSemester studentId phoneNumber",
        populate: {
          path: "userId",
          select: "fullName email"
        }
      })
      .populate({
        path: "subjectTeachers.teacherId",
        select: "fullName email teacherId",
      });

    res.status(200).json(groups);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// 🟢 Get groups by semester
export const getGroupsBySemester = async (req: Request, res: Response) => {
  try {
    const { semester } = req.params;
    const groups = await Group.find({ semester: parseInt(semester), isActive: true })
      .populate({
        path: "students",
        select: "fullName email userId currentSemester studentId phoneNumber",
        populate: {
          path: "userId",
          select: "fullName email"
        }
      });

    res.status(200).json(groups);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// 🟢 Get single group by ID with full details
export const getGroupById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const group = await Group.findById(id)
      .populate({
        path: "students",
        select: "studentId currentSemester enrollmentYear status phoneNumber dateOfBirth",
        populate: {
          path: "userId",
          select: "fullName email"
        }
      })
      .populate({
        path: "subjectTeachers.teacherId",
        select: "fullName email teacherId",
        populate: {
          path: "userId",
          select: "fullName email"
        }
      })
      .populate({
        path: "subjectTeachers.subjectId",
        select: "name code credits"
      });

    if (!group) {
      return res.status(404).json({ message: "Group not found" });
    }

    res.status(200).json(group);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// 🟢 Assign teacher to subject in group
export const assignTeacherToGroup = async (req: Request, res: Response) => {
  try {
    const { groupId, subjectId, teacherId } = req.body;

    const group = await Group.findById(groupId);
    if (!group) return res.status(404).json({ message: "Group not found" });

    // Check if subject already assigned
    const exists = group.subjectTeachers.some(
      (st) => st.subjectId.toString() === subjectId
    );

    if (exists) {
      group.subjectTeachers = group.subjectTeachers.map((st) =>
        st.subjectId.toString() === subjectId
          ? { ...st, teacherId, assignedAt: new Date() }
          : st
      );
    } else {
      group.subjectTeachers.push({
        subjectId,
        teacherId,
        assignedAt: new Date(),
      });
    }

    await group.save();

    // Update teacher's assignedSubjects
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
          groups: [groupId],
        });
      }
      await teacher.save();
    }

    res.status(200).json({ message: "Teacher assigned successfully", group });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// 🟢 Assign single student to group
export const assignStudentToGroup = async (req: Request, res: Response) => {
  try {
    const { studentId, groupId } = req.body;

    const group = await Group.findById(groupId).populate('students');
    if (!group) return res.status(404).json({ message: "Group not found" });

    // Check capacity using virtual studentCount
    if (group.studentCount >= group.capacity) {
      return res.status(400).json({ message: "Group is full" });
    }

    const student = await Student.findById(studentId).populate("userId", "fullName email");
    if (!student) return res.status(404).json({ message: "Student not found" });

    student.groupId = groupId;
    await student.save();

    if (!group.students.includes(student._id)) {
      group.students.push(student._id);
    }
    await group.save();

    // Populate all students with full details
    const populatedGroup = await Group.findById(groupId)
      .populate({
        path: "students",
        select: "studentId currentSemester enrollmentYear status",
        populate: {
          path: "userId",
          select: "fullName email"
        }
      });

    res.status(200).json({ 
      message: "Student assigned to group", 
      student: {
        _id: student._id,
        studentId: student.studentId,
        fullName: (student.userId as any).fullName,
        email: (student.userId as any).email,
        currentSemester: student.currentSemester
      },
      group: populatedGroup 
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// 🟢 Auto-assign students (Round-Robin)
export const autoAssignStudents = async (req: Request, res: Response) => {
  try {
    const unassignedStudents = await Student.find({
      $or: [{ groupId: { $exists: false } }, { groupId: null }],
      status: "active",
    })
    .populate("userId", "fullName email")
    .sort({ currentSemester: 1, createdAt: 1 });

    if (unassignedStudents.length === 0) {
      return res.status(200).json({
        success: true,
        message: "No unassigned students found",
        assigned: 0,
        skipped: 0,
        details: [],
      });
    }

    const studentsBySemester: { [key: number]: any[] } = {};
    unassignedStudents.forEach((student) => {
      const sem = student.currentSemester;
      if (!studentsBySemester[sem]) studentsBySemester[sem] = [];
      studentsBySemester[sem].push(student);
    });

    let totalAssigned = 0;
    let totalSkipped = 0;
    const assignmentDetails: any[] = [];

    for (const [semester, students] of Object.entries(studentsBySemester)) {
      const semesterNum = parseInt(semester);

      // Get available groups and populate students to calculate current count
      const availableGroups = await Group.find({
        semester: semesterNum,
        isActive: true,
      }).populate('students').sort({ createdAt: 1 });

      // Filter groups that have space
      const groupsWithSpace = availableGroups.filter(g => g.studentCount < g.capacity);

      if (groupsWithSpace.length === 0) {
        totalSkipped += students.length;
        assignmentDetails.push({
          semester: semesterNum,
          assigned: 0,
          skipped: students.length,
          reason: "No available groups for this semester",
        });
        continue;
      }

      let assigned = 0;
      let skipped = 0;
      let groupIndex = 0;

      for (const student of students) {
        let studentAssigned = false;
        let attempts = 0;

        while (attempts < groupsWithSpace.length && !studentAssigned) {
          const currentGroup = groupsWithSpace[groupIndex];

          // Recalculate current count
          const currentCount = currentGroup.students.length;

          if (currentCount < currentGroup.capacity) {
            student.groupId = currentGroup._id;
            await student.save();

            if (!currentGroup.students.includes(student._id)) {
              currentGroup.students.push(student._id);
            }

            await currentGroup.save();

            assigned++;
            studentAssigned = true;
          }

          groupIndex = (groupIndex + 1) % groupsWithSpace.length;
          attempts++;
        }

        if (!studentAssigned) skipped++;
      }

      totalAssigned += assigned;
      totalSkipped += skipped;

      assignmentDetails.push({
        semester: semesterNum,
        assigned,
        skipped,
      });
    }

    res.status(200).json({
      success: true,
      message: `Auto-assignment completed. Assigned ${totalAssigned} students.`,
      assigned: totalAssigned,
      skipped: totalSkipped,
      details: assignmentDetails,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: "Failed to auto-assign students",
      error: error.message,
    });
  }
};

// 🟢 Update group
export const updateGroup = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, semester, academicYear, capacity } = req.body;

    const group = await Group.findById(id).populate('students');
    if (!group) return res.status(404).json({ message: "Group not found" });

    if (name) group.name = name;
    if (semester) group.semester = semester;
    if (academicYear) group.academicYear = academicYear;
    
    // Check capacity against current student count (virtual)
    if (capacity && capacity >= group.studentCount) {
      group.capacity = capacity;
    } else if (capacity && capacity < group.studentCount) {
      return res.status(400).json({ message: "Capacity cannot be less than student count" });
    }

    await group.save();
    
    // Return group with populated students
    const populatedGroup = await Group.findById(id)
      .populate({
        path: "students",
        select: "studentId currentSemester",
        populate: {
          path: "userId",
          select: "fullName email"
        }
      });
    
    res.status(200).json({ message: "Group updated successfully", group: populatedGroup });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// 🟢 Delete group
export const deleteGroup = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const group = await Group.findById(id).populate('students');
    if (!group) return res.status(404).json({ message: "Group not found" });

    // Use virtual studentCount
    if (group.studentCount > 0)
      return res.status(400).json({
        message: `Cannot delete group with ${group.studentCount} students.`,
      });

    await Group.findByIdAndDelete(id);
    res.status(200).json({ message: "Group deleted successfully" });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// 🟢 Get students by group
export const getStudentsByGroup = async (req: Request, res: Response) => {
  try {
    const { groupId } = req.query;

    if (!groupId) return res.status(400).json({ message: "Group ID is required" });

    const group = await Group.findById(groupId)
      .populate({
        path: "students",
        select: "studentId currentSemester enrollmentYear status phoneNumber",
        populate: {
          path: "userId",
          select: "fullName email"
        },
        options: { sort: { "userId.fullName": 1 } },
      })
      .select("name semester capacity students");

    if (!group) return res.status(404).json({ message: "Group not found" });

    res.status(200).json({
      groupName: group.name,
      semester: group.semester,
      capacity: group.capacity,
      studentCount: group.studentCount, // Virtual field will be available
      students: group.students,
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// 🟢 Remove student from group
export const removeStudentFromGroup = async (req: Request, res: Response) => {
  try {
    const { studentId, groupId } = req.body;

    const group = await Group.findById(groupId);
    if (!group) return res.status(404).json({ message: "Group not found" });

    const student = await Student.findById(studentId);
    if (!student) return res.status(404).json({ message: "Student not found" });

    // Remove student from group
    group.students = group.students.filter(id => id.toString() !== studentId);
    await group.save();

    // Clear groupId from student
    student.groupId = undefined;
    await student.save();

    const populatedGroup = await Group.findById(groupId)
      .populate({
        path: "students",
        select: "studentId currentSemester",
        populate: {
          path: "userId",
          select: "fullName email"
        }
      });

    res.status(200).json({ 
      message: "Student removed from group", 
      group: populatedGroup 
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};