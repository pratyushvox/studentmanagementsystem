import express from "express";
import { protect } from "../middleware/authMiddleware";
import { upload } from "../middleware/uploadMiddleware";
import { submitAssignment } from "../controllers/studentController";

const router = express.Router();
router.post("/submit", protect, upload.single("file"), submitAssignment);
export default router;
