import { Request, Response } from "express";
import Group from "../../models/Group";
import Student from "../../models/Student";
import Teacher from "../../models/Teacher";
import Subject from "../../models/Subject";

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
// 🟢 Assign teacher to subject in group
export const assignTeacherToGroup = async (req: Request, res: Response) => {
  try {
    const { groupId, subjectId, teacherId } = req.body;

    if (!groupId || !subjectId || !teacherId) {
      return res.status(400).json({ 
        message: "Group ID, Subject ID, and Teacher ID are required" 
      });
    }

    const group = await Group.findById(groupId);
    if (!group) return res.status(404).json({ message: "Group not found" });

    const teacher = await Teacher.findById(teacherId);
    if (!teacher) return res.status(404).json({ message: "Teacher not found" });

    const subject = await Subject.findById(subjectId);
    if (!subject) return res.status(404).json({ message: "Subject not found" });

    // Verify subject semester matches group semester
    if (subject.semester !== group.semester) {
      return res.status(400).json({ 
        message: `Subject is for semester ${subject.semester}, but group is for semester ${group.semester}` 
      });
    }

    // Check if subject-teacher combination already exists in group
    const existingSubjectTeacher = group.subjectTeachers.find(
      (st: any) => st.subjectId.toString() === subjectId && st.teacherId.toString() === teacherId
    );

    if (existingSubjectTeacher) {
      return res.status(400).json({ 
        message: "This teacher is already assigned to teach this subject in this group" 
      });
    }

    // Add to group's subjectTeachers
    group.subjectTeachers.push({
      subjectId: subject._id,
      teacherId: teacher._id,
      assignedAt: new Date(),
    } as any);
    await group.save();

    // Update teacher's assignedSubjects
    const subjectAssignment = teacher.assignedSubjects.find(
      (as: any) => as.subjectId.toString() === subjectId
    );

    if (subjectAssignment) {
      // Subject already assigned to teacher, just add the group
      if (!subjectAssignment.groups.some((g: any) => g.toString() === groupId)) {
        subjectAssignment.groups.push(groupId);
      }
    } else {
      // New subject assignment for teacher
      teacher.assignedSubjects.push({
        subjectId: subject._id,
        semester: subject.semester,
        groups: [groupId],
      } as any);
    }
    await teacher.save();

    // Return populated group
    const populatedGroup = await Group.findById(groupId)
      .populate({
        path: "subjectTeachers.teacherId",
        select: "teacherId",
        populate: {
          path: "userId",
          select: "fullName email"
        }
      })
      .populate({
        path: "subjectTeachers.subjectId",
        select: "name code credits"
      });

    res.status(200).json({ 
      message: "Teacher assigned to group successfully", 
      group: populatedGroup 
    });
  } catch (error: any) {
    console.error("Error in assignTeacherToGroup:", error);
    res.status(500).json({ message: error.message });
  }
};
// 🟢 Assign single student to group
// 🟢 Assign single student to group - FIXED VERSION
export const assignStudentToGroup = async (req: Request, res: Response) => {
  try {
    const { studentId, groupId } = req.body;

    if (!studentId || !groupId) {
      return res.status(400).json({ message: "Student ID and Group ID are required" });
    }

    const group = await Group.findById(groupId);
    if (!group) return res.status(404).json({ message: "Group not found" });

    // Check capacity using studentCount (from pre-save hook)
    if (group.studentCount >= group.capacity) {
      return res.status(400).json({ message: "Group is full" });
    }

    const student = await Student.findById(studentId).populate("userId", "fullName email");
    if (!student) return res.status(404).json({ message: "Student not found" });

    // ✅ FIX 1: Remove student from any previous groups first
    await Group.updateMany(
      { students: studentId },
      { $pull: { students: studentId } }
    );

    // ✅ FIX 2: Add student to the new group's students array
    // This will trigger the pre-save hook to update studentCount
    await Group.findByIdAndUpdate(groupId, {
      $addToSet: { students: studentId }
    });

    // ✅ FIX 3: If Student model has groupId field, update it (optional)
    // If you don't have groupId field in Student model, remove this part
    try {
      await Student.findByIdAndUpdate(studentId, {
        groupId: groupId
      });
    } catch (error) {
      console.log("ℹ️ Student model doesn't have groupId field, skipping...");
    }

    // Return updated group with populated students
    const updatedGroup = await Group.findById(groupId)
      .populate({
        path: "students",
        select: "studentId currentSemester enrollmentYear status",
        populate: {
          path: "userId",
          select: "fullName email"
        }
      });

    res.status(200).json({ 
      message: "Student assigned to group successfully", 
      student: {
        _id: student._id,
        studentId: student.studentId,
        fullName: (student.userId as any).fullName,
        email: (student.userId as any).email,
        currentSemester: student.currentSemester
      },
      group: updatedGroup 
    });
  } catch (error: any) {
    console.error("Error in assignStudentToGroup:", error);
    res.status(500).json({ message: error.message });
  }
};


// 🟢 Auto-assign students (Round-Robin)
// 🟢 Auto-assign students (Round-Robin) - FIXED VERSION
export const autoAssignStudents = async (req: Request, res: Response) => {
  try {
    // ✅ FIX: Find students that are not in any group's students array
    const allGroups = await Group.find({ isActive: true });
    const allAssignedStudentIds = allGroups.flatMap(group => group.students.map(id => id.toString()));
    
    const unassignedStudents = await Student.find({
      _id: { $nin: allAssignedStudentIds },
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

      // Get available groups for this semester
      const availableGroups = await Group.find({
        semester: semesterNum,
        isActive: true,
      }).sort({ createdAt: 1 });

      // Filter groups that have space
      const groupsWithSpace = availableGroups.filter(g => g.studentCount < g.capacity);

      if (groupsWithSpace.length === 0) {
        totalSkipped += students.length;
        assignmentDetails.push({
          semester: semesterNum,
          assigned: 0,
          skipped: students.length,
          reason: "No available groups with space for this semester",
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

          // Check if group still has space
          if (currentGroup.studentCount < currentGroup.capacity) {
            // ✅ FIX: Use atomic update to add student to group
            const updateResult = await Group.findByIdAndUpdate(
              currentGroup._id,
              { $addToSet: { students: student._id } },
              { new: true }
            );

            if (updateResult) {
              // ✅ FIX: If Student model has groupId field, update it
              try {
                await Student.findByIdAndUpdate(student._id, {
                  groupId: currentGroup._id
                });
              } catch (error) {
                // Ignore if groupId field doesn't exist
              }

              assigned++;
              totalAssigned++;
              studentAssigned = true;
              
              // Update the group's studentCount in our local array
              currentGroup.studentCount = (currentGroup.studentCount || 0) + 1;
            }
          }

          groupIndex = (groupIndex + 1) % groupsWithSpace.length;
          attempts++;
        }

        if (!studentAssigned) {
          skipped++;
          totalSkipped++;
        }
      }

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
    console.error("Error in autoAssignStudents:", error);
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