import multer from "multer";
import path from "path";

const storage = multer.diskStorage({
  filename: (_, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const fileFilter = (_: any, file: any, cb: any) => {
  const allowedTypes = [
    "image/jpeg",
    "image/png",
    "application/pdf",
    "video/mp4",
    "video/mkv"
  ];
  if (allowedTypes.includes(file.mimetype)) cb(null, true);
  else cb(new Error("Unsupported file type"), false);
};

export const upload = multer({ storage, fileFilter });
