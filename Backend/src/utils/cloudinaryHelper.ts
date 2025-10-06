import cloudinary from "../config/cloudinary";
import fs from "fs";

export const uploadFileToCloudinary = async (filePath: string, folder: string) => {
  const result = await cloudinary.uploader.upload(filePath, {
    folder,
    resource_type: "auto"
  });
  fs.unlinkSync(filePath);
  return result.secure_url;
};
