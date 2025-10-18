import React, { useState, useEffect } from 'react';
import { Bell, Search, Plus, Edit2, Trash2, X, AlertCircle, Calendar, Clock, User ,ArrowRight} from 'lucide-react';
import { useApiGet, useApiPost, useApiPut, useApiDelete } from '../hooks/useApi';

// Types
interface Notice {
  _id: string;
  title: string;
  content: string;
  targetAudience: ('student' | 'teacher' | 'all')[];
  priority: 'low' | 'medium' | 'high' | 'urgent';
  postedBy: {
    _id: string;
    name: string;
    email: string;
  };
  attachments: Array<{
    fileName: string;
    fileUrl: string;
    fileType: string;
  }>;
  isActive: boolean;
  expiryDate?: string;
  views: Array<{
    userId: string;
    viewedAt: string;
  }>;
  createdAt: string;
  updatedAt: string;
}

interface NoticeFormData {
  title: string;
  content: string;
  targetAudience: string[];
  priority: string;
  expiryDate: string;
  attachments: Array<{
    fileName: string;
    fileUrl: string;
    fileType: string;
  }>;
  isActive: boolean;
}

interface NoticeBoardProps {
  userRole: 'admin' | 'student' | 'teacher';
}

const NoticeBoard: React.FC<NoticeBoardProps> = ({ userRole }) => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedNotice, setSelectedNotice] = useState<Notice | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [isActiveFilter, setIsActiveFilter] = useState('');
  const [page, setPage] = useState(1);
  const [success, setSuccess] = useState('');

  const [formData, setFormData] = useState<NoticeFormData>({
    title: '',
    content: '',
    targetAudience: ['all'],
    priority: 'medium',
    expiryDate: '',
    attachments: [],
    isActive: true
  });

  // Build API endpoint based on user role
  const getNoticesEndpoint = () => {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: '10',
      ...(priorityFilter && { priority: priorityFilter }),
      ...(isActiveFilter && { isActive: isActiveFilter }),
      ...(searchTerm && { search: searchTerm })
    });

    if (userRole === 'admin') {
      return `/admin/notices?${params}`;
    } else if (userRole === 'student') {
      return `/student/notice?${params}`;
    } else if (userRole === 'teacher') {
      return `/teacher/notices?${params}`;
    }
    return '';
  };

  // Fetch notices with auto-fetch
  const { data: noticesData, loading, error, refetch } = useApiGet(
    getNoticesEndpoint(),
    { 
      autoFetch: true,
      deps: [page, priorityFilter, isActiveFilter, searchTerm]
    }
  );

  // API hooks for mutations
  const { post: createNotice, loading: creating, error: createError } = useApiPost({
    onSuccess: () => {
      setSuccess('Notice created successfully!');
      setShowCreateModal(false);
      resetForm();
      refetch();
      setTimeout(() => setSuccess(''), 3000);
    }
  });

  const { put: updateNotice, loading: updating, error: updateError } = useApiPut({
    onSuccess: () => {
      setSuccess('Notice updated successfully!');
      setShowEditModal(false);
      setSelectedNotice(null);
      resetForm();
      refetch();
      setTimeout(() => setSuccess(''), 3000);
    }
  });

  const { delete: deleteNotice, loading: deleting, error: deleteError } = useApiDelete({
    onSuccess: () => {
      setSuccess('Notice deleted successfully!');
      refetch();
      setTimeout(() => setSuccess(''), 3000);
    }
  });

  const notices = noticesData?.data || [];
  const totalPages = noticesData?.pagination?.pages || 1;
  const isLoading = loading || creating || updating || deleting;
  const currentError = error || createError || updateError || deleteError;

  // Handle create
  const handleCreate = () => {
    if (!formData.title || !formData.content) {
      return;
    }
    createNotice('/admin/create/notices', formData);
  };

  // Handle update
  const handleUpdate = () => {
    if (!selectedNotice || !formData.title || !formData.content) {
      return;
    }
    updateNotice(`/admin/notices/${selectedNotice._id}`, formData);
  };

  // Handle delete
  const handleDelete = (id: string) => {
    if (!window.confirm('Are you sure you want to delete this notice?')) return;
    deleteNotice(`/admin/notices/${id}`);
  };

  const resetForm = () => {
    setFormData({
      title: '',
      content: '',
      targetAudience: ['all'],
      priority: 'medium',
      expiryDate: '',
      attachments: [],
      isActive: true
    });
  };

  const openEditModal = (notice: Notice) => {
    setSelectedNotice(notice);
    setFormData({
      title: notice.title,
      content: notice.content,
      targetAudience: notice.targetAudience,
      priority: notice.priority,
      expiryDate: notice.expiryDate ? notice.expiryDate.split('T')[0] : '',
      attachments: notice.attachments || [],
      isActive: notice.isActive
    });
    setShowEditModal(true);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800 border-red-300';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'medium': return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'low': return 'bg-gray-100 text-gray-800 border-gray-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Bell className="w-8 h-8 text-blue-600" />
              <h1 className="text-3xl font-bold text-gray-800">Notice Board</h1>
            </div>
            {userRole === 'admin' && (
              <button
                onClick={() => setShowCreateModal(true)}
                className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-5 h-5" />
                Create Notice
              </button>
            )}
          </div>

          {/* Alerts */}
          {currentError && (
            <div className="bg-red-50 border border-red-300 text-red-800 px-4 py-3 rounded-lg mb-4 flex items-center gap-2">
              <AlertCircle className="w-5 h-5" />
              {currentError}
            </div>
          )}
          {success && (
            <div className="bg-green-50 border border-green-300 text-green-800 px-4 py-3 rounded-lg mb-4">
              {success}
            </div>
          )}

          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search notices..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Priorities</option>
              <option value="urgent">Urgent</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
            {userRole === 'admin' && (
              <select
                value={isActiveFilter}
                onChange={(e) => setIsActiveFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">All Status</option>
                <option value="true">Active</option>
                <option value="false">Inactive</option>
              </select>
            )}
          </div>
        </div>

        {/* Notices List */}
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : notices.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <Bell className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-600 mb-2">No notices found</h3>
            <p className="text-gray-500">There are currently no notices to display.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {notices.map((notice: Notice) => (
              <div key={notice._id} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold uppercase ${getPriorityColor(notice.priority)}`}>
                        {notice.priority}
                      </span>
                      {notice.targetAudience.map((audience) => (
                        <span key={audience} className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-xs font-semibold">
                          {audience}
                        </span>
                      ))}
                      {!notice.isActive && (
                        <span className="px-3 py-1 bg-gray-200 text-gray-700 rounded-full text-xs font-semibold">
                          Inactive
                        </span>
                      )}
                    </div>
                    <h3 className="text-xl font-bold text-gray-800 mb-2">{notice.title}</h3>
                    <p className="text-gray-600 mb-3 whitespace-pre-wrap">{notice.content}</p>
                    <div className="flex items-center gap-4 text-sm text-gray-500 flex-wrap">
                      <div className="flex items-center gap-1">
                        <User className="w-4 h-4" />
                        <span>{notice.postedBy.name}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        <span>{formatDate(notice.createdAt)}</span>
                      </div>
                      {notice.expiryDate && (
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          <span>Expires: {formatDate(notice.expiryDate)}</span>
                        </div>
                      )}
                    </div>
                    {notice.attachments && notice.attachments.length > 0 && (
                      <div className="mt-3">
                        <p className="text-sm font-semibold text-gray-700 mb-1">Attachments:</p>
                        <div className="flex flex-wrap gap-2">
                          {notice.attachments.map((att, idx) => (
                            <a
                              key={idx}
                              href={att.fileUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:text-blue-800 text-sm underline"
                            >
                              {att.fileName}
                            </a>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  {userRole === 'admin' && (
                    <div className="flex gap-2 ml-4">
                      <button
                        onClick={() => openEditModal(notice)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        disabled={isLoading}
                      >
                        <Edit2 className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleDelete(notice._id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        disabled={isLoading}
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center gap-2 mt-6">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1 || isLoading}
              className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <span className="px-4 py-2 bg-white border border-gray-300 rounded-lg">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages || isLoading}
              className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        )}

        {/* Create/Edit Modal */}
        {(showCreateModal || showEditModal) && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-800">
                    {showCreateModal ? 'Create Notice' : 'Edit Notice'}
                  </h2>
                  <button
                    onClick={() => {
                      setShowCreateModal(false);
                      setShowEditModal(false);
                      resetForm();
                    }}
                    className="p-2 hover:bg-gray-100 rounded-lg"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Title *
                    </label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Content *
                    </label>
                    <textarea
                      value={formData.content}
                      onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                      rows={5}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Priority
                      </label>
                      <select
                        value={formData.priority}
                        onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                        <option value="urgent">Urgent</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Target Audience
                      </label>
                      <select
                        multiple
                        value={formData.targetAudience}
                        onChange={(e) => setFormData({ 
                          ...formData, 
                          targetAudience: Array.from(e.target.selectedOptions, option => option.value)
                        })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="all">All</option>
                        <option value="student">Student</option>
                        <option value="teacher">Teacher</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Expiry Date (Optional)
                    </label>
                    <input
                      type="date"
                      value={formData.expiryDate}
                      onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.isActive}
                      onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                      className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                    />
                    <label className="text-sm font-semibold text-gray-700">
                      Active
                    </label>
                  </div>

                  <div className="flex gap-3 pt-4">
                    <button
                      onClick={showCreateModal ? handleCreate : handleUpdate}
                      disabled={isLoading || !formData.title || !formData.content}
                      className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {isLoading ? 'Saving...' : (showCreateModal ? 'Create Notice' : 'Update Notice')}
                    </button>
                    <button
                      onClick={() => {
                        setShowCreateModal(false);
                        setShowEditModal(false);
                        resetForm();
                      }}
                      className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default NoticeBoard;


export const NoticeCardCompact: React.FC<{ notice: Notice }> = ({ notice }) => {
  const getPriorityStyles = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return { bg: 'bg-red-50 hover:bg-red-100', border: 'border-red-500', badge: 'bg-red-100 text-red-700 border-red-200' };
      case 'high':
        return { bg: 'bg-orange-50 hover:bg-orange-100', border: 'border-orange-500', badge: 'bg-orange-100 text-orange-700 border-orange-200' };
      case 'medium':
        return { bg: 'bg-yellow-50 hover:bg-yellow-100', border: 'border-yellow-500', badge: 'bg-yellow-100 text-yellow-700 border-yellow-200' };
      default:
        return { bg: 'bg-blue-50 hover:bg-blue-100', border: 'border-blue-500', badge: 'bg-blue-100 text-blue-700 border-blue-200' };
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const styles = getPriorityStyles(notice.priority);

  return (
    <div className={`group relative rounded-lg p-4 border-l-4 transition-all hover:shadow-md ${styles.bg} ${styles.border}`}>
      <div className="flex items-start justify-between gap-2 mb-2">
        <h3 className="font-bold text-gray-900 text-sm flex-1">{notice.title}</h3>
        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold border ${styles.badge}`}>
          {notice.priority.toUpperCase()}
        </span>
      </div>
      <p className="text-sm text-gray-700 mb-3 leading-relaxed line-clamp-2">{notice.content}</p>
      <div className="flex items-center justify-between">
        <span className="text-xs text-gray-500 flex items-center gap-1">
          <Calendar className="w-3 h-3" />
          {formatDate(notice.createdAt)}
        </span>
        <button className="text-xs text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          Read More
          <ArrowRight className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
};