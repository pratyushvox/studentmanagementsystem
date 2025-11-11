import cloudinary from "../config/cloudinary";
import fs from "fs";
import path from "path";

export const uploadFileToCloudinary = async (filePath: string, folder: string) => {
  // Get file extension to determine resource type
  const fileExtension = path.extname(filePath).toLowerCase();
  
  // Determine the correct resource type
  let resourceType: "image" | "video" | "raw" | "auto" = "auto";
  
  // For PDFs and other document types, use "raw"
  if (['.pdf', '.doc', '.docx', '.txt', '.zip', '.rar'].includes(fileExtension)) {
    resourceType = "raw";
  } else if (['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'].includes(fileExtension)) {
    resourceType = "image";
  } else if (['.mp4', '.avi', '.mov', '.wmv'].includes(fileExtension)) {
    resourceType = "video";
  }
  
  console.log(`📤 Uploading ${fileExtension} file as resource_type: ${resourceType}`);
  
  const result = await cloudinary.uploader.upload(filePath, {
    folder,
    resource_type: resourceType,
    // Optional: Add format preservation for PDFs
    ...(fileExtension === '.pdf' && { format: 'pdf' })
  });
  
  // Clean up local file
  fs.unlinkSync(filePath);
  
  console.log(`✅ File uploaded successfully: ${result.secure_url}`);
  
  return result.secure_url;
};