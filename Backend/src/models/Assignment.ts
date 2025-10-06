
import mongoose, { Document, Schema } from "mongoose";

export interface IAssignment extends Document {
  teacherId: mongoose.Types.ObjectId;
  title: string;
  description: string;
  fileUrl?: string;
  grade: string;
  subject: string;
  deadline: Date;
}

const assignmentSchema = new Schema<IAssignment>(
  {
    teacherId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    title: { type: String, required: true },
    description: String,
    fileUrl: String,
    grade: String,
    subject: String,
    deadline: Date
  },
  { timestamps: true }
);

export default mongoose.model<IAssignment>("Assignment", assignmentSchema);
