import mongoose, { Document, Schema } from "mongoose";

export interface ITeacherEditRequest extends Document {
  teacherId: mongoose.Types.ObjectId;
  requestedChanges: { grade?: string; subject?: string };
  status: "pending" | "approved" | "rejected";
}

const teacherEditRequestSchema = new Schema<ITeacherEditRequest>(
  {
    teacherId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    requestedChanges: {
      grade: String,
      subject: String
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending"
    }
  },
  { timestamps: true }
);

export default mongoose.model<ITeacherEditRequest>(
  "TeacherEditRequest",
  teacherEditRequestSchema
);
