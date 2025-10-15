import mongoose, { Schema, Document } from "mongoose";

export interface ITeacher extends Document {
  userId: mongoose.Types.ObjectId;
  teacherId: string; 
  fullName: string;
  email: string;
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
    fullName: { type: String, required: true },
    email: { type: String, required: true },
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

// Index for faster queries
teacherSchema.index({ teacherId: 1 });
teacherSchema.index({ email: 1 });
teacherSchema.index({ department: 1 });

export default mongoose.model<ITeacher>("Teacher", teacherSchema);