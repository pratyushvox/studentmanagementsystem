import mongoose, { Schema, Document } from "mongoose";

export interface ISubmission extends Document {
  assignmentId: mongoose.Types.ObjectId;
  studentId: mongoose.Types.ObjectId;
  groupId: mongoose.Types.ObjectId;
  subjectId: mongoose.Types.ObjectId;
  assignedTeacherId: mongoose.Types.ObjectId; // CRITICAL: Teacher who will grade this
  fileUrl: string;
  submittedAt?: Date;
  marks?: number;
  feedback?: string;
  gradedBy?: mongoose.Types.ObjectId;
  gradedAt?: Date;
  status: "pending" | "graded" | "late";
}

const submissionSchema = new Schema<ISubmission>(
  {
    assignmentId: { 
      type: Schema.Types.ObjectId, 
      ref: "Assignment", 
      required: true 
    },
    studentId: { 
      type: Schema.Types.ObjectId, 
      ref: "Student", 
      required: true 
    },
    groupId: { 
      type: Schema.Types.ObjectId, 
      ref: "Group", 
      required: true 
    },
    subjectId: { 
      type: Schema.Types.ObjectId, 
      ref: "Subject", 
      required: true 
    },
    assignedTeacherId: { 
      type: Schema.Types.ObjectId, 
      ref: "Teacher", 
      required: true 
    }, // Teacher responsible for grading this submission
    fileUrl: { 
      type: String, 
      default: "" 
    }, // Empty until student submits
    submittedAt: { 
      type: Date 
    },
    marks: { 
      type: Number,
      min: 0
    },
    feedback: { 
      type: String 
    },
    gradedBy: { 
      type: Schema.Types.ObjectId, 
      ref: "Teacher" 
    },
    gradedAt: { 
      type: Date 
    },
    status: { 
      type: String, 
      enum: ["pending", "graded", "late"], 
      default: "pending" 
    }
  },
  { timestamps: true }
);

// Indexes for faster queries
submissionSchema.index({ assignmentId: 1, studentId: 1 }, { unique: true });
submissionSchema.index({ assignedTeacherId: 1 }); // For teacher grading queries
submissionSchema.index({ status: 1 });
submissionSchema.index({ studentId: 1 });
submissionSchema.index({ subjectId: 1 });
submissionSchema.index({ groupId: 1 });

// Compound indexes for common queries
submissionSchema.index({ assignedTeacherId: 1, status: 1 });
submissionSchema.index({ assignmentId: 1, status: 1 });

export default mongoose.model<ISubmission>("Submission", submissionSchema);