// controllers/Chat/studentChatController.ts
import { Request, Response } from "express";
import Chat from "../../models/Chat";
import Teacher from "../../models/Teacher";
import Student from "../../models/Student";
import { getIO } from "../../utils/io";

// Helper: Populate participant details
const populateParticipant = async (participant: any) => {
  if (!participant || !participant.model || !participant.item) return { details: null };

  const Model = participant.model === "Teacher" ? Teacher : Student;
  const doc = await Model.findById(participant.item)
    .select("fullName profilePhoto studentId teacherId")
    .lean();

  return { ...participant, details: doc || null };
};

// Helper for room names
const getRoleFromModel = (model: string) => (model === "Teacher" ? "teacher" : "student");

// =========================
// CREATE CHAT
// =========================
export const createChat = async (req: Request, res: Response) => {
  const { participants } = req.body;
  try {
    if (!participants || participants.length !== 2)
      return res.status(400).json({ error: "Chat requires exactly 2 participants" });

    for (const p of participants) {
      const Model = p.model === "Teacher" ? Teacher : Student;
      const exists = await Model.exists({ _id: p.item });
      if (!exists) return res.status(404).json({ error: `${p.model} not found` });
    }

    const ids = participants.map((p: any) => p.item);
    let chat = await Chat.findOne({ "participants.item": { $all: ids } });
    if (!chat) chat = await Chat.create({ participants });

    const populatedParticipants = await Promise.all(chat.participants.map(populateParticipant));
    res.status(200).json({ ...chat.toObject(), participants: populatedParticipants });
  } catch (err) {
    console.error("Student Chat creation error:", err);
    res.status(500).json({ error: "Unable to create/fetch chat" });
  }
};

// =========================
// GET CHATS - UPDATED
// =========================
export const getChats = async (req: Request, res: Response) => {
  const studentId = req.params.studentId;
  try {
    const chats = await Chat.find({ "participants.item": studentId }).sort({ updatedAt: -1 }).lean();

    const enhanced = await Promise.all(
      chats.map(async (chat) => {
        const other = chat.participants.find((p: any) => p.item.toString() !== studentId);
        if (!other) return { ...chat, otherParticipant: null, lastMessage: null, unreadCount: 0 };

        const populated = await populateParticipant(other);
        const lastMessage = chat.messages?.[chat.messages.length - 1] || null;
        
        // COUNT UNREAD MESSAGES: Only teacher messages with status 'sent'
        const unreadCount = chat.messages?.filter(
          (m: any) => 
            m.sender.toString() !== studentId && 
            m.senderModel === 'Teacher' && 
            m.status === 'sent'
        ).length || 0;

        return { ...chat, otherParticipant: populated.details, lastMessage, unreadCount };
      })
    );

    res.status(200).json(enhanced);
  } catch (err) {
    console.error("Student fetch chats error:", err);
    res.status(500).json({ error: "Unable to fetch chats" });
  }
};

// =========================
// GET MESSAGES - UPDATED
// =========================
export const getMessages = async (req: Request, res: Response) => {
  const { chatId } = req.params;
  const { studentId } = req.query;
  try {
    let chat = await Chat.findById(chatId);
    if (!chat) return res.status(404).json({ error: "Chat not found" });

    // MARK MESSAGES AS READ when student opens chat
    if (studentId) {
      let hasUnreadMessages = false;
      
      const updateResult = await Chat.updateOne(
        { _id: chatId },
        {
          $set: { "messages.$[elem].status": "read" }
        },
        {
          arrayFilters: [
            { 
              "elem.sender": { $ne: studentId }, 
              "elem.senderModel": "Teacher",
              "elem.status": "sent" 
            }
          ]
        }
      );

      // If messages were updated, emit socket event
      if (updateResult.modifiedCount > 0) {
        const io = getIO();
        // Notify teacher that their messages were read
        const teacherParticipant = chat.participants.find(
          (p: any) => p.model === 'Teacher'
        );
        if (teacherParticipant) {
          const teacherRoom = `teacher:${teacherParticipant.item}`;
          io?.to(teacherRoom).emit("messagesRead", { 
            chatId, 
            reader: studentId,
            timestamp: new Date()
          });
        }
        
        // Refresh the chat data after update
        chat = await Chat.findById(chatId);
      }
    }

    const participants = await Promise.all(chat.participants.map(populateParticipant));

    res.status(200).json({
      messages: chat.messages || [],
      participants
    });
  } catch (err) {
    console.error("Student getMessages error:", err);
    res.status(500).json({ error: "Unable to fetch messages" });
  }
};

// =========================
// SEND MESSAGE - UPDATED
// =========================
export const sendMessage = async (req: Request, res: Response) => {
  const { chatId, sender, content, attachment } = req.body;
  try {
    if (!chatId || !sender || !content?.trim()) 
      return res.status(400).json({ error: "Missing fields" });

    const chat = await Chat.findById(chatId);
    if (!chat) return res.status(404).json({ error: "Chat not found" });

    // Prevent duplicate messages (same content in last 5s)
    const now = new Date();
    const fiveSecondsAgo = new Date(now.getTime() - 5000);
    const duplicate = chat.messages.find(
      (m: any) => 
        m.sender.toString() === sender && 
        m.content === content.trim() && 
        new Date(m.createdAt) > fiveSecondsAgo
    );
    
    if (duplicate) return res.status(200).json(duplicate);

    const message = { 
      sender, 
      senderModel: "Student", 
      content: content.trim(), 
      attachment, 
      status: "sent", 
      createdAt: now 
    };
    
    chat.messages.push(message as any);
    await chat.save();

    const io = getIO();
    for (const participant of chat.participants) {
      const room = `${getRoleFromModel(participant.model)}:${participant.item}`;
      io?.to(room).emit("newMessage", {
        ...message,
        chatId: chat._id // Include chatId for frontend filtering
      });
      
      // Emit chat update for unread counts
      io?.to(room).emit("chatUpdated", { chatId: chat._id });
    }

    res.status(201).json(message);
  } catch (err) {
    console.error("Student sendMessage error:", err);
    res.status(500).json({ error: "Unable to send message" });
  }
};

// =========================
// GET CHAT PARTICIPANT
// =========================
export const getChatParticipant = async (req: Request, res: Response) => {
  const { chatId, studentId } = req.params;
  try {
    const chat = await Chat.findById(chatId);
    if (!chat) return res.status(404).json({ error: "Chat not found" });

    const other = chat.participants.find((p: any) => p.item.toString() !== studentId);
    if (!other) return res.status(404).json({ error: "Participant not found" });

    const populated = await populateParticipant(other);
    res.status(200).json(populated.details);
  } catch (err) {
    console.error("Student getChatParticipant error:", err);
    res.status(500).json({ error: "Unable to fetch participant" });
  }
};

// =========================
// GET UNREAD COUNT - NEW ENDPOINT
// =========================
export const getUnreadCount = async (req: Request, res: Response) => {
  const studentId = req.params.studentId;
  try {
    const chats = await Chat.find({ "participants.item": studentId }).lean();
    
    const totalUnread = chats.reduce((count, chat) => {
      const chatUnread = chat.messages?.filter(
        (m: any) => 
          m.sender.toString() !== studentId && 
          m.senderModel === 'Teacher' && 
          m.status === 'sent'
      ).length || 0;
      return count + chatUnread;
    }, 0);

    res.status(200).json({ totalUnread });
  } catch (err) {
    console.error("Get unread count error:", err);
    res.status(500).json({ error: "Unable to fetch unread count" });
  }
};