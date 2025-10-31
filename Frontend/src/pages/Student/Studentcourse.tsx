import { useState, useEffect, useMemo } from 'react';
import { Clock, Users, Video, Download, PlayCircle, Star, Filter, Search, BookOpen, FileText, Award, ExternalLink } from 'lucide-react';
import Navbar from '../../components/Navbar';
import Sidebar from '../../components/Sidebar';
import StatsCard from '../../components/Cardstats';
import { LoadingSpinner, ErrorDisplay, EmptyState } from '../../components/Loadingerror';
import { useApiGet } from '../../hooks/useApi';
import { toast } from 'react-toastify';
import { formatDate, formatTimeAgo } from '../../utils/dateHelpers';

interface Teacher {
  _id: string;
  userId: {
    fullName: string;
    email: string;
  };
}

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
  teacherId: Teacher;
  title: string;
  contentType: "video" | "pdf" | "document" | "image" | "link";
  fileUrl: string;
  description?: string;
  tags: string[];
  fileSize?: number;
  originalFileName?: string;
  downloadCount: number;
  viewCount: number;
  subjectId: Subject;
  groups: Group[];
  createdAt: string;
  updatedAt: string;
}

interface GroupedCourse {
  subject: string;
  subjectId: string;
  subjectCode: string;
  posts: Post[];
  videos: number;
  pdfs: number;
  documents: number;
  images: number;
  links: number;
  instructors: string[];
}

interface DashboardData {
  student: {
    name: string;
    studentId: string;
    semester: number;
    group: {
      _id: string;
      name: string;
      semester: number;
      academicYear: number;
    };
    status: string;
    enrollmentYear: number;
  };
  assignments: {
    pending: number;
    total: number;
    submitted: number;
  };
  performance: {
    totalSubmissions: number;
    gradedSubmissions: number;
    pendingGrading: number;
    averageMarks: number;
    passedSubjects: number;
    totalSubjects: number;
    semesterProgress: number;
  };
  recentActivity: {
    newPostsThisWeek: number;
  };
}

interface PostsResponse {
  message: string;
  count: number;
  posts: Post[];
}

interface DashboardResponse {
  message: string;
  dashboard: DashboardData;
}

export default function StudentCoursesPage() {
  const [activeItem, setActiveItem] = useState('courses');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterType, setFilterType] = useState<'all' | 'video' | 'pdf' | 'document' | 'image' | 'link'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);

  // Fetch dashboard data
  const { 
    data: dashboardResponse, 
    loading: dashboardLoading, 
    error: dashboardError,
    refetch: refetchDashboard 
  } = useApiGet<DashboardResponse>('/student/dashboard', { 
    autoFetch: true 
  });

  // Build query string for posts
  const postsEndpoint = useMemo(() => {
    const params = new URLSearchParams();
    if (filterType !== 'all') {
      params.append('contentType', filterType);
    }
    const queryString = params.toString();
    return queryString ? `/student/posts?${queryString}` : '/student/posts';
  }, [filterType]);

  // Fetch posts with filters
  const { 
    data: postsResponse, 
    loading: postsLoading, 
    error: postsError,
    refetch: refetchPosts 
  } = useApiGet<PostsResponse>(postsEndpoint, { 
    autoFetch: true, 
    deps: [postsEndpoint] 
  });

  const dashboard = dashboardResponse?.dashboard;
  const posts = postsResponse?.posts || [];

  const groupPostsBySubject = (): GroupedCourse[] => {
    const grouped = posts.reduce((acc, post) => {
      const subjectKey = post.subjectId._id;
      
      if (!acc[subjectKey]) {
        acc[subjectKey] = {
          subject: post.subjectId.name,
          subjectId: post.subjectId._id,
          subjectCode: post.subjectId.code,
          posts: [],
          videos: 0,
          pdfs: 0,
          documents: 0,
          images: 0,
          links: 0,
          instructors: [],
        };
      }
      
      acc[subjectKey].posts.push(post);
      
      // Count by content type
      switch (post.contentType) {
        case 'video':
          acc[subjectKey].videos++;
          break;
        case 'pdf':
          acc[subjectKey].pdfs++;
          break;
        case 'document':
          acc[subjectKey].documents++;
          break;
        case 'image':
          acc[subjectKey].images++;
          break;
        case 'link':
          acc[subjectKey].links++;
          break;
      }
      
      // Add unique instructors
      const instructorName = post.teacherId.userId.fullName;
      if (!acc[subjectKey].instructors.includes(instructorName)) {
        acc[subjectKey].instructors.push(instructorName);
      }
      
      return acc;
    }, {} as Record<string, GroupedCourse>);

    return Object.values(grouped);
  };

  const getUniqueSubjects = (): { id: string; name: string }[] => {
    const subjects = posts.reduce((acc, post) => {
      if (!acc.find(s => s.id === post.subjectId._id)) {
        acc.push({
          id: post.subjectId._id,
          name: post.subjectId.name
        });
      }
      return acc;
    }, [] as { id: string; name: string }[]);
    
    return [{ id: 'all', name: 'All Subjects' }, ...subjects];
  };

  const filteredPosts = posts.filter(post => {
    const matchesCategory = filterCategory === 'all' || post.subjectId._id === filterCategory;
    const matchesSearch = post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          post.teacherId.userId.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          post.subjectId.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          post.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  const groupedCourses = groupPostsBySubject().filter(course => {
    const matchesCategory = filterCategory === 'all' || course.subjectId === filterCategory;
    const matchesSearch = course.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          course.instructors.some(instructor => 
                            instructor.toLowerCase().includes(searchQuery.toLowerCase())
                          ) ||
                          course.subjectCode.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return 'N/A';
    const mb = bytes / 1024 / 1024;
    return `${mb.toFixed(2)} MB`;
  };

  const getColorForSubject = (subject: string): string => {
    const colors = [
      'from-blue-500 to-blue-600',
      'from-purple-500 to-purple-600',
      'from-green-500 to-green-600',
      'from-orange-500 to-orange-600',
      'from-red-500 to-red-600',
      'from-teal-500 to-teal-600',
      'from-pink-500 to-pink-600',
      'from-indigo-500 to-indigo-600',
    ];
    const index = subject.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[index % colors.length];
  };

  const getContentIcon = (type: string) => {
    const icons: Record<string, any> = {
      pdf: FileText,
      video: Video,
      document: FileText,
      image: FileText,
      link: ExternalLink
    };
    return icons[type] || FileText;
  };

  const getContentColor = (type: string) => {
    const colors: Record<string, string> = {
      pdf: 'bg-red-50 text-red-600',
      video: 'bg-blue-50 text-blue-600',
      document: 'bg-green-50 text-green-600',
      image: 'bg-purple-50 text-purple-600',
      link: 'bg-orange-50 text-orange-600'
    };
    return colors[type] || 'bg-gray-50 text-gray-600';
  };

  const handleDownload = async (post: Post) => {
    try {
      if (post.contentType === 'link') {
        window.open(post.fileUrl, '_blank');
        toast.info('Opening link in new tab');
        return;
      }

      // Get the authentication token
      const token = localStorage.getItem('token');
      
      // Check if the fileUrl is a full URL or relative path
      let downloadUrl = post.fileUrl;
      if (!downloadUrl.startsWith('http')) {
        // If it's a relative path, construct the full URL
        downloadUrl = `${window.location.origin}${downloadUrl}`;
      }

      // Create a fetch request with authentication
      const response = await fetch(downloadUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to download file: ${response.status} ${response.statusText}`);
      }

      // Convert the response to a blob
      const blob = await response.blob();
      
      // Create a temporary URL for the blob
      const url = window.URL.createObjectURL(blob);
      
      // Create a temporary anchor element to trigger download
      const link = document.createElement('a');
      link.href = url;
      link.download = post.originalFileName || post.title;
      document.body.appendChild(link);
      link.click();
      
      // Clean up
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast.success('Download started!');
      
    } catch (err: any) {
      console.error('Error downloading file:', err);
      
      // Fallback: try direct download without authentication
      if (post.contentType !== 'link') {
        const link = document.createElement('a');
        link.href = post.fileUrl;
        link.download = post.originalFileName || post.title;
        link.target = '_blank';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.info('Opening file in new tab');
      } else {
        toast.error('Failed to download file. Please try again.');
      }
    }
  };

  const handleViewPost = (post: Post) => {
    setSelectedPost(post);
    if (post.contentType === 'link') {
      window.open(post.fileUrl, '_blank');
      toast.info('Opening link in new tab');
    } else {
      // For files, open in new tab
      window.open(post.fileUrl, '_blank');
      toast.info('Opening file in new tab');
    }
  };

  const loading = dashboardLoading || postsLoading;
  const error = dashboardError || postsError;

  if (loading) {
    return <LoadingSpinner message="Loading courses..." />;
  }

  if (error) {
    return (
      <ErrorDisplay 
        error={error} 
        onRetry={dashboardError ? refetchDashboard : refetchPosts} 
        title="Error Loading Courses" 
      />
    );
  }

  if (!dashboard) {
    return (
      <ErrorDisplay 
        error="Failed to load dashboard data" 
        onRetry={refetchDashboard} 
        title="Error Loading Dashboard" 
      />
    );
  }

  const totalVideos = posts.filter(p => p.contentType === 'video').length;
  const totalPdfs = posts.filter(p => p.contentType === 'pdf').length;
  const totalDocuments = posts.filter(p => p.contentType === 'document').length;
  const totalImages = posts.filter(p => p.contentType === 'image').length;
  const totalLinks = posts.filter(p => p.contentType === 'link').length;
  const totalSubjects = new Set(posts.map(p => p.subjectId._id)).size;
  const totalMaterials = posts.length;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <Sidebar activeItem={activeItem} onItemClick={setActiveItem} userRole="student" />

      <main className="lg:ml-64 p-6 lg:p-8 space-y-6 mt-10">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">My Course Materials</h1>
            <p className="text-gray-600 text-sm mt-1">
              Access learning resources from your assigned teachers
            </p>
            {dashboard.student.group && (
              <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                <div className="flex items-center gap-1">
                  <Users className="w-4 h-4" />
                  <span>{dashboard.student.group.name}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  <span>Semester {dashboard.student.semester}</span>
                </div>
                <div className="flex items-center gap-1">
                  <BookOpen className="w-4 h-4" />
                  <span>{totalSubjects} Subjects</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard
            title="Total Subjects"
            count={totalSubjects}
            subtitle="This semester"
            icon={BookOpen}
            iconColor="text-blue-600"
            iconBg="bg-blue-50"
          />

          <StatsCard
            title="Video Lectures"
            count={totalVideos}
            subtitle="Available"
            icon={Video}
            iconColor="text-green-600"
            iconBg="bg-green-50"
          />

          <StatsCard
            title="Study Materials"
            count={totalPdfs + totalDocuments}
            subtitle="PDFs & Documents"
            icon={FileText}
            iconColor="text-purple-600"
            iconBg="bg-purple-50"
          />

          <StatsCard
            title="Total Resources"
            count={totalMaterials}
            subtitle="All materials"
            icon={Award}
            iconColor="text-amber-600"
            iconBg="bg-amber-50"
          />
        </div>

        {/* Filters Section */}
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search materials, subjects, or instructors..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex gap-2">
              <div className="flex items-center gap-2">
                <Filter className="w-5 h-5 text-gray-400" />
                <select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {getUniqueSubjects().map(subject => (
                    <option key={subject.id} value={subject.id}>
                      {subject.name}
                    </option>
                  ))}
                </select>
              </div>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value as any)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Types</option>
                <option value="video">Videos</option>
                <option value="pdf">PDFs</option>
                <option value="document">Documents</option>
                <option value="image">Images</option>
                <option value="link">Links</option>
              </select>
            </div>
          </div>
        </div>

        {posts.length === 0 ? (
          <EmptyState 
            icon={BookOpen} 
            message="No course materials available"
            description={
              dashboard.student.group 
                ? "Your teachers haven't uploaded any materials for your group yet"
                : "You are not assigned to any group. Please contact administration."
            }
          />
        ) : (
          <>
            {/* Grouped by Subject */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {groupedCourses.map((course) => (
                <div
                  key={course.subjectId}
                  className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow"
                >
                  <div className={`h-40 bg-gradient-to-br ${getColorForSubject(course.subject)} flex items-center justify-center`}>
                    <BookOpen className="w-16 h-16 text-white opacity-80" />
                  </div>

                  <div className="p-5">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 text-base mb-1">
                          {course.subject}
                        </h3>
                        <p className="text-sm text-gray-600">{course.subjectCode}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          {course.instructors.join(', ')}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 mb-4 text-xs text-gray-600 flex-wrap">
                      {course.videos > 0 && (
                        <div className="flex items-center gap-1">
                          <Video className="w-4 h-4" />
                          <span>{course.videos}</span>
                        </div>
                      )}
                      {course.pdfs > 0 && (
                        <div className="flex items-center gap-1">
                          <FileText className="w-4 h-4" />
                          <span>{course.pdfs}</span>
                        </div>
                      )}
                      {course.documents > 0 && (
                        <div className="flex items-center gap-1">
                          <FileText className="w-4 h-4" />
                          <span>{course.documents}</span>
                        </div>
                      )}
                      {course.links > 0 && (
                        <div className="flex items-center gap-1">
                          <ExternalLink className="w-4 h-4" />
                          <span>{course.links}</span>
                        </div>
                      )}
                    </div>

                    <div className="text-xs text-gray-500 mb-4">
                      {course.posts.length} total materials
                    </div>

                    <button 
                      onClick={() => {
                        setFilterCategory(course.subjectId);
                        window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
                      }}
                      className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-2 rounded-lg font-medium hover:shadow-lg transition-shadow"
                    >
                      View Materials
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* All Materials List */}
            <div className="bg-white border border-gray-200 rounded-lg">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">All Course Materials</h2>
                <p className="text-sm text-gray-600 mt-1">
                  {filteredPosts.length} materials found • Group {dashboard.student.group?.name} • Semester {dashboard.student.semester}
                </p>
              </div>
              <div className="p-6">
                {filteredPosts.length === 0 ? (
                  <EmptyState 
                    icon={Search} 
                    message="No materials found"
                    description="Try adjusting your filters or search query"
                  />
                ) : (
                  <div className="space-y-4">
                    {filteredPosts.map((post) => {
                      const Icon = getContentIcon(post.contentType);
                      const colorClass = getContentColor(post.contentType);
                      
                      return (
                        <div
                          key={post._id}
                          className="flex items-center gap-4 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                          <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${colorClass}`}>
                            <Icon className="w-6 h-6" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-medium text-gray-900 text-sm truncate">
                              {post.title}
                            </h3>
                            <p className="text-xs text-gray-600 mt-1">
                              {post.subjectId.name} • {post.teacherId.userId.fullName}
                            </p>
                            <div className="flex items-center gap-4 mt-1 text-xs text-gray-500">
                              <span>{formatTimeAgo(post.createdAt)}</span>
                              {post.fileSize && <span>{formatFileSize(post.fileSize)}</span>}
                              <span>{post.downloadCount} downloads</span>
                              <span>{post.viewCount} views</span>
                            </div>
                            {post.tags.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-2">
                                {post.tags.slice(0, 3).map((tag, index) => (
                                  <span 
                                    key={index} 
                                    className="px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded-md"
                                  >
                                    #{tag}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                          <div className="flex gap-2">
                            <button 
                              onClick={() => handleViewPost(post)}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title={post.contentType === 'link' ? 'Open Link' : 'View'}
                            >
                              {post.contentType === 'link' ? (
                                <ExternalLink className="w-5 h-5" />
                              ) : (
                                <PlayCircle className="w-5 h-5" />
                              )}
                            </button>
                            <button 
                              onClick={() => handleDownload(post)}
                              className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                              title="Download"
                            >
                              <Download className="w-5 h-5" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}