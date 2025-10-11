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