import mongoose, { Schema, Document } from "mongoose";

export interface ITeacher extends Document {
  userId: mongoose.Types.ObjectId;
  teacherId: string; 
  department?: string;
  specialization?: string;
  assignedSubjects: {
    subjectId: mongoose.Types.ObjectId;
    semester: number;
    groups: mongoose.Types.ObjectId[];
  }[];
}

const teacherSchema = new Schema<ITeacher>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    teacherId: { type: String, required: true, unique: true },
    department: String,
    specialization: String,
    assignedSubjects: [{
      subjectId: { type: Schema.Types.ObjectId, ref: "Subject", required: true },
      semester: { type: Number, required: true },
      groups: [{ type: Schema.Types.ObjectId, ref: "Group" }]
    }]
  },
  { timestamps: true }
);

export default mongoose.model<ITeacher>("Teacher", teacherSchema);