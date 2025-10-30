// src/pages/teacher/TeacherDashboard.jsx
import React, { useState } from 'react';
import {
  BookOpen,
  FileText,
  ClipboardList,
  CheckCircle,
  Bell,
  ArrowRight,
  Activity,
  Crown,
  Award
} from 'lucide-react';

import SubjectCardSimple from '../../components/subjectBlock';
import { NoticeCardCompact } from '../../components/Notice';
import StatsCard from '../../components/Cardstats';
import { ActivityCard } from '../../components/Activitycard';
import Navbar from '../../components/Navbar';
import Sidebar from '../../components/Sidebar';
import { useApiGet } from '../../hooks/useApi';
import { formatTimeAgo } from '../../utils/dateHelpers';
import { LoadingSpinner, ErrorDisplay, EmptyState } from '../../components/Loadingerror';

const TeacherDashboard = () => {
  const [activeItem, setActiveItem] = useState('dashboard');

  // Fetch dashboard data
  const { 
    data: dashboardData, 
    loading: dashboardLoading, 
    error: dashboardError,
    refetch: refetchDashboard 
  } = useApiGet('/teacher/dashboard', { autoFetch: true });

  // Fetch recent activities
  const { 
    data: activitiesData, 
    loading: activitiesLoading 
  } = useApiGet('/teacher/analytics/recent-activity?limit=5', { autoFetch: true });

  // Fetch notices
  const { 
    data: noticesData, 
    loading: noticesLoading 
  } = useApiGet('/teacher/notices?limit=3', { autoFetch: true });

  const loading = dashboardLoading || activitiesLoading || noticesLoading;

  // Extract data safely
  const dashboard = dashboardData?.dashboard || {};
  const teacher = dashboard?.teacher || {};
  const assignmentsStats = dashboard?.assignments || {};
  const submissionsStats = dashboard?.submissions || {};
  const postsStats = dashboard?.posts || {};
  const assignedSubjects = teacher?.assignedSubjects || [];
  const moduleLeaderSubjects = teacher?.moduleLeaderSubjects || [];
  const isModuleLeader = teacher?.isModuleLeader || false;
  const activities = activitiesData?.activities || [];
  const notices = noticesData?.data || [];

  // Show loading spinner
  if (loading) {
    return <LoadingSpinner message="Loading dashboard..." />;
  }

  // Show error display
  if (dashboardError) {
    return (
      <ErrorDisplay 
        error={dashboardError}
        title="Error Loading Dashboard"
        onRetry={refetchDashboard}
      />
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Navbar - always full width at top */}
      <div className="fixed top-0 left-0 right-0 z-40">
        <Navbar />
      </div>

      {/* Layout below navbar */}
      <div className="flex flex-1 pt-16">
        {/* Sidebar (fixed height, starts below navbar) */}
        <div className="w-64 fixed top-16 left-0 bottom-0 z-30">
          <Sidebar
            activeItem={activeItem}
            onItemClick={setActiveItem}
            userRole="teacher"
          />
        </div>

        {/* Main content area */}
        <main className="flex-1 ml-64 p-6 overflow-y-auto">
          {/* Header */}
          <div className="mb-6">
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold text-gray-900">
                Welcome Back, {teacher.name || 'Teacher'} 👋
              </h1>
              {isModuleLeader && (
                <div className="flex items-center gap-1 px-3 py-1 bg-gradient-to-r from-amber-100 to-yellow-100 border-2 border-amber-300 rounded-full">
                  <Crown className="w-4 h-4 text-amber-600" />
                  <span className="text-xs font-semibold text-amber-700">Module Leader</span>
                </div>
              )}
            </div>
            <p className="text-gray-600 mt-1">
              {teacher.department && `${teacher.department} • `}
              Teacher ID: {teacher.teacherId || 'N/A'}
            </p>
          </div>

          {/* Stats Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <StatsCard
              title="Total Assignments"
              count={assignmentsStats.total || 0}
              subtitle={`${assignmentsStats.active || 0} active assignments`}
              icon={FileText}
              iconColor="text-indigo-600"
              iconBg="bg-indigo-100"
            />
            <StatsCard
              title="Total Submissions"
              count={submissionsStats.total || 0}
              subtitle={`${submissionsStats.ungraded || 0} pending review`}
              icon={ClipboardList}
              iconColor="text-purple-600"
              iconBg="bg-purple-100"
            />
            <StatsCard
              title="Graded Submissions"
              count={submissionsStats.graded || 0}
              subtitle={
                submissionsStats.total > 0
                  ? `${Math.round((submissionsStats.graded / submissionsStats.total) * 100)}% completion rate`
                  : '0% completion rate'
              }
              icon={CheckCircle}
              iconColor="text-green-600"
              iconBg="bg-green-100"
            />
            <StatsCard
              title="Learning Materials"
              count={postsStats.total || 0}
              subtitle="Posts this semester"
              icon={BookOpen}
              iconColor="text-orange-600"
              iconBg="bg-orange-100"
            />
          </div>

          {/* Module Leader Section - Compact Version */}
          {isModuleLeader && moduleLeaderSubjects.length > 0 && (
            <div className="mb-6 bg-gradient-to-r from-amber-50 to-yellow-50 rounded-lg border border-amber-200 p-4">
              <div className="flex items-center gap-2 mb-3">
                <Crown className="w-5 h-5 text-amber-600" />
                <h2 className="text-lg font-semibold text-gray-900">Module Leadership</h2>
              </div>
              
              <div className="flex flex-wrap gap-3">
                {moduleLeaderSubjects.map((subject) => (
                  <div 
                    key={subject._id} 
                    className="inline-flex items-center gap-2 bg-white rounded-lg px-3 py-2 border border-amber-200 hover:border-amber-300 hover:shadow-sm transition-all cursor-pointer"
                  >
                    <Award className="w-4 h-4 text-amber-600" />
                    <div>
                      <p className="font-medium text-gray-900 text-sm">{subject.name}</p>
                      <p className="text-xs text-gray-500">{subject.code}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Main Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Section */}
            <div className="lg:col-span-2 space-y-6">
              {/* Recent Activities */}
              <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                    <Activity className="w-5 h-5 text-indigo-600" />
                    Recent Activities
                  </h2>
                  <button className="text-indigo-600 hover:text-indigo-700 text-sm font-medium flex items-center gap-1 group">
                    View All
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>
                <div className="space-y-3">
                  {activities.length > 0 ? (
                    activities.map((activity) => (
                      <ActivityCard
                        key={activity.id}
                        activity={{
                          id: activity.id,
                          type: activity.type,
                          title: activity.title,
                          description: activity.description,
                          time: formatTimeAgo(activity.time),
                          status: activity.status
                        }}
                      />
                    ))
                  ) : (
                    <EmptyState 
                      icon={Activity}
                      message="No recent activities"
                      description="Activities will appear here as students submit assignments"
                    />
                  )}
                </div>
              </div>

              {/* Subjects */}
              <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-indigo-600" />
                  Teaching Assignments
                </h2>
                <div className="space-y-4">
                  {assignedSubjects.length > 0 ? (
                    assignedSubjects.map((subject, index) => (
                      <SubjectCardSimple
                        key={subject.subjectId?._id || index}
                        subject={{
                          subjectId: {
                            _id: subject.subjectId?._id || '',
                            name: subject.subjectId?.name || 'Unknown Subject',
                            code: subject.subjectId?.code || 'N/A'
                          },
                          groups: subject.groups || [],
                          semester: subject.semester
                        }}
                      />
                    ))
                  ) : (
                    <EmptyState 
                      icon={BookOpen}
                      message="No subjects assigned yet"
                      description="Contact admin to assign subjects and groups"
                    />
                  )}
                </div>
              </div>
            </div>

            {/* Right Section */}
            <div>
              <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                    <Bell className="w-5 h-5 text-indigo-600" />
                    Notice Board
                  </h2>
                  <button className="text-indigo-600 hover:text-indigo-700 text-sm font-medium flex items-center gap-1 group">
                    See All
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>
                <div className="space-y-4">
                  {notices.length > 0 ? (
                    notices.map((notice) => (
                      <NoticeCardCompact
                        key={notice._id}
                        notice={{
                          _id: notice._id,
                          title: notice.title,
                          content: notice.content,
                          priority: notice.priority,
                          targetAudience: notice.targetAudience,
                          isActive: notice.isActive,
                          createdAt: notice.createdAt
                        }}
                      />
                    ))
                  ) : (
                    <EmptyState 
                      icon={Bell}
                      message="No notices available"
                      description="Check back later for updates"
                    />
                  )}
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default TeacherDashboard;