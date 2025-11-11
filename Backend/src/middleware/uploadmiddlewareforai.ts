import multer from "multer";
import path from "path";

// Keep your existing disk storage for general use
const diskStorage = multer.diskStorage({
  filename: (_, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

// Create separate memory storage for AI analysis
const memoryStorage = multer.memoryStorage();

const fileFilter = (_: any, file: any, cb: any) => {
  const allowedTypes = [
    // Your existing allowed types...
    "image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp",
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-powerpoint",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "text/plain",
    "application/zip", "application/x-zip-compressed", "application/x-rar-compressed",
    "video/mp4", "video/mkv", "video/avi", "video/mov"
  ];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`Unsupported file type: ${file.mimetype}`), false);
  }
};

// Export both configurations
export const upload = multer({ 
  storage: diskStorage, 
  fileFilter,
  limits: { fileSize: 50 * 1024 * 1024 }
});

export const uploadMemory = multer({ 
  storage: memoryStorage, 
  fileFilter,
  limits: { fileSize: 50 * 1024 * 1024 }
});