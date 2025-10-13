import { useState, useEffect } from 'react';
import { Clock, Users, Video, Download, CheckCircle, PlayCircle, Star, Filter, Search, BookOpen, FileText, Award, TrendingUp, AlertCircle } from 'lucide-react';
import Navbar from '../../components/Navbar';
import Sidebar from '../../components/Sidebar';
import StatsCard from '../../components/Cardstats';
import { LoadingSpinner, ErrorDisplay, EmptyState } from '../../components/Loadingerror';

const API_BASE_URL = "http://localhost:5000/api";

interface Post {
  _id: string;
  teacherId: {
    _id: string;
    fullName: string;
    email: string;
  };
  title: string;
  contentType: "video" | "pdf";
  fileUrl: string;
  grade: string;
  subject: string;
  createdAt: string;
  updatedAt: string;
}

interface GroupedCourse {
  subject: string;
  posts: Post[];
  videos: number;
  pdfs: number;
  instructor: string;
}

export default function StudentCoursesPage() {
  const [activeItem, setActiveItem] = useState('courses');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterType, setFilterType] = useState<'all' | 'video' | 'pdf'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);

  useEffect(() => {
    fetchPosts();
  }, [filterType]);

  const fetchPosts = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      
      let url = `${API_BASE_URL}/student/posts`;
      const params = new URLSearchParams();
      
      if (filterType !== 'all') {
        params.append('contentType', filterType);
      }
      
      if (params.toString()) {
        url += `?${params.toString()}`;
      }

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch posts');
      }

      setPosts(data.posts || []);
      setError(null);
    } catch (err: any) {
      setError(err.message);
      console.error("Error fetching posts:", err);
    } finally {
      setLoading(false);
    }
  };

  const groupPostsBySubject = (): GroupedCourse[] => {
    const grouped = posts.reduce((acc, post) => {
      if (!acc[post.subject]) {
        acc[post.subject] = {
          subject: post.subject,
          posts: [],
          videos: 0,
          pdfs: 0,
          instructor: post.teacherId.fullName,
        };
      }
      
      acc[post.subject].posts.push(post);
      if (post.contentType === 'video') {
        acc[post.subject].videos++;
      } else {
        acc[post.subject].pdfs++;
      }
      
      return acc;
    }, {} as Record<string, GroupedCourse>);

    return Object.values(grouped);
  };

  const getUniqueSubjects = (): string[] => {
    const subjects = [...new Set(posts.map(post => post.subject))];
    return ['all', ...subjects];
  };

  const filteredPosts = posts.filter(post => {
    const matchesCategory = filterCategory === 'all' || post.subject === filterCategory;
    const matchesSearch = post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          post.teacherId.fullName.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const groupedCourses = groupPostsBySubject().filter(course => {
    const matchesCategory = filterCategory === 'all' || course.subject === filterCategory;
    const matchesSearch = course.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          course.instructor.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor(diffTime / (1000 * 60 * 60));

    if (diffHours < 1) return "Just now";
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return "1 day ago";
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return `${Math.floor(diffDays / 30)} months ago`;
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

  const handleDownload = async (post: Post) => {
    try {
      const link = document.createElement('a');
      link.href = post.fileUrl;
      link.download = post.title;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('Error downloading file:', err);
      alert('Failed to download file');
    }
  };

  const handleViewPost = (post: Post) => {
    setSelectedPost(post);
    window.open(post.fileUrl, '_blank');
  };

  if (loading) {
    return <LoadingSpinner message="Loading courses..." />;
  }

  if (error) {
    return <ErrorDisplay error={error} onRetry={fetchPosts} title="Error Loading Courses" />;
  }

  const totalVideos = posts.filter(p => p.contentType === 'video').length;
  const totalPdfs = posts.filter(p => p.contentType === 'pdf').length;
  const totalSubjects = new Set(posts.map(p => p.subject)).size;

  return (
    <div className="min-h-screen bg-gray-50">
     <Navbar />
      <Sidebar activeItem={activeItem} onItemClick={setActiveItem} userRole="student" />

      <main className="lg:ml-64 p-6 lg:p-8 space-y-6 mt-10">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">My Courses</h1>
            <p className="text-gray-600 text-sm mt-1">
              Access your course materials and learning resources
            </p>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Clock className="w-4 h-4" />
            <span>{totalSubjects} Active Subjects</span>
          </div>
        </div>

        {/* Stats Cards using StatsCard Component */}
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
            count={totalPdfs}
            subtitle="PDFs available"
            icon={FileText}
            iconColor="text-purple-600"
            iconBg="bg-purple-50"
          />

          <StatsCard
            title="Total Materials"
            count={posts.length}
            subtitle="Resources"
            icon={Award}
            iconColor="text-amber-600"
            iconBg="bg-amber-50"
          />
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search courses or instructors..."
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
                    <option key={subject} value={subject}>
                      {subject === 'all' ? 'All Subjects' : subject}
                    </option>
                  ))}
                </select>
              </div>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value as 'all' | 'video' | 'pdf')}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Types</option>
                <option value="video">Videos Only</option>
                <option value="pdf">PDFs Only</option>
              </select>
            </div>
          </div>
        </div>

        {posts.length === 0 ? (
          <EmptyState 
            icon={BookOpen} 
            message="No course materials yet"
            description="Your teachers will upload course materials here"
          />
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {groupedCourses.map((course) => (
                <div
                  key={course.subject}
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
                        <p className="text-sm text-gray-600">{course.instructor}</p>
                      </div>
                      <div className="flex items-center gap-1 text-sm">
                        <Star className="w-4 h-4 text-yellow-500 fill-current" />
                        <span className="font-semibold text-gray-900">4.8</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 mb-4 text-xs text-gray-600">
                      <div className="flex items-center gap-1">
                        <Video className="w-4 h-4" />
                        <span>{course.videos} videos</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <FileText className="w-4 h-4" />
                        <span>{course.pdfs} PDFs</span>
                      </div>
                    </div>

                    <div className="text-xs text-gray-500 mb-4">
                      {course.posts.length} total materials
                    </div>

                    <button 
                      onClick={() => {
                        setFilterCategory(course.subject);
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

            <div className="bg-white border border-gray-200 rounded-lg">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">All Course Materials</h2>
                <p className="text-sm text-gray-600 mt-1">
                  {filteredPosts.length} materials found
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
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {filteredPosts.map((post) => (
                      <div
                        key={post._id}
                        className="flex items-center gap-4 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
                      >
                        <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                          post.contentType === 'video' ? 'bg-blue-50' : 'bg-red-50'
                        }`}>
                          {post.contentType === 'video' ? (
                            <Video className="w-6 h-6 text-blue-600" />
                          ) : (
                            <FileText className="w-6 h-6 text-red-600" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-gray-900 text-sm truncate">
                            {post.title}
                          </h3>
                          <p className="text-xs text-gray-600 mt-1">
                            {post.subject} • {post.teacherId.fullName}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            {formatTimeAgo(post.createdAt)}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <button 
                            onClick={() => handleViewPost(post)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="View"
                          >
                            <PlayCircle className="w-5 h-5" />
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
                    ))}
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