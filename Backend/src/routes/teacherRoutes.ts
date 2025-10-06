import express from "express";
import { protect } from "../middleware/authMiddleware";
import { upload } from "../middleware/uploadMiddleware";
import { createPost, createAssignment, requestGradeOrSubjectChange } from "../controllers/teacherController";

const router = express.Router();
router.post("/post", protect, upload.single("file"), createPost);
router.post("/assignment", protect, upload.single("file"), createAssignment);
router.post("/request-change", protect, requestGradeOrSubjectChange);
export default router;
