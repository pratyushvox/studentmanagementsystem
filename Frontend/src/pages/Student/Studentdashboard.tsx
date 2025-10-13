// src/pages/Student/Studentdashboard.tsx (REFACTORED)
import { useState } from "react";
import { Clock, Calendar, FileText, TrendingUp, BookOpen, Users, CheckCircle } from "lucide-react";
import Navbar from "../../components/Navbar";
import Sidebar from "../../components/Sidebar";
import StatsCard from "../../components/Cardstats";
import { LoadingSpinner, ErrorDisplay, EmptyState } from "../../components/Loadingerror";

// Import hooks and utilities
import { useApiGet } from "../../hooks/useApi";
import { formatDate, formatTimeAgo, getDaysRemaining } from "../../utils/dateHelpers";

export default function StudentDashboardPage() {
  const [activeItem, setActiveItem] = useState("dashboard");

  // Fetch all dashboard data using useApiGet
  const { 
    data: dashboardData, 
    loading: dashboardLoading, 
    error: dashboardError, 
    refetch: refetchDashboard 
  } = useApiGet('/student/dashboard', { autoFetch: true });

  const { 
    data: assignmentsData, 
    loading: assignmentsLoading 
  } = useApiGet('/student/assignments', { autoFetch: true });

  const { 
    data: submissionsData 
  } = useApiGet('/student/submissions', { autoFetch: true });

  // Derived state
  const dashboard = dashboardData?.dashboard;
  const assignments = assignmentsData?.assignments || [];
  const submissions = submissionsData?.submissions?.slice(0, 3) || [];

  // Filter pending assignments
  const pendingAssignments = assignments
    .filter((a: any) => !a.isSubmitted && !a.isOverdue)
    .slice(0, 3);

  const isLoading = dashboardLoading || assignmentsLoading;

  if (isLoading) {
    return <LoadingSpinner message="Loading dashboard..." />;
  }

  if (dashboardError) {
    return <ErrorDisplay error={dashboardError} onRetry={refetchDashboard} title="Error Loading Dashboard" />;
  }

  if (!dashboard) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <Sidebar activeItem={activeItem} onItemClick={setActiveItem} userRole="student" />
     
      <main className="lg:ml-64 p-6 lg:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mt-10">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
            <p className="text-gray-600 text-sm mt-1">
              Welcome back, {dashboard.student?.name}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Grade {dashboard.student?.grade} • {dashboard.student?.subjects?.join(", ")}
            </p>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Clock className="w-4 h-4" />
            <span>Last updated: Just now</span>
          </div>
        </div>

        {/* Stats Cards using StatsCard Component */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard
            title="Pending Tasks"
            count={dashboard.assignments?.pending || 0}
            subtitle="total assignments"
            icon={FileText}
            iconColor="text-orange-600"
            iconBg="bg-orange-50"
          />

          <StatsCard
            title="Submissions"
            count={dashboard.assignments?.submitted || 0}
            subtitle="graded"
            icon={CheckCircle}
            iconColor="text-green-600"
            iconBg="bg-green-50"
          />

          <StatsCard
            title="Average Grade"
            count={dashboard.performance?.averageGrade > 0 
              ? dashboard.performance?.averageGrade 
              : 0}
            subtitle="pending grades"
            icon={TrendingUp}
            iconColor="text-emerald-600"
            iconBg="bg-emerald-50"
          />

          <StatsCard
            title="Recent Activity"
            count={dashboard.recentActivity?.newPostsThisWeek || 0}
            subtitle="New posts this week"
            icon={BookOpen}
            iconColor="text-blue-600"
            iconBg="bg-blue-50"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* All Assignments */}
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
                  {assignments.slice(0, 5).map((assignment: any) => {
                    const status = assignment.isSubmitted 
                      ? 'Submitted' 
                      : assignment.isOverdue 
                      ? 'Overdue' 
                      : 'Pending';
                    
                    const statusColor = assignment.isSubmitted 
                      ? 'bg-green-50 text-green-700' 
                      : assignment.isOverdue 
                      ? 'bg-red-50 text-red-700' 
                      : 'bg-yellow-50 text-yellow-700';

                    return (
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
                                <span>{getDaysRemaining(assignment.deadline)}</span>
                              </div>
                              <span className={`text-xs px-2 py-0.5 rounded ${statusColor}`}>
                                {status}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Upcoming Assignments Sidebar */}
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
                    {pendingAssignments.map((assignment: any) => (
                      <div
                        key={assignment._id}
                        className="pb-4 border-b border-gray-100 last:border-0 last:pb-0"
                      >
                        <h3 className="font-medium text-gray-900 text-sm">
                          {assignment.title}
                        </h3>
                        <p className="text-xs text-gray-600 mt-1">{assignment.subject}</p>
                        <p className="text-xs text-gray-500 mt-2">
                          {getDaysRemaining(assignment.deadline)}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Recent Submissions */}
            <div className="bg-white border border-gray-200 rounded-lg">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Recent Submissions</h2>
              </div>
              <div className="p-6">
                {submissions.length === 0 ? (
                  <p className="text-sm text-gray-500 text-center py-4">No submissions yet</p>
                ) : (
                  <div className="space-y-4">
                    {submissions.map((submission: any) => (
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

        {/* Performance Summary */}
        <div className="bg-white border border-gray-200 rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Performance Summary</h2>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="text-center border border-gray-200 rounded-lg p-4">
                <div className="text-3xl font-bold text-gray-900">
                  {dashboard.performance?.totalSubmissions || 0}
                </div>
                <p className="text-sm text-gray-600 mt-2">Total Submissions</p>
              </div>
              <div className="text-center border border-gray-200 rounded-lg p-4">
                <div className="text-3xl font-bold text-green-600">
                  {dashboard.performance?.gradedSubmissions || 0}
                </div>
                <p className="text-sm text-gray-600 mt-2">Graded</p>
              </div>
              <div className="text-center border border-gray-200 rounded-lg p-4">
                <div className="text-3xl font-bold text-orange-600">
                  {dashboard.performance?.ungradedSubmissions || 0}
                </div>
                <p className="text-sm text-gray-600 mt-2">Pending Grades</p>
              </div>
              <div className="text-center border border-gray-200 rounded-lg p-4">
                <div className="text-3xl font-bold text-teal-600">
                  {dashboard.performance?.averageGrade > 0
                    ? `${dashboard.performance?.averageGrade}%`
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