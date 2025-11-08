import mongoose, { Schema, Document } from "mongoose";

export interface ITeacher extends Document {
  userId: mongoose.Types.ObjectId;
  teacherId: string; 
  fullName: string;
  email: string;
  department?: string;
  specialization?: string;
  isModuleLeader: boolean;
  moduleLeaderSubjects: mongoose.Types.ObjectId[];
  assignedSubjects: {
    subjectId: mongoose.Types.ObjectId;
    semester: number;
    groups: mongoose.Types.ObjectId[];
  }[];
  profilePhoto?: string; 
}

const teacherSchema = new Schema<ITeacher>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    teacherId: { type: String, required: true, unique: true },
    fullName: { type: String, required: true },
    email: { type: String, required: true },
    department: String,
    specialization: String,
    isModuleLeader: { type: Boolean, default: false },
    moduleLeaderSubjects: [{ 
      type: Schema.Types.ObjectId, 
      ref: "Subject" 
    }],
    assignedSubjects: [{
      subjectId: { type: Schema.Types.ObjectId, ref: "Subject", required: true },
      semester: { type: Number, required: true },
      groups: [{ type: Schema.Types.ObjectId, ref: "Group" }]
    }],
    profilePhoto: { type: String }, 
  },
  { timestamps: true }
);

// Indexes for faster queries
teacherSchema.index({ teacherId: 1 });
teacherSchema.index({ email: 1 });
teacherSchema.index({ department: 1 });
teacherSchema.index({ isModuleLeader: 1 });
teacherSchema.index({ userId: 1 });

export default mongoose.model<ITeacher>("Teacher", teacherSchema);
