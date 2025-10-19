import mongoose, { Schema, Document } from "mongoose";

export interface IAssignment extends Document {
  teacherId: mongoose.Types.ObjectId; // Teacher who created the assignment
  subjectId: mongoose.Types.ObjectId;
  title: string;
  description?: string;
  type: "weekly" | "main"; // main = by module leader, weekly = by regular teachers
  semester: number;
  groups: mongoose.Types.ObjectId[]; // Groups this assignment is for
  maxMarks: number;
  deadline: Date;
  fileUrl?: string;
  isModuleLeaderAssignment: boolean; // True if posted by module leader
  postedToAllStudents: boolean; // True for main assignments (all students in subject)
  createdAt: Date;
  updatedAt: Date;
}

const assignmentSchema = new Schema<IAssignment>(
  {
    teacherId: { 
      type: Schema.Types.ObjectId, 
      ref: "Teacher", 
      required: true 
    },
    subjectId: { 
      type: Schema.Types.ObjectId, 
      ref: "Subject", 
      required: true 
    },
    title: { 
      type: String, 
      required: true 
    },
    description: { 
      type: String 
    },
    type: { 
      type: String, 
      enum: ["weekly", "main"], 
      required: true 
    },
    semester: { 
      type: Number, 
      required: true, 
      min: 1, 
      max: 8 
    },
    groups: [{ 
      type: Schema.Types.ObjectId, 
      ref: "Group" 
    }],
    maxMarks: { 
      type: Number, 
      required: true,
      min: 0 
    },
    deadline: { 
      type: Date, 
      required: true 
    },
    fileUrl: { 
      type: String 
    },
    isModuleLeaderAssignment: { 
      type: Boolean, 
      default: false 
    },
    postedToAllStudents: { 
      type: Boolean, 
      default: false 
    }
  },
  { 
    timestamps: true 
  }
);

// Indexes for faster queries
assignmentSchema.index({ subjectId: 1, type: 1 });
assignmentSchema.index({ teacherId: 1 });
assignmentSchema.index({ isModuleLeaderAssignment: 1 });
assignmentSchema.index({ deadline: 1 });
assignmentSchema.index({ semester: 1 });
assignmentSchema.index({ groups: 1 });
assignmentSchema.index({ createdAt: -1 });

// Compound index for common queries
assignmentSchema.index({ teacherId: 1, subjectId: 1 });
assignmentSchema.index({ subjectId: 1, semester: 1 });

export default mongoose.model<IAssignment>("Assignment", assignmentSchema);