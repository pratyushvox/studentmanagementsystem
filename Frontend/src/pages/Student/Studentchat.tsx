// components/StudentChat.tsx
import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { 
  Search, 
  Users, 
  MessageCircle, 
  Send, 
  Loader,
  AlertCircle,
  BookOpen
} from 'lucide-react';
import { toast } from 'react-toastify';
import { useApiGet, useApiPost } from '../../hooks/useApi';
import Navbar from '../../components/Navbar';
import Sidebar from '../../components/Sidebar';
import { io, Socket } from 'socket.io-client';

// Types
interface Teacher {
  _id: string;
  teacherId: string;
  fullName: string;
  email: string;
  department?: string;
  specialization?: string;
  isModuleLeader: boolean;
  profilePhoto?: string;
  subjects: Array<{
    _id: string;
    name: string;
    code: string;
  }>;
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
  otherParticipant?: Teacher;
  lastMessage?: Message;
  unreadCount: number;
}

const StudentChat = () => {
  const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null);
  const [activeChat, setActiveChat] = useState<Chat | null>(null);
  const [messageInput, setMessageInput] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [isLoadingChat, setIsLoadingChat] = useState(false);
  const [isSocketConnected, setIsSocketConnected] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const socketRef = useRef<Socket | null>(null);

  // Get student profile first to get student ID
  const { 
    data: studentProfile, 
    loading: loadingProfile,
    error: profileError
  } = useApiGet('/student/profile', { 
    autoFetch: true 
  });

  // Get student ID from profile
  const studentId = studentProfile?.student?._id;

  // Fetch available departments
  const { 
    data: departmentsResponse,
    loading: loadingDepartments
  } = useApiGet('/student/teachers/departments', {
    autoFetch: !!studentId
  });

  // Fetch student's teachers - ONLY when studentId is available
  const { 
    data: teachersResponse, 
    loading: loadingTeachers,
    error: teachersError,
    refetch: refetchTeachers
  } = useApiGet('/student/teachers', { 
    autoFetch: !!studentId 
  });

  // Fetch student's chats - ONLY when studentId is available
  const { 
    data: chatsResponse,
    loading: loadingChats,
    error: chatsError,
    refetch: refetchChats
  } = useApiGet(studentId ? `/student/chat/${studentId}` : null, {
    autoFetch: !!studentId
  });

  // API hooks
  const { post: createChat, loading: creatingChat } = useApiPost();
  const { post: sendMessage, loading: sendingMessage } = useApiPost();

  const teachers = teachersResponse?.teachers || [];
  const departments = departmentsResponse?.departments || [];
  const chats = chatsResponse || [];

  // Get teachers with their chat info and unread counts
  const teachersWithChatInfo = useMemo(() => {
    return teachers.map((teacher: Teacher) => {
      // Find the chat for this teacher
      const teacherChat = Array.isArray(chats) ? chats.find((chat: Chat) => 
        chat.participants?.some(
          (p: any) => p.model === 'Teacher' && p.item === teacher._id
        )
      ) : null;

      return {
        ...teacher,
        chat: teacherChat,
        unreadCount: teacherChat?.unreadCount || 0,
        lastMessage: teacherChat?.lastMessage,
        hasUnread: (teacherChat?.unreadCount || 0) > 0
      };
    });
  }, [teachers, chats]);

  // Sort teachers: unread messages first, then by last message time
  const sortedTeachers = useMemo(() => {
    return [...teachersWithChatInfo].sort((a, b) => {
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
  }, [teachersWithChatInfo]);

  // Filter teachers based on search and department
  const filteredTeachers = useMemo(() => {
    return sortedTeachers.filter((teacher) => {
      const matchesSearch = searchTerm === '' || 
        teacher.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        teacher.teacherId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        teacher.department?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesDepartment = departmentFilter === '' || 
        teacher.department === departmentFilter;
      
      return matchesSearch && matchesDepartment;
    });
  }, [sortedTeachers, searchTerm, departmentFilter]);

  // Initialize Socket.IO connection - UPDATED VERSION
  useEffect(() => {
    if (!studentId) return;

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
      
      // Join student's room after connection is established
      newSocket.emit('join', { role: 'student', userId: studentId });
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
        // If student is viewing the chat, mark as read immediately
        if (message.senderModel === 'Teacher') {
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
      if (message.senderModel === 'Teacher' && (!activeChat || message.chatId !== activeChat._id)) {
        const teacherName = teachers.find(t => t._id === message.sender)?.fullName || 'Teacher';
        toast.info(`New message from ${teacherName}`, {
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
  }, [studentId, activeChat?._id, teachers]); // Added dependencies

  // Handle teacher selection and mark messages as read
  const handleTeacherSelect = async (teacher: Teacher) => {
    setSelectedTeacher(teacher);
    setIsLoadingChat(true);
    
    try {
      // Find existing chat
      let existingChat: Chat | null = null;
      if (Array.isArray(chats)) {
        existingChat = chats.find((chat: Chat) => 
          chat.participants?.some(
            (p: any) => p.model === 'Teacher' && p.item === teacher._id
          )
        ) || null;
      }

      if (existingChat) {
        setActiveChat(existingChat);
        
        // Mark teacher messages as read when student opens the chat
        if (existingChat._id && studentId) {
          try {
            // Call getMessages endpoint to mark messages as read
            await fetch(`/api/student/chat/messages/${existingChat._id}?studentId=${studentId}`);
            console.log('✅ Messages marked as read');
          } catch (error) {
            console.error('Failed to mark messages as read:', error);
          }
        }
        
        // Refresh chats to update unread counts
        refetchChats();
      } else {
        // Create new chat
        const result = await createChat('/student/chat', {
          participants: [
            { item: studentId, model: 'Student' },
            { item: teacher._id, model: 'Teacher' }
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
    if (activeChat?._id && studentId) {
      // Fetch messages and mark as read
      const fetchMessages = async () => {
        try {
          await fetch(`/api/student/chat/messages/${activeChat._id}?studentId=${studentId}`);
        } catch (error) {
          console.error('Failed to fetch messages:', error);
        }
      };
      
      fetchMessages();
    }
  }, [activeChat?._id, studentId]);

  // Handle errors
  useEffect(() => {
    if (profileError) {
      console.error('Profile error:', profileError);
      toast.error('Failed to load student profile');
    }
    if (teachersError) {
      console.error('Teachers error:', teachersError);
      toast.error('Failed to load teachers');
    }
    if (chatsError) {
      console.error('Chats error:', chatsError);
      toast.error('Failed to load chats');
    }
  }, [profileError, teachersError, chatsError]);

  // Scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeChat?.messages]);

  const handleSendMessage = async () => {
    if (!messageInput.trim() || !activeChat || !studentId) return;

    try {
      const result = await sendMessage('/student/chat/send', {
        chatId: activeChat._id,
        sender: studentId,
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
    return teachersWithChatInfo.reduce((total, teacher) => total + teacher.unreadCount, 0);
  }, [teachersWithChatInfo]);

  // Show loading state while fetching profile
  if (loadingProfile || !studentId) {
    return (
      <>
        <Navbar />
        <Sidebar userRole="student" activeItem="chat" />
        <div className="ml-64 mt-16 min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
          <div className="text-center">
            <Loader className="animate-spin mx-auto mb-4 text-blue-600" size={48} />
            <p className="text-gray-600">Loading student profile...</p>
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
        <Sidebar userRole="student" activeItem="chat" />
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
      <Sidebar userRole="student" activeItem="chat" />
      
      <div className="ml-64 mt-16 min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="flex h-[calc(100vh-4rem)]">
          {/* Sidebar - Teachers List */}
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
              <p className="text-sm text-gray-600">Chat with your teachers</p>
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
                  placeholder="Search teachers..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                />
              </div>

              <select
                value={departmentFilter}
                onChange={(e) => setDepartmentFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                disabled={loadingDepartments}
              >
                <option value="">All Departments</option>
                {departments.map((dept: string) => (
                  <option key={dept} value={dept}>
                    {dept}
                  </option>
                ))}
              </select>
            </div>

            {/* Teachers List */}
            <div className="flex-1 overflow-y-auto">
              {loadingTeachers ? (
                <div className="flex items-center justify-center h-32">
                  <Loader className="animate-spin text-blue-600" size={24} />
                </div>
              ) : filteredTeachers.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-32 text-gray-500">
                  <Users size={32} className="mb-2" />
                  <p className="text-sm">No teachers found</p>
                </div>
              ) : (
                filteredTeachers.map((teacher) => (
                  <div
                    key={teacher._id}
                    className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors ${
                      selectedTeacher?._id === teacher._id ? 'bg-blue-50 border-blue-200' : ''
                    } ${teacher.hasUnread ? 'bg-orange-50 border-orange-200' : ''}`}
                    onClick={() => handleTeacherSelect(teacher)}
                  >
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-blue-600 rounded-full flex items-center justify-center text-white font-semibold">
                          {getInitials(teacher.fullName)}
                        </div>
                        {teacher.hasUnread && (
                          <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center animate-pulse">
                            <span className="text-xs text-white font-bold">
                              {teacher.unreadCount > 9 ? '9+' : teacher.unreadCount}
                            </span>
                          </div>
                        )}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h3 className={`font-semibold text-gray-800 truncate ${teacher.hasUnread ? 'text-blue-800 font-bold' : ''}`}>
                            {teacher.fullName}
                            {teacher.isModuleLeader && (
                              <span className="ml-2 px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full">
                                Module Leader
                              </span>
                            )}
                          </h3>
                          {teacher.lastMessage && (
                            <span className="text-xs text-gray-500 whitespace-nowrap ml-2">
                              {formatLastMessageTime(teacher.lastMessage.createdAt)}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 truncate">
                          {teacher.teacherId}
                        </p>
                        {teacher.department && (
                          <p className="text-xs text-gray-500 truncate">
                            {teacher.department}
                          </p>
                        )}
                        {teacher.lastMessage && (
                          <p className="text-xs text-gray-500 truncate mt-1">
                            {teacher.lastMessage.content.length > 30 
                              ? `${teacher.lastMessage.content.substring(0, 30)}...`
                              : teacher.lastMessage.content
                            }
                          </p>
                        )}
                        {teacher.subjects.length > 0 && (
                          <div className="flex items-center gap-1 mt-1">
                            <BookOpen size={12} className="text-gray-400" />
                            <span className="text-xs text-gray-500">
                              {teacher.subjects.length} subject{teacher.subjects.length !== 1 ? 's' : ''}
                            </span>
                          </div>
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
            {!selectedTeacher ? (
              <div className="flex-1 flex flex-col items-center justify-center text-gray-500">
                <MessageCircle size={64} className="mb-4 text-gray-300" />
                <h3 className="text-xl font-semibold mb-2">No teacher selected</h3>
                <p>Select a teacher from the list to start chatting</p>
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
                    <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-blue-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                      {getInitials(selectedTeacher.fullName)}
                    </div>
                    <div>
                      <h2 className="font-semibold text-gray-800">
                        {selectedTeacher.fullName}
                        {selectedTeacher.isModuleLeader && (
                          <span className="ml-2 px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full">
                            Module Leader
                          </span>
                        )}
                      </h2>
                      <p className="text-sm text-gray-600">
                        {selectedTeacher.teacherId}
                        {selectedTeacher.department && ` • ${selectedTeacher.department}`}
                      </p>
                      {selectedTeacher.subjects.length > 0 && (
                        <p className="text-xs text-gray-500 mt-1">
                          Teaches: {selectedTeacher.subjects.map(s => s.name).join(', ')}
                        </p>
                      )}
                    </div>
                    {teachersWithChatInfo.find(t => t._id === selectedTeacher._id)?.hasUnread && (
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
                      <p className="text-sm">Start a conversation with {selectedTeacher.fullName}</p>
                    </div>
                  ) : (
                    activeChat?.messages?.map((message, index) => {
                      const isOwnMessage = message.senderModel === 'Student';
                      
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

export default StudentChat;