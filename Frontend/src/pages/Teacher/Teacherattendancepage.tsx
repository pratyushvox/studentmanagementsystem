import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  Users, 
  BookOpen, 
  BarChart3,
  ChevronDown,
  ChevronUp,
  CheckCircle,
  XCircle,
  Clock
} from 'lucide-react';
import { toast } from 'react-toastify';
import { useApiGet, useApiPost } from '../../hooks/useApi';
import Navbar from '../../components/Navbar';
import Sidebar from '../../components/Sidebar';
import StatsCard from '../../components/Cardstats';
import { LoadingSpinner, ErrorDisplay, EmptyState } from '../../components/Loadingerror';
import AttendanceTable from '../../components/Attendancetable';
import { formatDate, formatTimeAgo } from '../../utils/dateHelpers';

// Types
interface Subject {
  _id: string;
  code: string;
  name: string;
  credits?: number;
}

interface Group {
  _id: string;
  name: string;
  semester: number;
}

interface Student {
  _id: string;
  studentId: string;
  fullName: string;
  email: string;
  currentSemester: number;
  enrollmentYear: number;
  status: string;
  phoneNumber?: string;
  dateOfBirth?: string;
}

interface AssignedSubject {
  subjectId: Subject;
  semester: number;
  groups: Group[];
  _id: string;
}

interface TeacherDashboard {
  teacher: {
    name: string;
    teacherId: string;
    department: string;
    isModuleLeader: boolean;
    moduleLeaderSubjects: Subject[];
    assignedSubjects: AssignedSubject[];
  };
  assignments: {
    total: number;
    active: number;
    expired: number;
  };
  posts: {
    total: number;
  };
  submissions: {
    total: number;
    graded: number;
    ungraded: number;
  };
}

interface AttendanceRecord {
  studentId: string;
  status: 'present' | 'absent' | 'late' | 'excused';
  remarks?: string;
}

interface AttendanceData {
  date: string;
  subjectId: string;
  groupId: string;
  attendanceRecords: AttendanceRecord[];
}

interface ExistingAttendance {
  _id: string;
  date: string;
  attendanceRecords: Array<{
    studentId: {
      _id: string;
      studentId: string;
      userId: {
        fullName: string;
      };
    };
    status: 'present' | 'absent' | 'late' | 'excused';
    remarks?: string;
  }>;
  totalPresent: number;
  totalAbsent: number;
  totalLate: number;
  totalStudents: number;
  isSubmitted: boolean;
  submittedAt?: string;
}

const TeacherAttendancePage = () => {
  const [activeItem, setActiveItem] = useState('attendance');
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [selectedGroup, setSelectedGroup] = useState<string>('');
  const [selectedSubject, setSelectedSubject] = useState<string>('');
  const [attendanceRecords, setAttendanceRecords] = useState<Record<string, AttendanceRecord>>({});
  const [showHistory, setShowHistory] = useState(false);
  const [historyFilters, setHistoryFilters] = useState({
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear()
  });

  // Fetch dashboard data which includes assigned subjects and groups
  const { 
    data: dashboardResponse, 
    loading: dashboardLoading, 
    error: dashboardError,
    refetch: refetchDashboard 
  } = useApiGet('/teacher/dashboard', { autoFetch: true });

  // Fetch students using the correct teacher route
  const { 
    data: studentsResponse, 
    loading: studentsLoading,
    error: studentsError,
    refetch: refetchStudents 
  } = useApiGet(
    selectedGroup && selectedSubject 
      ? `/teacher/groups/${selectedGroup}/students?subjectId=${selectedSubject}`
      : null,
    { autoFetch: false }
  );

  // Fetch existing attendance for the selected date
  const { 
    data: existingAttendanceResponse, 
    loading: existingAttendanceLoading,
    refetch: refetchExistingAttendance 
  } = useApiGet(
    selectedGroup && selectedSubject && selectedDate 
      ? `/teacher/attendance/date?groupId=${selectedGroup}&subjectId=${selectedSubject}&date=${selectedDate}`
      : null,
    { autoFetch: false }
  );

  // Fetch attendance history
  const { 
    data: historyResponse, 
    loading: historyLoading,
    refetch: refetchHistory 
  } = useApiGet(
    selectedGroup && selectedSubject 
      ? `/teacher/attendance/history?groupId=${selectedGroup}&subjectId=${selectedSubject}&month=${historyFilters.month}&year=${historyFilters.year}`
      : null,
    { autoFetch: false }
  );

  // Mark attendance hook
  const { post: markAttendance, loading: markingAttendance } = useApiPost({
    onSuccess: () => {
      toast.success('Attendance marked successfully!');
      refetchHistory();
      refetchExistingAttendance(); // Refresh existing attendance after marking
    },
    onError: (error) => {
      toast.error(error || 'Failed to mark attendance');
    }
  });

  const dashboard: TeacherDashboard = dashboardResponse?.dashboard;
  const attendanceHistory = historyResponse?.attendanceHistory || [];
  const existingAttendance: ExistingAttendance = existingAttendanceResponse?.attendance;
  
  // Extract students from the correct response structure
  const students: Student[] = studentsResponse?.students || [];

  // Extract assigned subjects and groups from dashboard
  const assignedSubjects = dashboard?.teacher.assignedSubjects || [];

  // Get all unique groups from assigned subjects
  const allGroups = assignedSubjects.reduce((groups: Group[], subject) => {
    subject.groups.forEach(group => {
      if (!groups.find(g => g._id === group._id)) {
        groups.push(group);
      }
    });
    return groups;
  }, []);

  // Get subjects for selected group - only subjects where teacher is assigned to teach this specific group
  const subjectsForSelectedGroup = selectedGroup 
    ? assignedSubjects
        .filter(subject => 
          subject.groups.some(group => group._id === selectedGroup)
        )
        .map(subject => ({
          ...subject,
          // Filter to only include the selected group in the groups array
          groups: subject.groups.filter(g => g._id === selectedGroup)
        }))
    : [];

  // Fetch students and existing attendance when group, subject, or date changes
  useEffect(() => {
    if (selectedGroup && selectedSubject && selectedDate) {
      refetchStudents();
      refetchExistingAttendance();
    }
  }, [selectedGroup, selectedSubject, selectedDate]);

  // Initialize attendance records when students data is loaded OR when existing attendance is found
  useEffect(() => {
    if (students.length > 0 && selectedGroup && selectedSubject && selectedDate) {
      // If we have existing attendance data for this date, use it
      if (existingAttendance) {
        console.log('📅 Found existing attendance records:', existingAttendance);
        
        const existingRecords: Record<string, AttendanceRecord> = {};
        
        existingAttendance.attendanceRecords.forEach((record) => {
          existingRecords[record.studentId._id] = {
            studentId: record.studentId._id,
            status: record.status,
            remarks: record.remarks || ''
          };
        });
        
        setAttendanceRecords(existingRecords);
      } else {
        // Otherwise, initialize with default 'present' status
        console.log('🆕 No existing attendance found, initializing with default "present"');
        const initialRecords: Record<string, AttendanceRecord> = {};
        students.forEach(student => {
          initialRecords[student._id] = {
            studentId: student._id,
            status: 'present',
            remarks: ''
          };
        });
        setAttendanceRecords(initialRecords);
      }
    }
  }, [students, selectedGroup, selectedSubject, selectedDate, existingAttendance]);

  // Load history when filters change
  useEffect(() => {
    if (showHistory && selectedGroup && selectedSubject) {
      refetchHistory();
    }
  }, [showHistory, selectedGroup, selectedSubject, historyFilters]);

  const handleStatusChange = (studentId: string, status: AttendanceRecord['status']) => {
    setAttendanceRecords(prev => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        status
      }
    }));
  };

  const handleRemarksChange = (studentId: string, remarks: string) => {
    setAttendanceRecords(prev => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        remarks
      }
    }));
  };

  const handleSubmitAttendance = async () => {
    if (!selectedGroup || !selectedSubject) {
      toast.error('Please select both group and subject');
      return;
    }

    const records = Object.values(attendanceRecords);
    if (records.length === 0) {
      toast.error('No students found for attendance');
      return;
    }

    const attendanceData: AttendanceData = {
      date: selectedDate,
      subjectId: selectedSubject,
      groupId: selectedGroup,
      attendanceRecords: records
    };

    await markAttendance('/teacher/attendance/mark', attendanceData);
  };

  const getStatusCounts = () => {
    const counts = {
      present: 0,
      absent: 0,
      late: 0,
      excused: 0,
      total: 0
    };

    Object.values(attendanceRecords).forEach(record => {
      counts[record.status]++;
      counts.total++;
    });

    return counts;
  };

  // Calculate derived data
  const selectedGroupData = allGroups.find(g => g._id === selectedGroup);
  const selectedSubjectData = subjectsForSelectedGroup.find(s => s.subjectId._id === selectedSubject);
  const statusCounts = getStatusCounts();

  // Debug logging
  useEffect(() => {
    console.log('=== DEBUGGING ATTENDANCE ===');
    console.log('Selected Group:', selectedGroup);
    console.log('Selected Subject:', selectedSubject);
    console.log('Selected Date:', selectedDate);
    console.log('Students loaded:', students.length);
    console.log('Existing Attendance:', existingAttendance);
    console.log('Attendance Records:', attendanceRecords);
    console.log('Existing Attendance Loading:', existingAttendanceLoading);
  }, [selectedGroup, selectedSubject, selectedDate, students, existingAttendance, attendanceRecords, existingAttendanceLoading]);

  if (dashboardLoading) {
    return (
      <>
        <Navbar />
        <Sidebar userRole="teacher" activeItem="attendance" />
        <div>
          <LoadingSpinner message="Loading attendance setup..." />
        </div>
      </>
    );
  }

  if (dashboardError) {
    return (
      <>
        <Navbar />
        <Sidebar userRole="teacher" activeItem="attendance" />
        <div className="ml-64 mt-16 min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
          <ErrorDisplay 
            error={dashboardError} 
            onRetry={refetchDashboard} 
            title="Error Loading Dashboard" 
          />
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <Sidebar userRole="teacher" activeItem="attendance" />
      
      <div className="ml-64 mt-16 min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header Section */}
          <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-800">Student Attendance</h1>
                <p className="text-gray-600 mt-1">
                  Mark and manage student attendance for your classes
                </p>
              </div>
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setShowHistory(!showHistory)}
                  className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all flex items-center gap-2"
                >
                  <BarChart3 size={20} />
                  {showHistory ? 'Hide History' : 'View History'}
                  {showHistory ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>
              </div>
            </div>

            {/* Quick Stats - Using StatsCard Component */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
              <StatsCard
                title="Present Students"
                count={statusCounts.present}
                subtitle="marked present"
                icon={CheckCircle}
                iconColor="text-green-600"
                iconBg="bg-green-50"
              />
              <StatsCard
                title="Absent Students"
                count={statusCounts.absent}
                subtitle="marked absent"
                icon={XCircle}
                iconColor="text-red-600"
                iconBg="bg-red-50"
              />
              <StatsCard
                title="Late Students"
                count={statusCounts.late}
                subtitle="marked late"
                icon={Clock}
                iconColor="text-yellow-600"
                iconBg="bg-yellow-50"
              />
              <StatsCard
                title="Total Students"
                count={statusCounts.total}
                subtitle="total enrolled"
                icon={Users}
                iconColor="text-blue-600"
                iconBg="bg-blue-50"
              />
            </div>
          </div>

          {/* Attendance Form */}
          <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
            <div className="flex items-center gap-2 mb-4">
              <Calendar size={20} className="text-gray-600" />
              <h2 className="text-lg font-semibold text-gray-800">Mark Attendance</h2>
              {existingAttendance && (
                <span className="px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full">
                  Editing Existing Record
                </span>
              )}
            </div>

            {/* Filters */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date
                </label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Group
                </label>
                <select
                  value={selectedGroup}
                  onChange={(e) => {
                    setSelectedGroup(e.target.value);
                    setSelectedSubject('');
                    setAttendanceRecords({});
                  }}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                >
                  <option value="">Select Group</option>
                  {allGroups.map(group => (
                    <option key={group._id} value={group._id}>
                      {group.name} - Sem {group.semester}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Subject
                </label>
                <select
                  value={selectedSubject}
                  onChange={(e) => {
                    setSelectedSubject(e.target.value);
                    setAttendanceRecords({});
                  }}
                  disabled={!selectedGroup}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none disabled:bg-gray-50"
                >
                  <option value="">Select Subject</option>
                  {subjectsForSelectedGroup.map(subject => (
                    <option key={subject.subjectId._id} value={subject.subjectId._id}>
                      {subject.subjectId.code} - {subject.subjectId.name} (Sem {subject.semester})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-end">
                <button
                  onClick={handleSubmitAttendance}
                  disabled={markingAttendance || !selectedGroup || !selectedSubject || studentsLoading || existingAttendanceLoading}
                  className="w-full px-6 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {markingAttendance ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Saving...
                    </>
                  ) : studentsLoading || existingAttendanceLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Loading...
                    </>
                  ) : (
                    <>
                      <CheckCircle size={20} />
                      {existingAttendance ? 'Update Attendance' : 'Mark Attendance'}
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Loading State for Existing Attendance */}
            {existingAttendanceLoading && (
              <div className="mb-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-center gap-3">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                  <div>
                    <h3 className="font-semibold text-blue-800">Loading existing attendance...</h3>
                    <p className="text-sm text-blue-700 mt-1">Fetching attendance records for {selectedDate}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Error Display */}
            {studentsError && selectedGroup && selectedSubject && (
              <div className="mb-4 p-4 bg-red-50 rounded-lg border border-red-200">
                <div className="flex items-start gap-3">
                  <XCircle className="text-red-600 flex-shrink-0 mt-0.5" size={20} />
                  <div>
                    <h3 className="font-semibold text-red-800">Failed to Load Students</h3>
                    <p className="text-sm text-red-700 mt-1">{studentsError}</p>
                    <button
                      onClick={() => refetchStudents()}
                      className="mt-2 text-sm text-red-700 underline hover:text-red-800"
                    >
                      Try Again
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Attendance Table Component */}
            {selectedGroup && selectedSubject && !studentsError && (
              <AttendanceTable
                students={students}
                attendanceRecords={attendanceRecords}
                onStatusChange={handleStatusChange}
                onRemarksChange={handleRemarksChange}
                loading={studentsLoading || existingAttendanceLoading}
                groupName={selectedGroupData?.name}
                subjectName={selectedSubjectData?.subjectId.name}
                selectedDate={selectedDate}
                readOnly={false}
                existingAttendance={!!existingAttendance}
              />
            )}

            {/* No Students Message */}
            {selectedGroup && selectedSubject && students.length === 0 && !studentsLoading && !studentsError && (
              <div className="text-center py-8 text-gray-500">
                <Users size={48} className="mx-auto mb-3 text-gray-300" />
                <p className="text-lg font-medium">No students found</p>
                <p className="text-sm">There are no students enrolled in this group and subject combination.</p>
              </div>
            )}
          </div>

          {/* Attendance History */}
          {showHistory && selectedGroup && selectedSubject && (
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-lg font-semibold text-gray-800">Attendance History</h2>
                  <p className="text-sm text-gray-600">
                    {selectedGroupData?.name} - {selectedSubjectData?.subjectId.name}
                  </p>
                </div>
                <div className="flex gap-4">
                  <select
                    value={historyFilters.month}
                    onChange={(e) => setHistoryFilters(prev => ({ ...prev, month: parseInt(e.target.value) }))}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  >
                    {Array.from({ length: 12 }, (_, i) => (
                      <option key={i + 1} value={i + 1}>
                        {new Date(2000, i).toLocaleString('default', { month: 'long' })}
                      </option>
                    ))}
                  </select>
                  <select
                    value={historyFilters.year}
                    onChange={(e) => setHistoryFilters(prev => ({ ...prev, year: parseInt(e.target.value) }))}
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
              </div>

              {historyLoading ? (
                <div className="flex justify-center py-8">
                  <LoadingSpinner message="Loading attendance history..." />
                </div>
              ) : attendanceHistory.length === 0 ? (
                <EmptyState 
                  icon={Calendar}
                  message="No attendance records found"
                  description="Mark attendance to see history for this period"
                />
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {attendanceHistory.map((record: any) => (
                    <div key={record._id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex justify-between items-start mb-3">
                        <h3 className="font-semibold text-gray-800">
                          {formatDate(record.date)}
                        </h3>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${record.isSubmitted ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                          {record.isSubmitted ? 'Submitted' : 'Draft'}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div className="text-green-600">
                          <CheckCircle size={16} className="inline mr-1" />
                          {record.totalPresent} Present
                        </div>
                        <div className="text-red-600">
                          <XCircle size={16} className="inline mr-1" />
                          {record.totalAbsent} Absent
                        </div>
                        <div className="text-yellow-600">
                          <Clock size={16} className="inline mr-1" />
                          {record.totalLate} Late
                        </div>
                        <div className="text-gray-600">
                          <Users size={16} className="inline mr-1" />
                          {record.totalStudents} Total
                        </div>
                      </div>
                      {record.submittedAt && (
                        <p className="text-xs text-gray-500 mt-2">
                          Submitted {formatTimeAgo(record.submittedAt)}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default TeacherAttendancePage;