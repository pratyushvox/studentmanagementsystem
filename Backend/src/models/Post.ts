import mongoose, { Schema, Document } from "mongoose";

export interface IPost extends Document {
  teacherId: mongoose.Types.ObjectId;
  subjectId: mongoose.Types.ObjectId;
  title: string;
  contentType: "video" | "pdf" | "document";
  fileUrl: string;
  semester: number;
  groups: mongoose.Types.ObjectId[];
  description?: string;
}

const postSchema = new Schema<IPost>(
  {
    teacherId: { type: Schema.Types.ObjectId, ref: "Teacher", required: true },
    subjectId: { type: Schema.Types.ObjectId, ref: "Subject", required: true },
    title: { type: String, required: true },
    contentType: { type: String, enum: ["video", "pdf", "document"], required: true },
    fileUrl: { type: String, required: true },
    semester: { type: Number, required: true },
    groups: [{ type: Schema.Types.ObjectId, ref: "Group" }],
    description: String
  },
  { timestamps: true }
);

export default mongoose.model<IPost>("Post", postSchema);