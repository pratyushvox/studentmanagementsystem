import mongoose, { Schema, Document } from "mongoose";

export interface IStudent extends Document {
  userId: mongoose.Types.ObjectId;
  studentId: string; 
  currentSemester: number; 
  groupId?: mongoose.Types.ObjectId;
  enrollmentYear: number;
  status: "active" | "failed" | "promoted" | "graduated";
  academicHistory: {
    semester: number;
    groupId: mongoose.Types.ObjectId;
    subjects: {
      subjectId: mongoose.Types.ObjectId;
      teacherId: mongoose.Types.ObjectId;
      weeklyAssignments: {
        assignmentId: mongoose.Types.ObjectId;
        marks?: number;
        maxMarks: number;
        submittedAt?: Date;
        gradedAt?: Date;
      }[];
      mainAssignment?: {
        assignmentId: mongoose.Types.ObjectId;
        marks?: number;
        maxMarks: number;
        submittedAt?: Date;
        gradedAt?: Date;
      };
      totalMarks?: number;
      percentage?: number;
      grade?: string;
      passed: boolean;
    }[];
    semesterPassed: boolean;
    promotedAt?: Date;
    promotedBy?: mongoose.Types.ObjectId;
  }[];
}

const studentSchema = new Schema<IStudent>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    studentId: { type: String, required: true, unique: true },
    currentSemester: { type: Number, min: 1, max: 8, default: 1 },
    groupId: { type: Schema.Types.ObjectId, ref: "Group" },
    enrollmentYear: { type: Number, required: true },
    status: { 
      type: String, 
      enum: ["active", "failed", "promoted", "graduated"], 
      default: "active" 
    },
    academicHistory: [{
      semester: { type: Number, required: true },
      groupId: { type: Schema.Types.ObjectId, ref: "Group", required: true },
      subjects: [{
        subjectId: { type: Schema.Types.ObjectId, ref: "Subject", required: true },
        teacherId: { type: Schema.Types.ObjectId, ref: "Teacher", required: true },
        weeklyAssignments: [{
          assignmentId: { type: Schema.Types.ObjectId, ref: "Assignment" },
          marks: Number,
          maxMarks: { type: Number, required: true },
          submittedAt: Date,
          gradedAt: Date
        }],
        mainAssignment: {
          assignmentId: { type: Schema.Types.ObjectId, ref: "Assignment" },
          marks: Number,
          maxMarks: { type: Number, required: true },
          submittedAt: Date,
          gradedAt: Date
        },
        totalMarks: Number,
        percentage: Number,
        grade: String,
        passed: { type: Boolean, default: false }
      }],
      semesterPassed: { type: Boolean, default: false },
      promotedAt: Date,
      promotedBy: { type: Schema.Types.ObjectId, ref: "User" }
    }]
  },
  { timestamps: true }
);

export default mongoose.model<IStudent>("Student", studentSchema);