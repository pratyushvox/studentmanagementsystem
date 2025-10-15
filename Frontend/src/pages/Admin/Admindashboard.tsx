// src/pages/Admin/Admindashboard.tsx (REFACTORED)
import { useState } from "react";
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
  BookMarked,
  UsersRound,
  UserX,
  Mail
} from "lucide-react";
import Navbar from "../../components/Navbar";
import Sidebar from "../../components/Sidebar";
import StatsCard from "../../components/Cardstats";
import ConfirmDialog from "../../components/Confirmationdialogue";
import { LoadingSpinner, ErrorDisplay } from "../../components/Loadingerror";
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import NoticeBoard from "../../components/Notice";

// Import the hooks and utilities
import { useApiGet, useApiPatch, useApiDelete } from "../../hooks/useApi";
import { formatDate } from "../../utils/dateHelpers";

export default function AdminDashboard() {
  const [activeItem, setActiveItem] = useState("dashboard");
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    type: 'info' as 'danger' | 'warning' | 'info',
    title: '',
    message: '',
    onConfirm: () => {}
  });

  // Fetch all data using useApiGet hook
  const { 
    data: stats, 
    loading: statsLoading, 
    error: statsError, 
    refetch: refetchStats 
  } = useApiGet('/admin/dashboard', { autoFetch: true });

  const { 
    data: assignmentsData, 
    loading: assignmentsLoading 
  } = useApiGet('/admin/assignments', { autoFetch: true });

  const { 
    data: semesterData, 
    loading: semesterLoading 
  } = useApiGet('/admin/semester-stats', { autoFetch: true });

  const { 
    data: usersData 
  } = useApiGet('/admin/users', { autoFetch: true });

  // API mutation hooks
  const { patch: approvePatch } = useApiPatch({
    onSuccess: () => {
      toast.success("Student approved successfully!");
      refetchStats();
    },
    onError: (error) => {
      toast.error(`Failed to approve: ${error}`);
    }
  });

  const { delete: removeStudent } = useApiDelete({
    onSuccess: () => {
      toast.success("Student rejected and removed.");
      refetchStats();
    },
    onError: (error) => {
      toast.error(`Failed to reject: ${error}`);
    }
  });

  // Derived state
  const recentAssignments = assignmentsData?.slice(0, 6) || [];
  const semesterStats = semesterData || [];
  
  // Filter pending students
  const pendingStudents = usersData?.filter((user: any) => 
    user.role === 'student' && !user.isApproved
  ) || [];

  // Handle approve student
  const handleApproveStudent = async (studentId: string, studentName: string) => {
    setConfirmDialog({
      isOpen: true,
      type: 'info',
      title: 'Approve Student',
      message: `Are you sure you want to approve <strong>${studentName}</strong>?<br/>They will be able to access the platform.`,
      onConfirm: async () => {
        await approvePatch(`/admin/users/${studentId}/approve`);
      }
    });
  };

  // Handle reject student
  const handleRejectStudent = async (studentId: string, studentName: string) => {
    setConfirmDialog({
      isOpen: true,
      type: 'danger',
      title: 'Reject Student',
      message: `Are you sure you want to reject <strong>${studentName}</strong>?<br/>Their account will be deleted.`,
      onConfirm: async () => {
        await removeStudent(`/admin/users/${studentId}`);
      }
    });
  };

  const getRoleBadgeColor = (role: string) => {
    switch(role) {
      case 'admin': return 'bg-purple-100 text-purple-700';
      case 'teacher': return 'bg-blue-100 text-blue-700';
      case 'student': return 'bg-green-100 text-green-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getApprovalBadge = (isApproved: boolean) => {
    return isApproved 
      ? <span className="flex items-center gap-1 text-xs text-green-600"><CheckCircle className="w-3 h-3" /> Approved</span>
      : <span className="flex items-center gap-1 text-xs text-orange-600"><Clock className="w-3 h-3" /> Pending</span>;
  };

  // Loading state
  const isLoading = statsLoading || assignmentsLoading || semesterLoading;

  if (isLoading) {
    return <LoadingSpinner message="Loading admin dashboard..." />;
  }

  if (statsError) {
    return <ErrorDisplay error={statsError} onRetry={refetchStats} title="Error Loading Dashboard" />;
  }

  if (!stats) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <Sidebar activeItem={activeItem} onItemClick={setActiveItem} userRole="admin" />
     
      <main className="lg:ml-64 p-6 lg:p-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mt-10">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Admin Dashboard</h1>
            <p className="text-gray-600 text-sm mt-1">
              Manage your educational platform - Semester System
            </p>
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
            <p className="text-3xl font-bold">{stats?.totalStudents || 0}</p>
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
            <p className="text-3xl font-bold">{stats?.totalTeachers || 0}</p>
            <p className="text-xs opacity-80 mt-2">Educators on platform</p>
          </div>

          {/* Total Subjects */}
          <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl shadow-lg p-6 text-white transform hover:scale-105 transition-transform">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center backdrop-blur-sm">
                <BookMarked className="w-6 h-6" />
              </div>
              <PieChart className="w-5 h-5 opacity-80" />
            </div>
            <h3 className="text-sm font-medium opacity-90 mb-1">Total Subjects</h3>
            <p className="text-3xl font-bold">{stats?.totalSubjects || 0}</p>
            <p className="text-xs opacity-80 mt-2">Across all semesters</p>
          </div>

          {/* Total Groups */}
          <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl shadow-lg p-6 text-white transform hover:scale-105 transition-transform">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center backdrop-blur-sm">
                <UsersRound className="w-6 h-6" />
              </div>
              <AlertCircle className="w-5 h-5 opacity-80" />
            </div>
            <h3 className="text-sm font-medium opacity-90 mb-1">Total Groups</h3>
            <p className="text-3xl font-bold">{stats?.totalGroups || 0}</p>
            <p className="text-xs opacity-80 mt-2">Student groups</p>
          </div>
        </div>

       
       

        {/* Pending Student Approvals */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl shadow-md border border-gray-100">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-gray-900">Pending Approvals</h2>
                {pendingStudents.length > 0 && (
                  <span className="bg-orange-100 text-orange-700 text-xs font-semibold px-2 py-1 rounded-full">
                    {pendingStudents.length}
                  </span>
                )}
              </div>
              <Clock className="w-5 h-5 text-orange-500" />
            </div>
            <div className="p-6 max-h-96 overflow-y-auto">
              {pendingStudents.length === 0 ? (
                <div className="text-center py-8">
                  <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-2" />
                  <p className="text-sm text-gray-600 font-medium">All caught up!</p>
                  <p className="text-xs text-gray-500 mt-1">No pending student approvals</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {pendingStudents.slice(0, 5).map((student: any) => (
                    <div key={student._id} className="border border-orange-100 bg-orange-50 rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-orange-400 to-orange-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                            {student.fullName?.charAt(0).toUpperCase() || 'S'}
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900">{student.fullName}</p>
                            <p className="text-xs text-gray-600 flex items-center gap-1">
                              <Mail className="w-3 h-3" />
                              {student.email}
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleApproveStudent(student._id, student.fullName)}
                          className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
                        >
                          <UserCheck className="w-4 h-4" />
                          Approve
                        </button>
                        <button
                          onClick={() => handleRejectStudent(student._id, student.fullName)}
                          className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
                        >
                          <UserX className="w-4 h-4" />
                          Reject
                        </button>
                      </div>
                    </div>
                  ))}
                  {pendingStudents.length > 5 && (
                    <button 
                      onClick={() => window.location.href = '/admin/users'}
                      className="w-full text-center text-sm text-blue-600 hover:text-blue-700 font-medium py-2"
                    >
                      View all {pendingStudents.length} pending requests →
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-white rounded-xl shadow-md border border-gray-100">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900">System Activity</h2>
              <Activity className="w-5 h-5 text-blue-500" />
            </div>
            <div className="p-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Users className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">Total Users</p>
                      <p className="text-xs text-gray-600">Students + Teachers</p>
                    </div>
                  </div>
                  <p className="text-2xl font-bold text-blue-600">
                    {(stats?.totalStudents || 0) + (stats?.totalTeachers || 0)}
                  </p>
                </div>

                <div className="flex items-center justify-between p-4 bg-purple-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                      <BarChart3 className="w-5 h-5 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">Active Semesters</p>
                      <p className="text-xs text-gray-600">With students enrolled</p>
                    </div>
                  </div>
                  <p className="text-2xl font-bold text-purple-600">
                    {semesterStats.filter((s: any) => s.totalStudents > 0).length}
                  </p>
                </div>

                <div className="flex items-center justify-between p-4 bg-emerald-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                      <GraduationCap className="w-5 h-5 text-emerald-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">Teaching Staff</p>
                      <p className="text-xs text-gray-600">Active educators</p>
                    </div>
                  </div>
                  <p className="text-2xl font-bold text-emerald-600">
                    {stats?.totalTeachers || 0}
                  </p>
                </div>

                <div className="flex items-center justify-between p-4 bg-orange-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                      <UsersRound className="w-5 h-5 text-orange-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">Student Groups</p>
                      <p className="text-xs text-gray-600">Across all semesters</p>
                    </div>
                  </div>
                  <p className="text-2xl font-bold text-orange-600">
                    {stats?.totalGroups || 0}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Semester Statistics */}
        <div className="bg-white rounded-xl shadow-md border border-gray-100">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-900">Semester Overview</h2>
            <BarChart3 className="w-5 h-5 text-gray-400" />
          </div>
          <div className="p-6">
            {semesterStats.length === 0 ? (
              <p className="text-center text-gray-500 py-8">No semester data available</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {semesterStats.map((sem: any) => (
                  <div key={sem.semester} className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 hover:shadow-md transition-all">
                    <div className="flex items-center justify-between mb-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                        <span className="text-lg font-bold text-blue-600">{sem.semester}</span>
                      </div>
                      <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs font-medium">
                        Semester {sem.semester}
                      </span>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-gray-600">Students:</span>
                        <span className="text-sm font-semibold text-gray-900">{sem.totalStudents}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-gray-600">Active:</span>
                        <span className="text-sm font-semibold text-green-600">{sem.activeStudents}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-gray-600">Groups:</span>
                        <span className="text-sm font-semibold text-purple-600">{sem.groups}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
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
                {recentAssignments.map((assignment: any) => (
                  <div key={assignment._id} className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 hover:shadow-md transition-all">
                    <div className="flex items-start justify-between mb-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                        <FileText className="w-5 h-5 text-blue-600" />
                      </div>
                      <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs font-medium">
                        Sem {assignment.semester || assignment.grade}
                      </span>
                    </div>
                    <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">
                      {assignment.title}
                    </h3>
                    <div className="space-y-1 text-xs text-gray-600">
                      <p className="flex items-center gap-1">
                        <BookOpen className="w-3 h-3" />
                        {assignment.type ? `Type: ${assignment.type}` : assignment.subject}
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
       <div className="bg-white rounded-xl shadow-md border border-gray-100 mt-10">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-900">
              Notice Board Management
            </h2>
          </div>
          <div className="p-6">
            {/* Integrate the NoticeBoard directly */}
            <NoticeBoard userRole="admin" />
          </div>
        </div>
      </main>

      {/* Confirm Dialog */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        onClose={() => setConfirmDialog({...confirmDialog, isOpen: false})}
        onConfirm={confirmDialog.onConfirm}
        title={confirmDialog.title}
        message={confirmDialog.message}
        type={confirmDialog.type}
        confirmText={confirmDialog.type === 'danger' ? 'Reject' : 'Approve'}
      />
    </div>
  );
}