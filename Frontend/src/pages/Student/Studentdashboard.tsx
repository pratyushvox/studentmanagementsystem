import { useState, useEffect } from "react";
import { Clock, Calendar, FileText, TrendingUp, Award, BarChart3, BookOpen, Users, Target, AlertCircle, CheckCircle } from "lucide-react";
import Navbar from "../../components/Navbar";
import Sidebar from "../../components/Sidebar";
import { LoadingSpinner, ErrorDisplay, EmptyState } from "../../components/LoadingError";

// API Base URL - Matches your backend configuration
const API_BASE_URL = "http://localhost:5000/api";

export default function StudentDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dashboardData, setDashboardData] = useState(null);
  const [assignments, setAssignments] = useState([]);
  const [recentSubmissions, setRecentSubmissions] = useState([]);
  const [activeItem, setActiveItem] = useState("dashboard");

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");

      // Fetch dashboard summary
      const dashboardRes = await fetch(`${API_BASE_URL}/student/dashboard`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const dashboardJson = await dashboardRes.json();

      // Fetch assignments
      const assignmentsRes = await fetch(`${API_BASE_URL}/student/assignments`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const assignmentsJson = await assignmentsRes.json();

      // Fetch submissions
      const submissionsRes = await fetch(`${API_BASE_URL}/student/submissions`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const submissionsJson = await submissionsRes.json();

      setDashboardData(dashboardJson.dashboard);
      setAssignments(assignmentsJson.assignments || []);
      setRecentSubmissions(submissionsJson.submissions?.slice(0, 3) || []);
      setError(null);
    } catch (err) {
      setError(err.message);
      console.error("Error fetching dashboard data:", err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (assignment) => {
    if (assignment.isSubmitted) return "bg-green-50 text-green-700";
    if (assignment.isOverdue) return "bg-red-50 text-red-700";
    return "bg-yellow-50 text-yellow-700";
  };

  const getStatusText = (assignment) => {
    if (assignment.isSubmitted) return "Submitted";
    if (assignment.isOverdue) return "Overdue";
    return "Pending";
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = date - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return "Overdue";
    if (diffDays === 0) return "Due today";
    if (diffDays === 1) return "Due tomorrow";
    if (diffDays <= 7) return `Due in ${diffDays} days`;
    return date.toLocaleDateString();
  };

  const formatTimeAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = now - date;
    const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffHours < 1) return "Just now";
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return "1d ago";
    return `${diffDays}d ago`;
  };

  if (loading) {
    return <LoadingSpinner message="Loading dashboard..." />;
  }

  if (error) {
    return <ErrorDisplay error={error} onRetry={fetchDashboardData} title="Error Loading Dashboard" />;
  }

  if (!dashboardData) return null;

  const pendingAssignments = assignments.filter(a => !a.isSubmitted && !a.isOverdue).slice(0, 3);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar onProfileClick={function (): void {
              throw new Error("Function not implemented.");
          } } />

      <Sidebar activeItem={activeItem} onItemClick={setActiveItem} userRole="student" />
     
      <main className="lg:ml-64 p-6 lg:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mt-10">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
            <p className="text-gray-600 text-sm mt-1">
              Welcome back, {dashboardData.student.name}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Grade {dashboardData.student.grade} • {dashboardData.student.subjects?.join(", ")}
            </p>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Clock className="w-4 h-4" />
            <span>Last updated: Just now</span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white border border-gray-200 rounded-lg p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">Pending Tasks</p>
                <p className="text-2xl font-semibold text-gray-900 mt-2">
                  {dashboardData.assignments.pending}
                </p>
                <p className="text-xs text-orange-600 mt-1">
                  {dashboardData.assignments.total} total assignments
                </p>
              </div>
              <div className="w-10 h-10 bg-orange-50 rounded-lg flex items-center justify-center">
                <FileText className="w-5 h-5 text-orange-600" />
              </div>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">Submissions</p>
                <p className="text-2xl font-semibold text-gray-900 mt-2">
                  {dashboardData.assignments.submitted}
                </p>
                <p className="text-xs text-green-600 mt-1">
                  {dashboardData.performance.gradedSubmissions} graded
                </p>
              </div>
              <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">Average Grade</p>
                <p className="text-2xl font-semibold text-gray-900 mt-2">
                  {dashboardData.performance.averageGrade > 0 
                    ? `${dashboardData.performance.averageGrade}%` 
                    : "N/A"}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {dashboardData.performance.ungradedSubmissions} pending grades
                </p>
              </div>
              <div className="w-10 h-10 bg-emerald-50 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-emerald-600" />
              </div>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">Recent Activity</p>
                <p className="text-2xl font-semibold text-gray-900 mt-2">
                  {dashboardData.recentActivity.newPostsThisWeek}
                </p>
                <p className="text-xs text-gray-500 mt-1">New posts this week</p>
              </div>
              <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-blue-600" />
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white border border-gray-200 rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">All Assignments</h2>
            </div>
            <div className="p-6">
              {assignments.length === 0 ? (
                <EmptyState 
                  icon={FileText} 
                  message="No assignments yet"
                  description="New assignments will appear here"
                />
              ) : (
                <div className="space-y-4">
                  {assignments.slice(0, 5).map((assignment) => (
                    <div
                      key={assignment._id}
                      className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900 text-sm">
                            {assignment.title}
                          </h3>
                          <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                            {assignment.description}
                          </p>
                          <div className="flex items-center gap-3 mt-2">
                            <div className="flex items-center gap-1 text-xs text-gray-500">
                              <BookOpen className="w-3 h-3" />
                              <span>{assignment.subject}</span>
                            </div>
                            <div className="flex items-center gap-1 text-xs text-gray-500">
                              <Calendar className="w-3 h-3" />
                              <span>{formatDate(assignment.deadline)}</span>
                            </div>
                            <span className={`text-xs px-2 py-0.5 rounded ${getStatusColor(assignment)}`}>
                              {getStatusText(assignment)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white border border-gray-200 rounded-lg">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Upcoming Assignments</h2>
              </div>
              <div className="p-6">
                {pendingAssignments.length === 0 ? (
                  <p className="text-sm text-gray-500 text-center py-4">No pending assignments</p>
                ) : (
                  <div className="space-y-4">
                    {pendingAssignments.map((assignment) => (
                      <div
                        key={assignment._id}
                        className="pb-4 border-b border-gray-100 last:border-0 last:pb-0"
                      >
                        <h3 className="font-medium text-gray-900 text-sm">
                          {assignment.title}
                        </h3>
                        <p className="text-xs text-gray-600 mt-1">{assignment.subject}</p>
                        <p className="text-xs text-gray-500 mt-2">
                          {formatDate(assignment.deadline)}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Recent Submissions</h2>
              </div>
              <div className="p-6">
                {recentSubmissions.length === 0 ? (
                  <p className="text-sm text-gray-500 text-center py-4">No submissions yet</p>
                ) : (
                  <div className="space-y-4">
                    {recentSubmissions.map((submission) => (
                      <div
                        key={submission._id}
                        className="pb-4 border-b border-gray-100 last:border-0 last:pb-0"
                      >
                        <p className="font-medium text-gray-900 text-sm">
                          {submission.grade !== null && submission.grade !== undefined
                            ? `Grade: ${submission.grade}%`
                            : "Pending Grade"}
                        </p>
                        <p className="text-xs text-gray-600 mt-1">
                          {submission.assignmentId?.title || "Assignment"}
                        </p>
                        <p className="text-xs text-gray-500 mt-2">
                          {formatTimeAgo(submission.createdAt)}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Performance Summary</h2>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="text-center border border-gray-200 rounded-lg p-4">
                <div className="text-3xl font-bold text-gray-900">
                  {dashboardData.performance.totalSubmissions}
                </div>
                <p className="text-sm text-gray-600 mt-2">Total Submissions</p>
              </div>
              <div className="text-center border border-gray-200 rounded-lg p-4">
                <div className="text-3xl font-bold text-green-600">
                  {dashboardData.performance.gradedSubmissions}
                </div>
                <p className="text-sm text-gray-600 mt-2">Graded</p>
              </div>
              <div className="text-center border border-gray-200 rounded-lg p-4">
                <div className="text-3xl font-bold text-orange-600">
                  {dashboardData.performance.ungradedSubmissions}
                </div>
                <p className="text-sm text-gray-600 mt-2">Pending Grades</p>
              </div>
              <div className="text-center border border-gray-200 rounded-lg p-4">
                <div className="text-3xl font-bold text-teal-600">
                  {dashboardData.performance.averageGrade > 0
                    ? `${dashboardData.performance.averageGrade}%`
                    : "N/A"}
                </div>
                <p className="text-sm text-gray-600 mt-2">Average Grade</p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}