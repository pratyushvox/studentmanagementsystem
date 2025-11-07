import mongoose, { Schema, Document } from "mongoose";

export interface IAssignmentRecord {
  assignmentId: mongoose.Types.ObjectId;
  marks?: number;
  maxMarks: number;
  submittedAt?: Date;
  gradedAt?: Date;
}

export interface ISubjectRecord {
  subjectId: mongoose.Types.ObjectId;
  teacherId: mongoose.Types.ObjectId;
  weeklyAssignments: IAssignmentRecord[];
  mainAssignment?: IAssignmentRecord;
  totalMarks?: number;
  percentage?: number;
  grade?: string;
  passed: boolean;
}

export interface ISemesterRecord {
  semester: number;
  groupId: mongoose.Types.ObjectId;
  subjects: ISubjectRecord[];
  semesterPassed: boolean;
  promotedAt?: Date;
  promotedBy?: mongoose.Types.ObjectId;
}

export interface IStudent extends Document {
  userId: mongoose.Types.ObjectId;
  studentId: string;
  fullName:string;
  currentSemester: number;
  groupId?: mongoose.Types.ObjectId;
  enrollmentYear: number;
  status: "active" | "failed" | "promoted" | "graduated";

  phoneNumber?: string;
  dateOfBirth?: Date;
  bio?: string;
  profilePhoto?: string;

  address?: {
    city?: string;
    province?: string;
  };

  guardian?: {
    name: string;
    relationship: string;
    phoneNumber: string;
    email?: string;
  };

  academicHistory: ISemesterRecord[];
}

/* =======================
   SUB-SCHEMAS
======================= */

// Assignment Subdocument
const assignmentSchema = new Schema<IAssignmentRecord>(
  {
    assignmentId: { type: Schema.Types.ObjectId, ref: "Assignment", required: true },
    marks: { type: Number, default: 0 },
    maxMarks: { type: Number, required: true },
    submittedAt: Date,
    gradedAt: Date,
  },
  { _id: false }
);

// Subject Subdocument
const subjectSchema = new Schema<ISubjectRecord>(
  {
    subjectId: { type: Schema.Types.ObjectId, ref: "Subject", required: true },
    teacherId: { type: Schema.Types.ObjectId, ref: "Teacher", required: true },
    weeklyAssignments: { type: [assignmentSchema], default: [] },
    mainAssignment: { type: assignmentSchema, default: null },
    totalMarks: { type: Number, default: 0 },
    percentage: { type: Number, default: 0 },
    grade: { type: String, default: "" },
    passed: { type: Boolean, default: false },
  },
  { _id: false }
);

// Semester Subdocument
const semesterSchema = new Schema<ISemesterRecord>(
  {
    semester: { type: Number, required: true },
    groupId: { type: Schema.Types.ObjectId, ref: "Group", required: true },
    subjects: { type: [subjectSchema], default: [] },
    semesterPassed: { type: Boolean, default: false },
    promotedAt: Date,
    promotedBy: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { _id: false }
);

/* =======================
   MAIN STUDENT SCHEMA
======================= */

const studentSchema = new Schema<IStudent>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    studentId: { type: String, required: true, unique: true },
    fullName: { type: String, required: true },
    
    currentSemester: { type: Number, min: 1, max: 8, default: 1 },
    groupId: { type: Schema.Types.ObjectId, ref: "Group" },
    enrollmentYear: { type: Number, required: true },
    status: {
      type: String,
      enum: ["active", "failed", "promoted", "graduated"],
      default: "active",
    },

    phoneNumber: String,
    dateOfBirth: Date,
    bio: { type: String, maxlength: 500 },
    profilePhoto: String,

    address: {
      city: String,
      province: String,
    },

    guardian: {
      name: String,
      relationship: String,
      phoneNumber: String,
      email: String,
    },

    academicHistory: { type: [semesterSchema], default: [] },
  },
  { timestamps: true }
);

export default mongoose.model<IStudent>("Student", studentSchema);
