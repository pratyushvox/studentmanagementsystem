import mongoose, { Schema, Document } from "mongoose";

export interface IGroup extends Document {
  name: string;
  semester: number;
  academicYear: number;
  capacity: number;
  studentCount: number;
  students: [
  {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Student", 
  },
], 
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
    students: [
      {
        type: Schema.Types.ObjectId,
        ref: "Student",
      },
    ],
    subjectTeachers: [
      {
        subjectId: { type: Schema.Types.ObjectId, ref: "Subject", required: true },
        teacherId: { type: Schema.Types.ObjectId, ref: "Teacher", required: true },
        assignedAt: { type: Date, default: Date.now },
      },
    ],
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// Update studentCount automatically before saving
groupSchema.pre("save", function (next) {
  this.studentCount = this.students?.length || 0;
  next();
});

// Compound unique index: one group per semester per year
groupSchema.index({ name: 1, semester: 1, academicYear: 1 }, { unique: true });

export default mongoose.model<IGroup>("Group", groupSchema);
