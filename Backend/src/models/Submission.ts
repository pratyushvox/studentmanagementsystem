
import mongoose, { Document, Schema } from "mongoose";

export interface ISubmission extends Document {
  assignmentId: mongoose.Types.ObjectId;
  studentId: mongoose.Types.ObjectId;
  fileUrl: string;
  grade?: number;
}

const submissionSchema = new Schema<ISubmission>(
  {
    assignmentId: { type: Schema.Types.ObjectId, ref: "Assignment", required: true },
    studentId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    fileUrl: { type: String, required: true },
    grade: Number
  },
  { timestamps: true }
);

export default mongoose.model<ISubmission>("Submission", submissionSchema);
