import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import connectDB from "./config/db";
import authRoutes from "./routes/authRoutes";
import adminRoutes from "./routes/adminRoutes";
import teacherRoutes from "./routes/teacherRoutes";
import studentRoutes from "./routes/studentRoutes";

dotenv.config();

const app = express();

// CORS Configuration - Must be BEFORE routes
app.use(cors({
  origin: "http://localhost:5173", // Your frontend URL (change if different)
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));

// Body parser middleware
app.use(express.json());

// Connect to MongoDB
connectDB();

// Routes
app.use("/api/auth", authRoutes); 
app.use("/api/admin", adminRoutes);
app.use("/api/teacher", teacherRoutes);
app.use("/api/student", studentRoutes);

// Test route
app.get("/", (req, res) => {
  res.send("API is running...");
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));