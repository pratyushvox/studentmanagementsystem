import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  BookOpen, 
  BarChart3,
  ChevronDown,
  ChevronUp,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  TrendingUp,
  Filter,
  Download,
  User
} from 'lucide-react';
import { toast } from 'react-toastify';
import { useApiGet } from '../../hooks/useApi';
import Navbar from '../../components/Navbar';
import Sidebar from '../../components/Sidebar';
import StatsCard from '../../components/Cardstats';
import AttendanceTable from '../../components/AttendanceTable';
import { LoadingSpinner, ErrorDisplay, EmptyState } from '../../components/Loadingerror';
import { formatDate, formatMonthYear } from '../../utils/dateHelpers';

// Types
interface Subject {
  _id: string;
  code: string;
  name: string;
  credits: number;
}

interface AttendanceRecord {
  _id: string;
  date: string;
  subjectId: {
    _id: string;
    code: string;
    name: string;
  };
  teacher: string;
  status: 'present' | 'absent' | 'late' | 'excused';
  remarks?: string;
}

interface AttendanceSummary {
  subjectId: string;
  subjectCode: string;
  subjectName: string;
  credits: number;
  totalClasses: number;
  present: number;
  absent: number;
  late: number;
  excused: number;
  attendancePercentage: number;
  status: string;
}

interface StudentAttendanceData {
  student: {
    studentId: string;
    fullName: string;
    currentSemester: number;
    groupId: string;
    groupName: string;
    enrollmentYear: number;
    status: string;
  };
  subjects: Subject[];
  attendanceSummary: AttendanceSummary[];
  overallSummary: {
    totalClasses: number;
    present: number;
    absent: number;
    late: number;
    excused: number;
    attendancePercentage: number;
    status: string;
  };
}

const StudentAttendancePage = () => {
  const [selectedSubject, setSelectedSubject] = useState<string>('all');
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [viewMode, setViewMode] = useState<'summary' | 'detailed'>('summary');
  const [showFilters, setShowFilters] = useState(false);

  // Fetch student attendance summary
  const { 
    data: summaryResponse, 
    loading: summaryLoading, 
    error: summaryError,
    refetch: refetchSummary 
  } = useApiGet('/student/attendance/summary', { autoFetch: true });

  // Build the API URL for records
  const recordsUrl = viewMode === 'detailed' 
    ? `/student/attendance/records?subjectId=${selectedSubject}&month=${selectedMonth}&year=${selectedYear}`
    : null;

  // Fetch attendance records with filters - SIMPLIFIED
  const { 
    data: recordsResponse, 
    loading: recordsLoading,
    refetch: refetchRecords 
  } = useApiGet(recordsUrl, { 
    autoFetch: false // We'll control when to fetch manually
  });

  const attendanceData: StudentAttendanceData = summaryResponse?.data;
  const attendanceRecords: AttendanceRecord[] = recordsResponse?.data || [];

  // Load records when filters change or view mode changes
  useEffect(() => {
    if (viewMode === 'detailed') {
      refetchRecords();
    }
  }, [recordsUrl]); // Only depend on recordsUrl changes

  const getStatusColor = (status: string) => {
    const colors = {
      excellent: 'text-green-600 bg-green-50',
      good: 'text-blue-600 bg-blue-50',
      satisfactory: 'text-yellow-600 bg-yellow-50',
      poor: 'text-red-600 bg-red-50'
    };
    return colors[status as keyof typeof colors] || 'text-gray-600 bg-gray-50';
  };

  const getAttendanceStatusColor = (percentage: number) => {
    if (percentage >= 75) return 'text-green-600';
    if (percentage >= 65) return 'text-blue-600';
    if (percentage >= 50) return 'text-yellow-600';
    return 'text-red-600';
  };

  const handleExportAttendance = () => {
    // Implement export functionality
    toast.success('Attendance data exported successfully!');
  };

  // Handle view mode change
  const handleViewModeChange = (mode: 'summary' | 'detailed') => {
    setViewMode(mode);
  };

  if (summaryLoading) {
    return (
      <>
        <Navbar />
        <Sidebar userRole="student" activeItem="attendance" />
        <div className="ml-64 mt-16 min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
          <LoadingSpinner message="Loading your attendance data..." />
        </div>
      </>
    );
  }

  if (summaryError) {
    return (
      <>
        <Navbar />
        <Sidebar userRole="student" activeItem="attendance" />
        <div className="ml-64 mt-16 min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
          <ErrorDisplay 
            error={summaryError} 
            onRetry={refetchSummary} 
            title="Error Loading Attendance" 
          />
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <Sidebar userRole="student" activeItem="attendance" />
      
      <div className="ml-64 mt-16 min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header Section */}
          <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-800">My Attendance</h1>
                <p className="text-gray-600 mt-1">
                  Track your attendance across all subjects
                </p>
                {attendanceData && (
                  <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                    <span>Semester {attendanceData.student.currentSemester}</span>
                    <span>•</span>
                    <span>{attendanceData.student.groupName}</span>
                    <span>•</span>
                    <span>Enrolled {attendanceData.student.enrollmentYear}</span>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-4">
                <button
                  onClick={handleExportAttendance}
                  className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all flex items-center gap-2"
                >
                  <Download size={20} />
                  Export
                </button>
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all flex items-center gap-2"
                >
                  <Filter size={20} />
                  Filters
                  {showFilters ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>
              </div>
            </div>

            {/* Overall Stats */}
            {attendanceData && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                <StatsCard
                  title="Overall Attendance"
                  count={attendanceData.overallSummary.attendancePercentage}
                  subtitle="% of classes attended"
                  icon={TrendingUp}
                  iconColor={getAttendanceStatusColor(attendanceData.overallSummary.attendancePercentage)}
                  iconBg="bg-blue-50"
                />
                <StatsCard
                  title="Classes Attended"
                  count={attendanceData.overallSummary.present}
                  subtitle="out of total classes"
                  icon={CheckCircle}
                  iconColor="text-green-600"
                  iconBg="bg-green-50"
                />
                <StatsCard
                  title="Classes Missed"
                  count={attendanceData.overallSummary.absent}
                  subtitle="absent classes"
                  icon={XCircle}
                  iconColor="text-red-600"
                  iconBg="bg-red-50"
                />
                <StatsCard
                  title="Late Arrivals"
                  count={attendanceData.overallSummary.late}
                  subtitle="late marked classes"
                  icon={Clock}
                  iconColor="text-yellow-600"
                  iconBg="bg-yellow-50"
                />
              </div>
            )}
          </div>

          {/* View Mode Toggle */}
          <div className="bg-white rounded-xl shadow-lg p-4 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => handleViewModeChange('summary')}
                  className={`px-4 py-2 rounded-md transition-all ${
                    viewMode === 'summary' 
                      ? 'bg-white shadow-sm text-blue-600' 
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  <BarChart3 size={20} className="inline mr-2" />
                  Summary View
                </button>
                <button
                  onClick={() => handleViewModeChange('detailed')}
                  className={`px-4 py-2 rounded-md transition-all ${
                    viewMode === 'detailed' 
                      ? 'bg-white shadow-sm text-blue-600' 
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  <Calendar size={20} className="inline mr-2" />
                  Detailed View
                </button>
              </div>

              {/* Filters */}
              {showFilters && (
                <div className="flex items-center gap-4">
                  <select
                    value={selectedSubject}
                    onChange={(e) => setSelectedSubject(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  >
                    <option value="all">All Subjects</option>
                    {attendanceData?.subjects.map(subject => (
                      <option key={subject._id} value={subject._id}>
                        {subject.code} - {subject.name}
                      </option>
                    ))}
                  </select>

                  <select
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  >
                    {Array.from({ length: 12 }, (_, i) => (
                      <option key={i + 1} value={i + 1}>
                        {new Date(2000, i).toLocaleString('default', { month: 'long' })}
                      </option>
                    ))}
                  </select>

                  <select
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  >
                    {Array.from({ length: 5 }, (_, i) => {
                      const year = new Date().getFullYear() - 2 + i;
                      return (
                        <option key={year} value={year}>
                          {year}
                        </option>
                      );
                    })}
                  </select>
                </div>
              )}
            </div>
          </div>

          {/* Content based on view mode */}
          {viewMode === 'summary' ? (
            /* SUMMARY VIEW - Subject-wise Breakdown */
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center gap-2 mb-6">
                <BarChart3 size={24} className="text-gray-600" />
                <h2 className="text-xl font-semibold text-gray-800">Subject-wise Attendance</h2>
              </div>

              {attendanceData?.attendanceSummary.length === 0 ? (
                <EmptyState 
                  icon={BookOpen}
                  message="No attendance records found"
                  description="Your attendance records will appear here once classes start"
                />
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {attendanceData?.attendanceSummary.map((subject) => (
                    <div key={subject.subjectId} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h3 className="font-semibold text-gray-800">{subject.subjectCode}</h3>
                          <p className="text-sm text-gray-600">{subject.subjectName}</p>
                        </div>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(subject.status)}`}>
                          {subject.status}
                        </span>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Attendance:</span>
                          <span className={`font-semibold ${getAttendanceStatusColor(subject.attendancePercentage)}`}>
                            {subject.attendancePercentage}%
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Classes:</span>
                          <span>{subject.present}/{subject.totalClasses}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Credits:</span>
                          <span>{subject.credits}</span>
                        </div>
                      </div>

                      {/* Progress bar */}
                      <div className="mt-3">
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full ${
                              subject.attendancePercentage >= 75 ? 'bg-green-500' :
                              subject.attendancePercentage >= 65 ? 'bg-blue-500' :
                              subject.attendancePercentage >= 50 ? 'bg-yellow-500' : 'bg-red-500'
                            }`}
                            style={{ width: `${Math.min(subject.attendancePercentage, 100)}%` }}
                          ></div>
                        </div>
                      </div>

                      <button
                        onClick={() => {
                          setSelectedSubject(subject.subjectId);
                          handleViewModeChange('detailed');
                        }}
                        className="w-full mt-3 px-3 py-1.5 text-sm bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-all"
                      >
                        View Details
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            /* DETAILED VIEW - Attendance Records */
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <Calendar size={24} className="text-gray-600" />
                  <div>
                    <h2 className="text-xl font-semibold text-gray-800">Attendance Records</h2>
                    {selectedSubject !== 'all' && attendanceData && (
                      <p className="text-sm text-gray-600">
                        {attendanceData.attendanceSummary.find(s => s.subjectId === selectedSubject)?.subjectCode} - 
                        {attendanceData.attendanceSummary.find(s => s.subjectId === selectedSubject)?.subjectName}
                      </p>
                    )}
                  </div>
                </div>
                <div className="text-sm text-gray-500">
                  Showing {attendanceRecords.length} records
                </div>
              </div>

              {recordsLoading ? (
                <div className="flex justify-center py-8">
                  <LoadingSpinner message="Loading attendance records..." />
                </div>
              ) : attendanceRecords.length === 0 ? (
                <EmptyState 
                  icon={Calendar}
                  message="No attendance records found"
                  description="No records match your current filters"
                />
              ) : (
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Date
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Subject
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Teacher
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Remarks
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {attendanceRecords.map((record) => {
                        const StatusIcon = 
                          record.status === 'present' ? CheckCircle :
                          record.status === 'absent' ? XCircle :
                          record.status === 'late' ? Clock : CheckCircle;
                        
                        const statusColor = 
                          record.status === 'present' ? 'bg-green-100 text-green-800 border-green-200' :
                          record.status === 'absent' ? 'bg-red-100 text-red-800 border-red-200' :
                          record.status === 'late' ? 'bg-yellow-100 text-yellow-800 border-yellow-200' :
                          'bg-blue-100 text-blue-800 border-blue-200';

                        return (
                          <tr key={record._id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-900">
                                {formatDate(record.date)}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">{record.subjectId.code}</div>
                              <div className="text-xs text-gray-500">{record.subjectId.name}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-600">{record.teacher}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span
                                className={`px-3 py-1.5 text-sm font-medium rounded-full border ${statusColor} flex items-center gap-2 w-fit`}
                              >
                                <StatusIcon size={14} />
                                {record.status.charAt(0).toUpperCase() + record.status.slice(1)}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <div className="text-sm text-gray-600">
                                {record.remarks || 'No remarks'}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default StudentAttendancePage;