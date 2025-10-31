import React, { useState, useMemo } from 'react';
import { FileText, Video, Image, Link2, File, AlertCircle, Loader, BookOpen, Users, Filter, Search, Download, Eye, Calendar, Plus, Edit, Trash2, ExternalLink } from 'lucide-react';
import { toast } from 'react-toastify';
import { useApiGet, useApiDelete } from '../../hooks/useApi';
import Navbar from '../../components/Navbar';
import Sidebar from '../../components/Sidebar';
import UploadMaterialModal from '../../components/Uploadmaterialmodal';
import ConfirmDialog from '../../components/Confirmationdialogue';

// Types
interface Subject {
  _id: string;
  name: string;
  code: string;
}

interface Group {
  _id: string;
  name: string;
  semester: number;
}

interface Post {
  _id: string;
  title: string;
  contentType: string;
  fileUrl: string;
  description?: string;
  tags: string[];
  fileSize?: number;
  originalFileName?: string;
  downloadCount: number;
  viewCount: number;
  createdAt: string;
  subjectId: {
    _id: string;
    name: string;
    code: string;
  };
  groups: Group[];
}

const TeacherLearningResources = () => {
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState<{ isOpen: boolean; post: Post | null }>({
    isOpen: false,
    post: null
  });
  const [filters, setFilters] = useState({
    search: '',
    contentType: '',
    subjectId: '',
    semester: ''
  });
  const [page, setPage] = useState(1);

  // Fetch dashboard data
  const { 
    data: dashboardResponse, 
    loading: loadingDashboard 
  } = useApiGet('/teacher/dashboard', { autoFetch: true });

  // Get assigned semesters from dashboard data
  const assignedSemesters = useMemo(() => {
    if (!dashboardResponse?.dashboard?.teacher?.assignedSubjects) {
      return [];
    }
    
    // Extract unique semesters from assigned subjects
    const semesters = dashboardResponse.dashboard.teacher.assignedSubjects
      .map((subject: any) => subject.semester)
      .filter((semester: number, index: number, arr: number[]) => 
        arr.indexOf(semester) === index
      )
      .sort((a: number, b: number) => a - b);
    
    return semesters;
  }, [dashboardResponse]);

  // Build query string for posts
  const buildQueryString = () => {
    const params = new URLSearchParams();
    if (filters.search) params.append('search', filters.search);
    if (filters.contentType) params.append('contentType', filters.contentType);
    if (filters.subjectId) params.append('subjectId', filters.subjectId);
    if (filters.semester) params.append('semester', filters.semester);
    params.append('page', page.toString());
    params.append('limit', '12');
    return params.toString();
  };

  // Fetch posts with filters
  const { 
    data: postsResponse, 
    loading: loadingPosts, 
    refetch: refetchPosts 
  } = useApiGet(
    `/teacher/posts?${buildQueryString()}`,
    { autoFetch: true, deps: [filters, page] }
  );

  // Delete post hook
  const { delete: deletePost, loading: deletingPost } = useApiDelete({
    onSuccess: () => {
      toast.success('Material deleted successfully!');
      refetchPosts();
    },
    onError: (error) => {
      toast.error(error || 'Failed to delete material');
    }
  });

  const dashboardData = dashboardResponse?.dashboard;
  const posts = postsResponse?.posts || [];
  const totalPages = postsResponse?.totalPages || 1;
  const totalPosts = postsResponse?.totalPosts || 0;

  const getContentIcon = (type: string) => {
    const icons: Record<string, any> = {
      pdf: FileText,
      video: Video,
      image: Image,
      document: File,
      link: Link2
    };
    return icons[type] || File;
  };

  const getContentColor = (type: string) => {
    const colors: Record<string, string> = {
      pdf: 'bg-red-50 text-red-600',
      video: 'bg-purple-50 text-purple-600',
      image: 'bg-green-50 text-green-600',
      document: 'bg-blue-50 text-blue-600',
      link: 'bg-orange-50 text-orange-600'
    };
    return colors[type] || 'bg-gray-50 text-gray-600';
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return 'N/A';
    const mb = bytes / 1024 / 1024;
    return `${mb.toFixed(2)} MB`;
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  const handleDownload = (post: Post) => {
    if (post.contentType === 'link') {
      window.open(post.fileUrl, '_blank');
      toast.info('Opening link in new tab');
    } else {
      // Create a temporary anchor element to trigger download
      const link = document.createElement('a');
      link.href = post.fileUrl;
      link.download = post.originalFileName || post.title;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success('Download started!');
    }
  };

  const handleDeleteClick = (post: Post) => {
    setDeleteDialog({ isOpen: true, post });
  };

  const handleDeleteConfirm = async () => {
    if (deleteDialog.post) {
      await deletePost(`/teacher/posts/${deleteDialog.post._id}`);
      setDeleteDialog({ isOpen: false, post: null });
    }
  };

  if (loadingDashboard) {
    return (
      <>
        <Navbar />
        <Sidebar userRole="teacher" activeItem="learning Resource" />
        <div className="ml-64 mt-16 min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
          <div className="text-center">
            <Loader className="animate-spin mx-auto mb-4 text-blue-600" size={48} />
            <p className="text-gray-600">Loading dashboard...</p>
          </div>
        </div>
      </>
    );
  }

  if (!dashboardData) {
    return (
      <>
        <Navbar />
        <Sidebar userRole="teacher" activeItem="learning Resource" />
        <div className="ml-64 mt-16 min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
          <div className="text-center bg-white p-8 rounded-2xl shadow-lg">
            <AlertCircle className="mx-auto mb-4 text-red-600" size={48} />
            <h2 className="text-xl font-bold text-gray-800 mb-2">Failed to Load Data</h2>
            <p className="text-gray-600">Please refresh the page and try again.</p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <Sidebar userRole="teacher" activeItem="learning Resource" />
      
      <div className="ml-64 mt-16 min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header Section */}
          <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-800">Learning Resources</h1>
                <p className="text-gray-600 mt-1">
                  Manage and share course materials with your students
                </p>
              </div>
              <button
                onClick={() => setShowUploadModal(true)}
                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all flex items-center gap-2 shadow-md hover:shadow-lg"
              >
                <Plus size={20} />
                Upload Material
              </button>
            </div>
          </div>

          {/* Filters Section */}
          <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
            <div className="flex items-center gap-2 mb-4">
              <Filter size={20} className="text-gray-600" />
              <h2 className="text-lg font-semibold text-gray-800">Filters</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  placeholder="Search materials..."
                  value={filters.search}
                  onChange={(e) => {
                    setFilters(prev => ({ ...prev, search: e.target.value }));
                    setPage(1);
                  }}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                />
              </div>

              {/* Content Type Filter */}
              <select
                value={filters.contentType}
                onChange={(e) => {
                  setFilters(prev => ({ ...prev, contentType: e.target.value }));
                  setPage(1);
                }}
                className="px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              >
                <option value="">All Types</option>
                <option value="pdf">PDF</option>
                <option value="video">Video</option>
                <option value="document">Document</option>
                <option value="image">Image</option>
                <option value="link">Link</option>
              </select>

              {/* Subject Filter */}
              <select
                value={filters.subjectId}
                onChange={(e) => {
                  setFilters(prev => ({ ...prev, subjectId: e.target.value }));
                  setPage(1);
                }}
                className="px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              >
                <option value="">All Subjects</option>
                {dashboardData.teacher.assignedSubjects.map((as: any) => (
                  <option key={as._id} value={as.subjectId._id}>
                    {as.subjectId.name}
                  </option>
                ))}
              </select>

              {/* Semester Filter - Only show assigned semesters */}
              <select
                value={filters.semester}
                onChange={(e) => {
                  setFilters(prev => ({ ...prev, semester: e.target.value }));
                  setPage(1);
                }}
                className="px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              >
                <option value="">All Semesters</option>
                {assignedSemesters.map((sem: number) => (
                  <option key={sem} value={sem}>
                    Semester {sem}
                  </option>
                ))}
              </select>
            </div>

            {/* Active Filters */}
            {(filters.search || filters.contentType || filters.subjectId || filters.semester) && (
              <div className="mt-4 flex items-center gap-2">
                <span className="text-sm text-gray-600">Active filters:</span>
                <button
                  onClick={() => {
                    setFilters({ search: '', contentType: '', subjectId: '', semester: '' });
                    setPage(1);
                  }}
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                  Clear all
                </button>
              </div>
            )}
          </div>

          {/* Posts Grid */}
          {loadingPosts ? (
            <div className="flex items-center justify-center py-16">
              <Loader className="animate-spin text-blue-600" size={48} />
            </div>
          ) : posts.length === 0 ? (
            <div className="bg-white rounded-xl shadow-lg p-12 text-center">
              <FileText className="mx-auto mb-4 text-gray-400" size={64} />
              <h3 className="text-xl font-semibold text-gray-800 mb-2">No materials found</h3>
              <p className="text-gray-600 mb-6">
                {filters.search || filters.contentType || filters.subjectId || filters.semester
                  ? 'Try adjusting your filters'
                  : 'Start by uploading your first course material'}
              </p>
              <button
                onClick={() => setShowUploadModal(true)}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition inline-flex items-center gap-2"
              >
                <Plus size={20} />
                Upload Material
              </button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
                {posts.map(post => {
                  const Icon = getContentIcon(post.contentType);
                  const colorClass = getContentColor(post.contentType);
                  
                  return (
                    <div 
                      key={post._id} 
                      className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all overflow-hidden group"
                    >
                      <div className="p-6">
                        {/* Header */}
                        <div className="flex items-start justify-between mb-4">
                          <div className={`p-3 rounded-lg ${colorClass}`}>
                            <Icon size={24} />
                          </div>
                          <span className="px-3 py-1 bg-gray-100 text-gray-700 text-xs font-medium rounded-full uppercase">
                            {post.contentType}
                          </span>
                        </div>

                        {/* Title */}
                        <h3 className="text-lg font-bold text-gray-800 mb-3 line-clamp-2 group-hover:text-blue-600 transition">
                          {post.title}
                        </h3>
                        
                        {/* Meta Info */}
                        <div className="space-y-2 mb-4">
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <BookOpen size={16} className="flex-shrink-0" />
                            <span className="truncate">{post.subjectId.name} ({post.subjectId.code})</span>
                          </div>
                          
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Users size={16} className="flex-shrink-0" />
                            <span className="truncate">{post.groups.map(g => g.name).join(', ')}</span>
                          </div>

                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Calendar size={16} className="flex-shrink-0" />
                            <span>{formatDate(post.createdAt)}</span>
                          </div>
                        </div>

                        {/* Tags */}
                        {post.tags.length > 0 && (
                          <div className="flex flex-wrap gap-2 mb-4">
                            {post.tags.slice(0, 3).map((tag, idx) => (
                              <span 
                                key={idx} 
                                className="px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded-md font-medium"
                              >
                                #{tag}
                              </span>
                            ))}
                            {post.tags.length > 3 && (
                              <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-md">
                                +{post.tags.length - 3}
                              </span>
                            )}
                          </div>
                        )}

                        {/* Footer */}
                        <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                          <div className="flex gap-4 text-sm text-gray-600">
                            <div className="flex items-center gap-1">
                              <Eye size={16} />
                              <span>{post.viewCount}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Download size={16} />
                              <span>{post.downloadCount}</span>
                            </div>
                          </div>
                          
                          <div className="flex gap-2">
                            <button 
                              className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition"
                              onClick={() => handleDownload(post)}
                              title="Download"
                            >
                              {post.contentType === 'link' ? (
                                <ExternalLink size={18} />
                              ) : (
                                <Download size={18} />
                              )}
                            </button>
                            <button 
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                              onClick={() => toast.info('Edit functionality coming soon!')}
                              title="Edit"
                            >
                              <Edit size={18} />
                            </button>
                            <button 
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                              onClick={() => handleDeleteClick(post)}
                              title="Delete"
                              disabled={deletingPost}
                            >
                              <Trash2 size={18} />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-center items-center gap-3">
                  <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="px-5 py-2.5 border-2 border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
                  >
                    Previous
                  </button>
                  
                  <div className="flex gap-2">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum;
                      if (totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (page <= 3) {
                        pageNum = i + 1;
                      } else if (page >= totalPages - 2) {
                        pageNum = totalPages - 4 + i;
                      } else {
                        pageNum = page - 2 + i;
                      }
                      
                      return (
                        <button
                          key={pageNum}
                          onClick={() => setPage(pageNum)}
                          className={`px-4 py-2 rounded-lg font-medium transition ${
                            page === pageNum
                              ? 'bg-blue-600 text-white'
                              : 'bg-white border-2 border-gray-300 text-gray-700 hover:bg-gray-50'
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                  </div>
                  
                  <button
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="px-5 py-2.5 border-2 border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Upload Modal */}
      {showUploadModal && dashboardData && (
        <UploadMaterialModal
          isOpen={showUploadModal}
          onClose={() => setShowUploadModal(false)}
          dashboardData={dashboardData}
          onSuccess={refetchPosts}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={deleteDialog.isOpen}
        onClose={() => setDeleteDialog({ isOpen: false, post: null })}
        onConfirm={handleDeleteConfirm}
        title="Delete Material"
        message={`Are you sure you want to delete <strong>"${deleteDialog.post?.title}"</strong>?<br/><br/>This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        type="danger"
      />
    </>
  );
};

export default TeacherLearningResources;