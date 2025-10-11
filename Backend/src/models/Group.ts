import mongoose, { Schema, Document } from "mongoose";

export interface IGroup extends Document {
  name: string; // e.g., "Group 4", "Section A"
  semester: number;
  academicYear: number;
  capacity: number;
  studentCount: number;
  subjectTeachers: {
    subjectId: mongoose.Types.ObjectId;
    teacherId: mongoose.Types.ObjectId;
    assignedAt: Date;
  }[];
  isActive: boolean;
}

const groupSchema = new Schema<IGroup>(
  {
    name: { type: String, required: true },
    semester: { type: Number, required: true, min: 1, max: 8 },
    academicYear: { type: Number, required: true },
    capacity: { type: Number, default: 50 },
    studentCount: { type: Number, default: 0 },
    subjectTeachers: [{
      subjectId: { type: Schema.Types.ObjectId, ref: "Subject", required: true },
      teacherId: { type: Schema.Types.ObjectId, ref: "Teacher", required: true },
      assignedAt: { type: Date, default: Date.now }
    }],
    isActive: { type: Boolean, default: true }
  },
  { timestamps: true }
);

// Compound unique index: one group per semester per year
groupSchema.index({ name: 1, semester: 1, academicYear: 1 }, { unique: true });

export default mongoose.model<IGroup>("Group", groupSchema);