import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  fullName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ["admin", "student", "teacher"], required: true },
  isApproved: { type: Boolean, default: false } 
});

export default mongoose.model("User", userSchema);






