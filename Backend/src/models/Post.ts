import mongoose, { Schema, Document } from "mongoose";

export interface IPost extends Document {
  teacherId: mongoose.Types.ObjectId;
  subjectId: mongoose.Types.ObjectId;
  title: string;
  contentType: "video" | "pdf" | "document" | "link" | "image";
  fileUrl: string;
  semester: number;
  groups: mongoose.Types.ObjectId[];
  description?: string;
  tags: string[];
  fileSize?: number;
  originalFileName?: string;
  downloadCount: number;
  viewCount: number;
  isActive: boolean;
}

const postSchema = new Schema<IPost>(
  {
    teacherId: { 
      type: Schema.Types.ObjectId, 
      ref: "Teacher", 
      required: true 
    },
    subjectId: { 
      type: Schema.Types.ObjectId, 
      ref: "Subject", 
      required: true 
    },
    title: { 
      type: String, 
      required: true,
      trim: true,
      maxlength: 200
    },
    contentType: { 
      type: String, 
      enum: ["video", "pdf", "document", "link", "image"], 
      required: true 
    },
    fileUrl: { 
      type: String, 
      required: true 
    },
    semester: { 
      type: Number, 
      required: true,
      min: 1,
      max: 8
    },
    groups: [{ 
      type: Schema.Types.ObjectId, 
      ref: "Group",
      required: true
    }],
    description: {
      type: String,
      maxlength: 1000
    },
    tags: [{
      type: String,
      trim: true
    }],
    fileSize: {
      type: Number, // in bytes
      default: 0
    },
    originalFileName: String,
    downloadCount: {
      type: Number,
      default: 0
    },
    viewCount: {
      type: Number,
      default: 0
    },
    isActive: {
      type: Boolean,
      default: true
    }
  },
  { 
    timestamps: true 
  }
);

// Index for better query performance
postSchema.index({ teacherId: 1, createdAt: -1 });
postSchema.index({ subjectId: 1, semester: 1 });
postSchema.index({ groups: 1 });
postSchema.index({ contentType: 1 });
postSchema.index({ tags: 1 });

// Virtual for formatted file size
postSchema.virtual('formattedFileSize').get(function() {
  if (!this.fileSize) return '0 B';
  
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(this.fileSize) / Math.log(1024));
  return Math.round(this.fileSize / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
});

// Method to increment view count
postSchema.methods.incrementViewCount = function() {
  this.viewCount += 1;
  return this.save();
};

// Method to increment download count
postSchema.methods.incrementDownloadCount = function() {
  this.downloadCount += 1;
  return this.save();
};

export default mongoose.model<IPost>("Post", postSchema);