import mongoose, { Document, Schema } from "mongoose";

export interface IPost extends Document {
  teacherId: mongoose.Types.ObjectId;
  title: string;
  contentType: "video" | "pdf";
  fileUrl: string;
  grade: string;
  subject: string;
}

const postSchema = new Schema<IPost>(
  {
    teacherId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    title: { type: String, required: true },
    contentType: { type: String, enum: ["video", "pdf"], required: true },
    fileUrl: { type: String, required: true },
    grade: { type: String, required: true },
    subject: { type: String, required: true }
  },
  { timestamps: true }
);

export default mongoose.model<IPost>("Post", postSchema);
