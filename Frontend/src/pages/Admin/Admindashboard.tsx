import { useState, useEffect } from "react";
import { 
  Users, 
  GraduationCap, 
  FileText, 
  BookOpen, 
  CheckCircle, 
  Clock,
  TrendingUp,
  Activity,
  AlertCircle,
  UserCheck,
  BarChart3,
  PieChart,
  Calendar,
  Download
} from "lucide-react";
import Navbar from "../../components/Navbar";
import Sidebar from "../../components/Sidebar";
import { LoadingSpinner, ErrorDisplay } from "../../components/LoadingError";

// API Base URL
const API_BASE_URL = "http://localhost:5000/api";

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState(null);
  const [recentUsers, setRecentUsers] = useState([]);
  const [recentAssignments, setRecentAssignments] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [activeItem, setActiveItem] = useState("dashboard");

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");

      // Fetch dashboard stats
      const statsRes = await fetch(`${API_BASE_URL}/admin/dashboard`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const statsData = await statsRes.json();

      // Fetch recent users
      const usersRes = await fetch(`${API_BASE_URL}/admin/users`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const usersData = await usersRes.json();

      // Fetch recent assignments
      const assignmentsRes = await fetch(`${API_BASE_URL}/admin/assignments`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const assignmentsData = await assignmentsRes.json();

      // Fetch pending teacher requests
      const requestsRes = await fetch(`${API_BASE_URL}/admin/teacher-requests/pending`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const requestsData = await requestsRes.json();

      setStats(statsData);
      setRecentUsers(usersData.slice(0, 5));
      setRecentAssignments(assignmentsData.slice(0, 5));
      setPendingRequests(requestsData.slice(0, 5));
      setError(null);
    } catch (err) {
      setError(err.message);
      console.error("Error fetching dashboard data:", err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getRoleBadgeColor = (role) => {
    switch(role) {
      case 'admin': return 'bg-purple-100 text-purple-700';
      case 'teacher': return 'bg-blue-100 text-blue-700';
      case 'student': return 'bg-green-100 text-green-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getApprovalBadge = (isApproved) => {
    return isApproved 
      ? <span className="flex items-center gap-1 text-xs text-green-600"><CheckCircle className="w-3 h-3" /> Approved</span>
      : <span className="flex items-center gap-1 text-xs text-orange-600"><Clock className="w-3 h-3" /> Pending</span>;
  };

  if (loading) {
    return <LoadingSpinner message="Loading admin dashboard..." />;
  }

  if (error) {
    return <ErrorDisplay error={error} onRetry={fetchDashboardData} title="Error Loading Dashboard" />;
  }

  if (!stats) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar onProfileClick={function (): void {
        throw new Error("Function not implemented.");
      }} />

      <Sidebar activeItem={activeItem} onItemClick={setActiveItem} userRole="admin" />
     
      <main className="lg:ml-64 p-6 lg:p-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mt-10">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Admin Dashboard</h1>
            <p className="text-gray-600 text-sm mt-1">
              Manage your educational platform
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm">
              <Download className="w-4 h-4" />
              Export Report
            </button>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Activity className="w-4 h-4" />
              <span>Live</span>
            </div>
          </div>
        </div>

        {/* Key Metrics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Total Students */}
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg p-6 text-white transform hover:scale-105 transition-transform">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center backdrop-blur-sm">
                <Users className="w-6 h-6" />
              </div>
              <TrendingUp className="w-5 h-5 opacity-80" />
            </div>
            <h3 className="text-sm font-medium opacity-90 mb-1">Total Students</h3>
            <p className="text-3xl font-bold">{stats.totalStudents}</p>
            <p className="text-xs opacity-80 mt-2">Active learners</p>
          </div>

          {/* Total Teachers */}
          <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-lg p-6 text-white transform hover:scale-105 transition-transform">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center backdrop-blur-sm">
                <GraduationCap className="w-6 h-6" />
              </div>
              <BarChart3 className="w-5 h-5 opacity-80" />
            </div>
            <h3 className="text-sm font-medium opacity-90 mb-1">Total Teachers</h3>
            <p className="text-3xl font-bold">{stats.totalTeachers}</p>
            <p className="text-xs opacity-80 mt-2">Educators on platform</p>
          </div>

          {/* Assignments */}
          <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl shadow-lg p-6 text-white transform hover:scale-105 transition-transform">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center backdrop-blur-sm">
                <FileText className="w-6 h-6" />
              </div>
              <PieChart className="w-5 h-5 opacity-80" />
            </div>
            <h3 className="text-sm font-medium opacity-90 mb-1">Assignments</h3>
            <p className="text-3xl font-bold">{stats.totalAssignments}</p>
            <p className="text-xs opacity-80 mt-2">{stats.totalSubmissions} submissions</p>
          </div>

          {/* Pending Requests */}
          <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl shadow-lg p-6 text-white transform hover:scale-105 transition-transform">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center backdrop-blur-sm">
                <Clock className="w-6 h-6" />
              </div>
              <AlertCircle className="w-5 h-5 opacity-80" />
            </div>
            <h3 className="text-sm font-medium opacity-90 mb-1">Pending Requests</h3>
            <p className="text-3xl font-bold">{stats.pendingRequests}</p>
            <p className="text-xs opacity-80 mt-2">Awaiting approval</p>
          </div>
        </div>

        {/* Secondary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center">
                <BookOpen className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.totalPosts}</p>
                <p className="text-sm text-gray-600">Learning Posts</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-green-50 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.totalSubmissions}</p>
                <p className="text-sm text-gray-600">Total Submissions</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-purple-50 rounded-lg flex items-center justify-center">
                <Activity className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.totalStudents + stats.totalTeachers}
                </p>
                <p className="text-sm text-gray-600">Total Users</p>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Users */}
          <div className="lg:col-span-2 bg-white rounded-xl shadow-md border border-gray-100">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900">Recent Users</h2>
              <Users className="w-5 h-5 text-gray-400" />
            </div>
            <div className="p-6">
              {recentUsers.length === 0 ? (
                <p className="text-center text-gray-500 py-8">No users found</p>
              ) : (
                <div className="space-y-4">
                  {recentUsers.map((user) => (
                    <div key={user._id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold">
                          {user.fullName.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">{user.fullName}</p>
                          <p className="text-xs text-gray-600">{user.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getRoleBadgeColor(user.role)}`}>
                          {user.role}
                        </span>
                        {getApprovalBadge(user.isApproved)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Pending Teacher Requests */}
          <div className="bg-white rounded-xl shadow-md border border-gray-100">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900">Pending Requests</h2>
              <AlertCircle className="w-5 h-5 text-orange-500" />
            </div>
            <div className="p-6">
              {pendingRequests.length === 0 ? (
                <div className="text-center py-8">
                  <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-2" />
                  <p className="text-sm text-gray-600">All caught up!</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {pendingRequests.map((request) => (
                    <div key={request._id} className="p-4 bg-orange-50 border border-orange-100 rounded-lg">
                      <div className="flex items-start justify-between mb-2">
                        <p className="font-semibold text-gray-900 text-sm">
                          {request.teacherId?.fullName || "Teacher"}
                        </p>
                        <span className="px-2 py-1 bg-orange-200 text-orange-800 rounded text-xs font-medium">
                          Pending
                        </span>
                      </div>
                      <div className="space-y-1 text-xs text-gray-600">
                        {request.requestedChanges?.grade && (
                          <p>Grade: <span className="font-medium">{request.requestedChanges.grade}</span></p>
                        )}
                        {request.requestedChanges?.subject && (
                          <p>Subject: <span className="font-medium">{request.requestedChanges.subject}</span></p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Recent Assignments */}
        <div className="bg-white rounded-xl shadow-md border border-gray-100">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-900">Recent Assignments</h2>
            <FileText className="w-5 h-5 text-gray-400" />
          </div>
          <div className="p-6">
            {recentAssignments.length === 0 ? (
              <p className="text-center text-gray-500 py-8">No assignments found</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {recentAssignments.map((assignment) => (
                  <div key={assignment._id} className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 hover:shadow-md transition-all">
                    <div className="flex items-start justify-between mb-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                        <FileText className="w-5 h-5 text-blue-600" />
                      </div>
                      <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs font-medium">
                        {assignment.grade}
                      </span>
                    </div>
                    <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">
                      {assignment.title}
                    </h3>
                    <div className="space-y-1 text-xs text-gray-600">
                      <p className="flex items-center gap-1">
                        <BookOpen className="w-3 h-3" />
                        {assignment.subject}
                      </p>
                      <p className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        Due: {formatDate(assignment.deadline)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl shadow-lg p-6 text-white">
          <h2 className="text-xl font-bold mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <button className="bg-white/20 backdrop-blur-sm hover:bg-white/30 rounded-lg p-4 transition-colors">
              <UserCheck className="w-6 h-6 mb-2 mx-auto" />
              <p className="text-sm font-medium">Approve Users</p>
            </button>
            <button className="bg-white/20 backdrop-blur-sm hover:bg-white/30 rounded-lg p-4 transition-colors">
              <FileText className="w-6 h-6 mb-2 mx-auto" />
              <p className="text-sm font-medium">Manage Assignments</p>
            </button>
            <button className="bg-white/20 backdrop-blur-sm hover:bg-white/30 rounded-lg p-4 transition-colors">
              <BookOpen className="w-6 h-6 mb-2 mx-auto" />
              <p className="text-sm font-medium">View Posts</p>
            </button>
            <button className="bg-white/20 backdrop-blur-sm hover:bg-white/30 rounded-lg p-4 transition-colors">
              <BarChart3 className="w-6 h-6 mb-2 mx-auto" />
              <p className="text-sm font-medium">Analytics</p>
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}