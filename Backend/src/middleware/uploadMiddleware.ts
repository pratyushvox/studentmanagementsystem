import multer from "multer";
import path from "path";

const storage = multer.diskStorage({
  filename: (_, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const fileFilter = (_: any, file: any, cb: any) => {
  const allowedTypes = [
    // Images
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/gif",
    "image/webp",
    
    // Documents
    "application/pdf",
    
    // Microsoft Word
    "application/msword", // .doc
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document", // .docx
    
    // Microsoft PowerPoint
    "application/vnd.ms-powerpoint", // .ppt
    "application/vnd.openxmlformats-officedocument.presentationml.presentation", // .pptx
    
    // Microsoft Excel
    "application/vnd.ms-excel", // .xls
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", // .xlsx
    
    // Text files
    "text/plain", // .txt
    
    // Compressed files
    "application/zip",
    "application/x-zip-compressed",
    "application/x-rar-compressed",
    
    // Videos
    "video/mp4",
    "video/mkv",
    "video/avi",
    "video/mov"
  ];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new Error(
        `Unsupported file type: ${file.mimetype}. Allowed types: PDF, DOC, DOCX, PPT, PPTX, XLS, XLSX, TXT, ZIP, RAR, Images, Videos`
      ),
      false
    );
  }
};

export const upload = multer({ 
  storage, 
  fileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB
  }
});