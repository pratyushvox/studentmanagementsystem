import mongoose, { Schema, Document } from "mongoose";

export interface ISubject extends Document {
  code: string; 
  name: string;
  semester: number; 
  credits: number;
  description?: string;
  isActive: boolean;
  createdBy: mongoose.Types.ObjectId;
}

const subjectSchema = new Schema<ISubject>(
  {
    code: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    semester: { type: Number, required: true, min: 1, max: 8 },
    credits: { type: Number, required: true },
    description: String,
    isActive: { type: Boolean, default: true },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true }
  },
  { timestamps: true }
);

export default mongoose.model<ISubject>("Subject", subjectSchema);