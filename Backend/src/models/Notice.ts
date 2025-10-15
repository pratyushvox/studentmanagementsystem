import mongoose, { Document, Schema } from 'mongoose';

export interface IView {
  userId: mongoose.Types.ObjectId;
  viewedAt: Date;
}

export interface IAttachment {
  fileName: string;
  fileUrl: string;
  fileType: string;
}

export interface INotice extends Document {
  title: string;
  content: string;
  targetAudience: ('student' | 'teacher' | 'all')[];
  priority: 'low' | 'medium' | 'high' | 'urgent';
  postedBy: mongoose.Types.ObjectId;
  attachments: IAttachment[];
  isActive: boolean;
  expiryDate?: Date;
  views: IView[];
  createdAt: Date;
  updatedAt: Date;
  isExpired: boolean;
  hasUserViewed(userId: string): boolean;
}

const noticeSchema = new Schema<INotice>({
  title: {
    type: String,
    required: true,
    trim: true
  },
  content: {
    type: String,
    required: true
  },
  targetAudience: {
    type: [String],
    enum: ['student', 'teacher', 'all'],
    default: ['all'],
    required: true
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  postedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  attachments: [{
    fileName: String,
    fileUrl: String,
    fileType: String
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  expiryDate: {
    type: Date,
    default: null
  },
  views: [{
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    },
    viewedAt: {
      type: Date,
      default: Date.now
    }
  }]
}, {
  timestamps: true
});

// Index for faster queries
noticeSchema.index({ targetAudience: 1, isActive: 1, createdAt: -1 });

// Virtual for checking if notice is expired
noticeSchema.virtual('isExpired').get(function(this: INotice) {
  if (!this.expiryDate) return false;
  return new Date() > this.expiryDate;
});

// Method to check if user has viewed the notice
noticeSchema.methods.hasUserViewed = function(userId: string): boolean {
  return this.views.some(view => view.userId.toString() === userId.toString());
};

export default mongoose.model<INotice>('Notice', noticeSchema);