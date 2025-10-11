import mongoose, { Schema, Document } from "mongoose";

export interface ISubmission extends Document {
  assignmentId: mongoose.Types.ObjectId;
  studentId: mongoose.Types.ObjectId;
  groupId: mongoose.Types.ObjectId;
  subjectId: mongoose.Types.ObjectId;
  fileUrl: string;
  submittedAt: Date;
  marks?: number;
  feedback?: string;
  gradedBy?: mongoose.Types.ObjectId;
  gradedAt?: Date;
  status: "pending" | "graded" | "late";
}

const submissionSchema = new Schema<ISubmission>(
  {
    assignmentId: { type: Schema.Types.ObjectId, ref: "Assignment", required: true },
    studentId: { type: Schema.Types.ObjectId, ref: "Student", required: true },
    groupId: { type: Schema.Types.ObjectId, ref: "Group", required: true },
    subjectId: { type: Schema.Types.ObjectId, ref: "Subject", required: true },
    fileUrl: { type: String, required: true },
    submittedAt: { type: Date, default: Date.now },
    marks: Number,
    feedback: String,
    gradedBy: { type: Schema.Types.ObjectId, ref: "Teacher" },
    gradedAt: Date,
    status: { type: String, enum: ["pending", "graded", "late"], default: "pending" }
  },
  { timestamps: true }
);

// Prevent duplicate submissions
submissionSchema.index({ assignmentId: 1, studentId: 1 }, { unique: true });

export default mongoose.model<ISubmission>("Submission", submissionSchema);