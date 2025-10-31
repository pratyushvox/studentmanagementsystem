
import mongoose, { Schema, Document } from "mongoose";

export interface IAttendance extends Document {
  date: Date;
  semester: number;
  subjectId: mongoose.Types.ObjectId;
  teacherId: mongoose.Types.ObjectId;
  groupId: mongoose.Types.ObjectId;
  attendanceRecords: {
    studentId: mongoose.Types.ObjectId;
    status: "present" | "absent" | "late" | "excused";
    remarks?: string;
  }[];
  totalPresent: number;
  totalAbsent: number;
  totalLate: number;
  totalStudents: number;
  isSubmitted: boolean;
  submittedAt?: Date;
}

const attendanceSchema = new Schema<IAttendance>(
  {
    date: { type: Date, required: true },
    semester: { type: Number, required: true, min: 1, max: 8 },
    subjectId: { type: Schema.Types.ObjectId, ref: "Subject", required: true },
    teacherId: { type: Schema.Types.ObjectId, ref: "Teacher", required: true },
    groupId: { type: Schema.Types.ObjectId, ref: "Group", required: true },
    attendanceRecords: [{
      studentId: { type: Schema.Types.ObjectId, ref: "Student", required: true },
      status: { 
        type: String, 
        enum: ["present", "absent", "late", "excused"], 
        required: true 
      },
      remarks: { type: String, maxlength: 200 }
    }],
    totalPresent: { type: Number, default: 0 },
    totalAbsent: { type: Number, default: 0 },
    totalLate: { type: Number, default: 0 },
    totalStudents: { type: Number, required: true },
    isSubmitted: { type: Boolean, default: false },
    submittedAt: { type: Date }
  },
  { timestamps: true }
);

// Compound unique index: one attendance per subject-group-date combination
attendanceSchema.index(
  { date: 1, subjectId: 1, groupId: 1 }, 
  { unique: true, name: "unique_attendance_entry" }
);

// Indexes for better query performance
attendanceSchema.index({ teacherId: 1, date: 1 });
attendanceSchema.index({ groupId: 1, semester: 1 });
attendanceSchema.index({ subjectId: 1 });
attendanceSchema.index({ "attendanceRecords.studentId": 1 });

// Pre-save middleware to calculate totals
attendanceSchema.pre("save", function(next) {
  if (this.attendanceRecords && this.attendanceRecords.length > 0) {
    this.totalPresent = this.attendanceRecords.filter(record => 
      record.status === "present"
    ).length;
    this.totalAbsent = this.attendanceRecords.filter(record => 
      record.status === "absent"
    ).length;
    this.totalLate = this.attendanceRecords.filter(record => 
      record.status === "late"
    ).length;
    this.totalStudents = this.attendanceRecords.length;
  }
  
  if (this.isSubmitted && !this.submittedAt) {
    this.submittedAt = new Date();
  }
  
  next();
});

export default mongoose.model<IAttendance>("Attendance", attendanceSchema);