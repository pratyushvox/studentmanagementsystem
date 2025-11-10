import React, { useState, useMemo, useEffect, useRef } from 'react';
import { 
  Search, 
  Users, 
  MessageCircle, 
  Send, 
  Loader,
  AlertCircle,
  Circle
} from 'lucide-react';
import { toast } from 'react-toastify';
import { useApiGet, useApiPost } from '../../hooks/useApi';
import Navbar from '../../components/Navbar';
import Sidebar from '../../components/Sidebar';
import { io, Socket } from 'socket.io-client';

// Types
interface Student {
  _id: string;
  studentId: string;
  fullName: string;
  email: string;
  currentSemester: number;
  profilePhoto?: string;
  groupName?: string;
}

interface Message {
  _id: string;
  sender: string;
  senderModel: 'Teacher' | 'Student';
  content: string;
  status: 'sent' | 'read';
  createdAt: string;
  chatId?: string;
}

interface Chat {
  _id: string;
  participants: Array<{
    item: string;
    model: 'Teacher' | 'Student';
  }>;
  messages: Message[];
  otherParticipant?: Student;
  lastMessage?: Message;
  unreadCount: number;
}

const TeacherChat = () => {
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [activeChat, setActiveChat] = useState<Chat | null>(null);
  const [messageInput, setMessageInput] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [semesterFilter, setSemesterFilter] = useState('');
  const [isLoadingChat, setIsLoadingChat] = useState(false);
  const [isSocketConnected, setIsSocketConnected] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const socketRef = useRef<Socket | null>(null);

  // Get teacher profile first to get teacher ID
  const { 
    data: teacherProfile, 
    loading: loadingProfile,
    error: profileError
  } = useApiGet('/teacher/profile', { 
    autoFetch: true 
  });

  // Get teacher ID from profile
  const teacherId = teacherProfile?.teacher?._id;

  // Fetch teacher's students
  const { 
    data: studentsResponse, 
    loading: loadingStudents,
    error: studentsError,
    refetch: refetchStudents
  } = useApiGet('/teacher/students', { 
    autoFetch: !!teacherId 
  });

  // Fetch teacher's chats - ONLY when teacherId is available
  const { 
    data: chatsResponse,
    loading: loadingChats,
    error: chatsError,
    refetch: refetchChats
  } = useApiGet(teacherId ? `/teacher/chat/${teacherId}` : null, {
    autoFetch: !!teacherId
  });

  // API hooks
  const { post: createChat, loading: creatingChat } = useApiPost();
  const { post: sendMessage, loading: sendingMessage } = useApiPost();

  const students = studentsResponse?.students || [];
  const chats = chatsResponse || [];

  // Get students with their chat info and unread counts
  const studentsWithChatInfo = useMemo(() => {
    return students.map((student: Student) => {
      // Find the chat for this student
      const studentChat = Array.isArray(chats) ? chats.find((chat: Chat) => 
        chat.participants?.some(
          (p: any) => p.model === 'Student' && p.item === student._id
        )
      ) : null;

      return {
        ...student,
        chat: studentChat,
        unreadCount: studentChat?.unreadCount || 0,
        lastMessage: studentChat?.lastMessage,
        hasUnread: (studentChat?.unreadCount || 0) > 0
      };
    });
  }, [students, chats]);

  // Sort students: unread messages first, then by last message time
  const sortedStudents = useMemo(() => {
    return [...studentsWithChatInfo].sort((a, b) => {
      // First sort by unread count (descending)
      if (a.unreadCount > b.unreadCount) return -1;
      if (a.unreadCount < b.unreadCount) return 1;
      
      // Then sort by last message time (most recent first)
      if (a.lastMessage && b.lastMessage) {
        return new Date(b.lastMessage.createdAt).getTime() - new Date(a.lastMessage.createdAt).getTime();
      }
      if (a.lastMessage) return -1;
      if (b.lastMessage) return 1;
      
      // Finally sort by name
      return a.fullName.localeCompare(b.fullName);
    });
  }, [studentsWithChatInfo]);

  // Filter students based on search and semester
  const filteredStudents = useMemo(() => {
    return sortedStudents.filter((student) => {
      const matchesSearch = searchTerm === '' || 
        student.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.studentId?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesSemester = semesterFilter === '' || 
        student.currentSemester?.toString() === semesterFilter;
      
      return matchesSearch && matchesSemester;
    });
  }, [sortedStudents, searchTerm, semesterFilter]);

  // Initialize Socket.IO connection - UPDATED VERSION
  useEffect(() => {
    if (!teacherId) return;

    // Create socket connection
    const newSocket = io('http://localhost:5000', {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socketRef.current = newSocket;

    // Socket event handlers
    newSocket.on('connect', () => {
      console.log('✅ Connected to chat server');
      setIsSocketConnected(true);
      
      // Join teacher's room after connection is established
      newSocket.emit('join', { role: 'teacher', userId: teacherId });
    });

    newSocket.on('disconnect', (reason) => {
      console.log('❌ Disconnected from chat server:', reason);
      setIsSocketConnected(false);
    });

    newSocket.on('roomJoined', (data) => {
      console.log('🎯 Joined room:', data.roomName);
    });

    // UPDATED: Handle new messages with better unread count management
    newSocket.on('newMessage', (message: Message) => {
      console.log('📨 New message received via socket:', message);
      
      // If this message is for the currently active chat
      if (activeChat && message.chatId === activeChat._id) {
        // If teacher is viewing the chat, mark as read immediately
        if (message.senderModel === 'Student') {
          // Optimistically update the message status to read
          const updatedMessage = { ...message, status: 'read' as const };
          setActiveChat(prev => prev ? {
            ...prev,
            messages: [...prev.messages, updatedMessage]
          } : null);
        } else {
          setActiveChat(prev => prev ? {
            ...prev,
            messages: [...prev.messages, message]
          } : null);
        }
      }
      
      // Always refresh chats list to update unread counts and last messages
      refetchChats();
      
      // Show notification for new message in other chats
      if (message.senderModel === 'Student' && (!activeChat || message.chatId !== activeChat._id)) {
        const studentName = students.find(s => s._id === message.sender)?.fullName || 'Student';
        toast.info(`New message from ${studentName}`, {
          position: "bottom-right",
          autoClose: 3000,
        });
      }
    });

    // NEW: Handle chat updates for unread counts
    newSocket.on('chatUpdated', (data: { chatId: string }) => {
      console.log('🔄 Chat updated:', data.chatId);
      refetchChats();
    });

    // NEW: Handle messages read events
    newSocket.on('messagesRead', (data: { chatId: string, reader: string }) => {
      console.log('📖 Messages marked as read by:', data.reader);
      if (activeChat && data.chatId === activeChat._id) {
        refetchChats();
      }
    });

    newSocket.on('error', (error) => {
      console.error('Socket error:', error);
      toast.error('Connection error');
    });

    // Connect the socket
    newSocket.connect();

    // Cleanup on unmount
    return () => {
      console.log('🧹 Cleaning up socket connection');
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      setIsSocketConnected(false);
    };
  }, [teacherId, activeChat?._id, students]); // Added dependencies

  // Handle student selection and mark messages as read
  const handleStudentSelect = async (student: Student) => {
    setSelectedStudent(student);
    setIsLoadingChat(true);
    
    try {
      // Find existing chat
      let existingChat: Chat | null = null;
      if (Array.isArray(chats)) {
        existingChat = chats.find((chat: Chat) => 
          chat.participants?.some(
            (p: any) => p.model === 'Student' && p.item === student._id
          )
        ) || null;
      }

      if (existingChat) {
        setActiveChat(existingChat);
        
        // Mark student messages as read when teacher opens the chat
        if (existingChat._id && teacherId) {
          try {
            // Call getMessages endpoint to mark messages as read
            await fetch(`/api/teacher/chat/messages/${existingChat._id}?teacherId=${teacherId}`);
            console.log('✅ Messages marked as read');
          } catch (error) {
            console.error('Failed to mark messages as read:', error);
          }
        }
        
        // Refresh chats to update unread counts
        refetchChats();
      } else {
        // Create new chat
        const result = await createChat('/teacher/chat', {
          participants: [
            { item: teacherId, model: 'Teacher' },
            { item: student._id, model: 'Student' }
          ]
        });
        
        if (result) {
          setActiveChat(result);
          refetchChats();
        }
      }
    } catch (error: any) {
      console.error('Chat error:', error);
      toast.error(error?.message || 'Failed to load chat');
    } finally {
      setIsLoadingChat(false);
    }
  };

  // NEW: Fetch messages for active chat and mark as read
  useEffect(() => {
    if (activeChat?._id && teacherId) {
      // Fetch messages and mark as read
      const fetchMessages = async () => {
        try {
          await fetch(`/api/teacher/chat/messages/${activeChat._id}?teacherId=${teacherId}`);
        } catch (error) {
          console.error('Failed to fetch messages:', error);
        }
      };
      
      fetchMessages();
    }
  }, [activeChat?._id, teacherId]);

  // Handle errors
  useEffect(() => {
    if (profileError) {
      console.error('Profile error:', profileError);
      toast.error('Failed to load teacher profile');
    }
    if (studentsError) {
      console.error('Students error:', studentsError);
      toast.error('Failed to load students');
    }
    if (chatsError) {
      console.error('Chats error:', chatsError);
      toast.error('Failed to load chats');
    }
  }, [profileError, studentsError, chatsError]);

  // Get available semesters from students
  const availableSemesters = useMemo(() => {
    const semesters = new Set<number>();
    students.forEach((student: Student) => {
      if (student.currentSemester) {
        semesters.add(student.currentSemester);
      }
    });
    return Array.from(semesters).sort();
  }, [students]);

  // Scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeChat?.messages]);

  const handleSendMessage = async () => {
    if (!messageInput.trim() || !activeChat || !teacherId) return;

    try {
      const result = await sendMessage('/teacher/chat/send', {
        chatId: activeChat._id,
        sender: teacherId,
        content: messageInput.trim()
      });

      if (result) {
        setMessageInput('');
        // Optimistically update the messages
        setActiveChat(prev => prev ? {
          ...prev,
          messages: [...(prev.messages || []), result]
        } : null);
        
        refetchChats(); // Refresh chats list
        
        console.log('✅ Message sent successfully');
      }
    } catch (error: any) {
      console.error('Send message error:', error);
      toast.error(error?.message || 'Failed to send message');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatLastMessageTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      return formatTime(dateString);
    } else if (diffInHours < 48) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // Calculate total unread count across all chats
  const totalUnreadCount = useMemo(() => {
    return studentsWithChatInfo.reduce((total, student) => total + student.unreadCount, 0);
  }, [studentsWithChatInfo]);

  // Show loading state while fetching profile
  if (loadingProfile || !teacherId) {
    return (
      <>
        <Navbar />
        <Sidebar userRole="teacher" activeItem="chat" />
        <div className="ml-64 mt-16 min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
          <div className="text-center">
            <Loader className="animate-spin mx-auto mb-4 text-blue-600" size={48} />
            <p className="text-gray-600">Loading teacher profile...</p>
          </div>
        </div>
      </>
    );
  }

  // Show error state if profile failed to load
  if (profileError) {
    return (
      <>
        <Navbar />
        <Sidebar userRole="teacher" activeItem="chat" />
        <div className="ml-64 mt-16 min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
          <div className="text-center bg-white p-8 rounded-2xl shadow-lg">
            <AlertCircle className="mx-auto mb-4 text-red-600" size={48} />
            <h2 className="text-xl font-bold text-gray-800 mb-2">Failed to Load Profile</h2>
            <p className="text-gray-600 mb-4">Please check your connection and try again.</p>
            <button 
              onClick={() => window.location.reload()}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              Retry
            </button>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <Sidebar userRole="teacher" activeItem="chat" />
      
      <div className="ml-64 mt-16 min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="flex h-[calc(100vh-4rem)]">
          {/* Sidebar - Students List */}
          <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
            {/* Header */}
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h1 className="text-xl font-bold text-gray-800">Messages</h1>
                {totalUnreadCount > 0 && (
                  <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                    {totalUnreadCount > 9 ? '9+' : totalUnreadCount}
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-600">Chat with your students</p>
              <div className="flex items-center gap-2 mt-1">
                <div className={`w-2 h-2 rounded-full ${isSocketConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
                <span className={`text-xs ${isSocketConnected ? 'text-green-600' : 'text-red-600'}`}>
                  {isSocketConnected ? 'Connected' : 'Disconnected'}
                </span>
              </div>
            </div>

            {/* Search and Filters */}
            <div className="p-4 border-b border-gray-200 space-y-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  placeholder="Search students..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                />
              </div>

              <select
                value={semesterFilter}
                onChange={(e) => setSemesterFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              >
                <option value="">All Semesters</option>
                {availableSemesters.map(semester => (
                  <option key={semester} value={semester.toString()}>
                    Semester {semester}
                  </option>
                ))}
              </select>
            </div>

            {/* Students List */}
            <div className="flex-1 overflow-y-auto">
              {loadingStudents ? (
                <div className="flex items-center justify-center h-32">
                  <Loader className="animate-spin text-blue-600" size={24} />
                </div>
              ) : filteredStudents.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-32 text-gray-500">
                  <Users size={32} className="mb-2" />
                  <p className="text-sm">No students found</p>
                </div>
              ) : (
                filteredStudents.map((student) => (
                  <div
                    key={student._id}
                    className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors ${
                      selectedStudent?._id === student._id ? 'bg-blue-50 border-blue-200' : ''
                    } ${student.hasUnread ? 'bg-orange-50 border-orange-200' : ''}`}
                    onClick={() => handleStudentSelect(student)}
                  >
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold">
                          {getInitials(student.fullName)}
                        </div>
                        {student.hasUnread && (
                          <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center animate-pulse">
                            <span className="text-xs text-white font-bold">
                              {student.unreadCount > 9 ? '9+' : student.unreadCount}
                            </span>
                          </div>
                        )}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h3 className={`font-semibold truncate ${student.hasUnread ? 'text-blue-800 font-bold' : 'text-gray-800'}`}>
                            {student.fullName}
                          </h3>
                          {student.lastMessage && (
                            <span className="text-xs text-gray-500 whitespace-nowrap ml-2">
                              {formatLastMessageTime(student.lastMessage.createdAt)}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 truncate">
                          {student.studentId} • Sem {student.currentSemester}
                        </p>
                        {student.lastMessage && (
                          <p className="text-xs text-gray-500 truncate mt-1">
                            {student.lastMessage.content.length > 30 
                              ? `${student.lastMessage.content.substring(0, 30)}...`
                              : student.lastMessage.content
                            }
                          </p>
                        )}
                        {student.groupName && (
                          <p className="text-xs text-gray-500 truncate">
                            {student.groupName}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Chat Area */}
          <div className="flex-1 flex flex-col bg-white">
            {!selectedStudent ? (
              <div className="flex-1 flex flex-col items-center justify-center text-gray-500">
                <MessageCircle size={64} className="mb-4 text-gray-300" />
                <h3 className="text-xl font-semibold mb-2">No student selected</h3>
                <p>Select a student from the list to start chatting</p>
              </div>
            ) : isLoadingChat ? (
              <div className="flex-1 flex items-center justify-center">
                <Loader className="animate-spin text-blue-600" size={48} />
              </div>
            ) : (
              <>
                {/* Chat Header */}
                <div className="p-4 border-b border-gray-200">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                      {getInitials(selectedStudent.fullName)}
                    </div>
                    <div>
                      <h2 className="font-semibold text-gray-800">
                        {selectedStudent.fullName}
                      </h2>
                      <p className="text-sm text-gray-600">
                        {selectedStudent.studentId}
                      </p>
                    </div>
                    {studentsWithChatInfo.find(s => s._id === selectedStudent._id)?.hasUnread && (
                      <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full ml-auto">
                        New messages
                      </span>
                    )}
                  </div>
                </div>

                {/* Messages Area */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
                  {activeChat?.messages?.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-gray-500">
                      <MessageCircle size={48} className="mb-3 text-gray-300" />
                      <p className="text-lg font-semibold">No messages yet</p>
                      <p className="text-sm">Start a conversation with {selectedStudent.fullName}</p>
                    </div>
                  ) : (
                    activeChat?.messages?.map((message, index) => {
                      const isOwnMessage = message.senderModel === 'Teacher';
                      
                      return (
                        <div key={message._id || index} className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}>
                          <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-2xl ${
                            isOwnMessage 
                              ? 'bg-blue-600 text-white rounded-br-none' 
                              : 'bg-white text-gray-800 rounded-bl-none border border-gray-200'
                          }`}>
                            <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                            <div className={`flex items-center gap-1 text-xs mt-1 ${
                              isOwnMessage ? 'text-blue-200' : 'text-gray-500'
                            }`}>
                              {formatTime(message.createdAt)}
                              {!isOwnMessage && message.status === 'read' && (
                                <span className="text-green-500">✓ Read</span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Message Input */}
                <div className="p-4 border-t border-gray-200 bg-white">
                  <div className="flex items-end gap-2">
                    <div className="flex-1 border border-gray-300 rounded-lg focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500">
                      <textarea
                        value={messageInput}
                        onChange={(e) => setMessageInput(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder="Type a message..."
                        rows={1}
                        className="w-full px-4 py-3 resize-none outline-none rounded-lg"
                        style={{ minHeight: '48px', maxHeight: '120px' }}
                      />
                    </div>

                    <button
                      onClick={handleSendMessage}
                      disabled={!messageInput.trim() || sendingMessage || !isSocketConnected}
                      className="p-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition flex items-center justify-center"
                      title={!isSocketConnected ? "Waiting for connection..." : "Send message"}
                    >
                      {sendingMessage ? (
                        <Loader className="animate-spin" size={20} />
                      ) : (
                        <Send size={20} />
                      )}
                    </button>
                  </div>
                  {!isSocketConnected && (
                    <p className="text-xs text-red-500 mt-2 text-center">
                      Waiting for real-time connection... Messages will still be saved.
                    </p>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default TeacherChat;