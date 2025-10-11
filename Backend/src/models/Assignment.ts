import mongoose, { Schema, Document } from "mongoose";

export interface IAssignment extends Document {
  teacherId: mongoose.Types.ObjectId;
  subjectId: mongoose.Types.ObjectId;
  title: string;
  description?: string;
  type: "weekly" | "main";
  semester: number;
  groups: mongoose.Types.ObjectId[];
  maxMarks: number;
  deadline: Date;
  fileUrl?: string;
}

const assignmentSchema = new Schema<IAssignment>(
  {
    teacherId: { type: Schema.Types.ObjectId, ref: "Teacher", required: true },
    subjectId: { type: Schema.Types.ObjectId, ref: "Subject", required: true },
    title: { type: String, required: true },
    description: String,
    type: { type: String, enum: ["weekly", "main"], required: true },
    semester: { type: Number, required: true, min: 1, max: 8 },
    groups: [{ type: Schema.Types.ObjectId, ref: "Group", required: true }],
    maxMarks: { type: Number, required: true },
    deadline: { type: Date, required: true },
    fileUrl: String
  },
  { timestamps: true }
);

export default mongoose.model<IAssignment>("Assignment", assignmentSchema);