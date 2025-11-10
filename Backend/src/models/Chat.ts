// models/Chat.ts
import mongoose, { Schema, Document } from "mongoose";

export interface IMessage {
  _id: mongoose.Types.ObjectId;
  sender: mongoose.Types.ObjectId;
  senderModel: "Teacher" | "Student";
  content?: string;
  attachment?: string;
  status: "sent" | "read";
  createdAt: Date;
}

export interface IParticipant {
  item: mongoose.Types.ObjectId;
  model: "Teacher" | "Student";
}

export interface IChat extends Document {
  participants: IParticipant[];
  messages: IMessage[];
  createdAt: Date;
  updatedAt: Date;
}

// Message subdocument schema
const MessageSchema = new Schema<IMessage>(
  {
    sender: {
      type: Schema.Types.ObjectId,
      required: true,
      refPath: "messages.senderModel",
    },
    senderModel: {
      type: String,
      required: true,
      enum: ["Teacher", "Student"],
    },
    content: { type: String, trim: true },
    attachment: { type: String },
    status: { type: String, enum: ["sent", "read"], default: "sent" },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: true }
);

// Participant subdocument schema
const ParticipantSchema = new Schema<IParticipant>(
  {
    item: {
      type: Schema.Types.ObjectId,
      required: true,
      refPath: "participants.model",
    },
    model: { type: String, required: true, enum: ["Teacher", "Student"] },
  },
  { _id: false }
);

// Chat model schema
const ChatSchema = new Schema<IChat>({
  participants: {
    type: [ParticipantSchema],
    validate: (v: IParticipant[]) => v.length === 2,
  },
  messages: { type: [MessageSchema], default: [] },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

// Update updatedAt on save
ChatSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Index for better performance
ChatSchema.index({ "participants.item": 1 });
ChatSchema.index({ "messages.createdAt": -1 });
ChatSchema.index({ updatedAt: -1 });

export default mongoose.model<IChat>("Chat", ChatSchema);