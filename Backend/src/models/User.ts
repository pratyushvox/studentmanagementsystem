import mongoose, { Schema, Document } from "mongoose";

export interface IUser extends Document {
  fullName: string;
  email: string;
  password: string;
  role: "admin" | "student" | "teacher";
  isApproved: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    fullName: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { 
      type: String, 
      enum: ["admin", "student", "teacher"], 
      required: true 
    },
    isApproved: { type: Boolean, default: false }
  },
  { timestamps: true }
);

export default mongoose.model<IUser>("User", userSchema);