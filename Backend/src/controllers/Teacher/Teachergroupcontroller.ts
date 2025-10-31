
import { Request, Response } from "express";
import Group from "../../models/Group";
import Student from "../../models/Student";
import Teacher from "../../models/Teacher";

// 🟢 Get teacher's assigned groups with basic info
export const getMyGroups = async (req: Request, res: Response) => {
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
    .select("name semester academicYear capacity studentCount subjectTeachers")
    .populate({
      path: "subjectTeachers",
      match: { teacherId: teacher._id },
      populate: {
        path: "subjectId",
        select: "code name credits"
      }
    })
    .lean();

    // Transform the data for frontend
    const myGroups = groups.map(group => ({
      groupId: group._id,
      groupName: group.name,
      semester: group.semester,
      academicYear: group.academicYear,
      capacity: group.capacity,
      studentCount: group.studentCount,
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
      message: "Teacher groups fetched successfully",
      groups: myGroups
    });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

// 🟢 Get students from a specific group (only if teacher is assigned to that group)
export const getGroupStudents = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    const teacher = await Teacher.findOne({ userId: req.user._id });
    if (!teacher) {
      return res.status(404).json({ message: "Teacher not found" });
    }

    const { groupId } = req.params;

    // Verify that teacher is assigned to this group
    const group = await Group.findOne({
      _id: groupId,
      "subjectTeachers.teacherId": teacher._id,
      isActive: true
    });

    if (!group) {
      return res.status(403).json({ 
        message: "You are not assigned to teach any subject in this group" 
      });
    }

    // Get students with their basic info
    const students = await Student.find({ groupId })
      .populate("userId", "fullName email")
      .select("studentId currentSemester enrollmentYear status phoneNumber dateOfBirth")
      .sort({ "userId.fullName": 1 });

    // Get group details
    const groupDetails = await Group.findById(groupId)
      .select("name semester academicYear capacity studentCount")
      .populate({
        path: "subjectTeachers",
        match: { teacherId: teacher._id },
        populate: {
          path: "subjectId",
          select: "code name"
        }
      });

    res.json({
      message: "Group students fetched successfully",
      group: {
        groupId: groupDetails?._id,
        groupName: groupDetails?.name,
        semester: groupDetails?.semester,
        academicYear: groupDetails?.academicYear,
        capacity: groupDetails?.capacity,
        studentCount: groupDetails?.studentCount,
        subjects: groupDetails?.subjectTeachers.map((st: any) => ({
          subjectId: st.subjectId._id,
          subjectCode: st.subjectId.code,
          subjectName: st.subjectId.name
        }))
      },
      students: students.map(student => ({
        _id: student._id,
        studentId: student.studentId,
        fullName: (student.userId as any).fullName,
        email: (student.userId as any).email,
        currentSemester: student.currentSemester,
        enrollmentYear: student.enrollmentYear,
        status: student.status,
        phoneNumber: student.phoneNumber,
        dateOfBirth: student.dateOfBirth
      }))
    });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

// 🟢 Get teacher's groups with student count and subject details
export const getMyGroupsWithDetails = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    const teacher = await Teacher.findOne({ userId: req.user._id });
    if (!teacher) {
      return res.status(404).json({ message: "Teacher not found" });
    }

    // Get groups with populated student count and subject details
    const groups = await Group.find({
      "subjectTeachers.teacherId": teacher._id,
      isActive: true
    })
    .select("name semester academicYear capacity studentCount subjectTeachers")
    .populate({
      path: "subjectTeachers",
      match: { teacherId: teacher._id },
      populate: {
        path: "subjectId",
        select: "code name credits"
      }
    })
    .populate({
      path: "students",
      select: "studentId status",
      populate: {
        path: "userId",
        select: "fullName"
      }
    });

    const detailedGroups = groups.map(group => ({
      groupId: group._id,
      groupName: group.name,
      semester: group.semester,
      academicYear: group.academicYear,
      capacity: group.capacity,
      studentCount: group.studentCount,
      activeStudents: group.students.filter((student: any) => student.status === 'active').length,
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
      message: "Teacher groups with details fetched successfully",
      groups: detailedGroups
    });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

// 🟢 Get student details from teacher's group
export const getStudentDetails = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    const teacher = await Teacher.findOne({ userId: req.user._id });
    if (!teacher) {
      return res.status(404).json({ message: "Teacher not found" });
    }

    const { studentId } = req.params;

    // Find student and verify they are in a group assigned to this teacher
    const student = await Student.findOne({ 
      _id: studentId,
      groupId: { 
        $in: teacher.assignedSubjects.flatMap(subject => subject.groups) 
      }
    })
    .populate("userId", "fullName email")
    .populate("groupId", "name semester");

    if (!student) {
      return res.status(404).json({ 
        message: "Student not found or you are not assigned to teach this student" 
      });
    }

    res.json({
      message: "Student details fetched successfully",
      student: {
        _id: student._id,
        studentId: student.studentId,
        fullName: (student.userId as any).fullName,
        email: (student.userId as any).email,
        currentSemester: student.currentSemester,
        enrollmentYear: student.enrollmentYear,
        status: student.status,
        phoneNumber: student.phoneNumber,
        dateOfBirth: student.dateOfBirth,
        bio: student.bio,
        profilePhoto: student.profilePhoto,
        address: student.address,
        guardian: student.guardian,
        group: student.groupId ? {
          groupId: (student.groupId as any)._id,
          groupName: (student.groupId as any).name,
          semester: (student.groupId as any).semester
        } : null
      }
    });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};