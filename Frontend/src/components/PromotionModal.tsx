// components/PromotionModal.tsx
import { useState, useEffect } from "react";
import { 
  Award, 
  TrendingUp, 
  Clock, 
  CheckCircle, 
  XCircle,
  AlertCircle,
  BarChart3,
  Filter,
  Search,
  Users
} from "lucide-react";
import { LoadingSpinner } from "./Loadingerror";
import { useApiGet, useApiPost } from "../hooks/useApi";
import { toast } from 'react-toastify';

interface PromotionModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedSemester: string;
  onSemesterChange: (semester: string) => void;
  onPromoteSemester: (semester: string) => Promise<void>;
}

interface AssignmentResult {
  submissionId: string;
  assignmentTitle: string;
  subjectName: string;
  subjectCode: string;
  obtainedMarks: number;
  maxMarks: number;
  percentage: number;
  passed: boolean;
}

interface StudentReport {
  studentId: string;
  studentCode: string;
  fullName: string;
  currentStatus: string;
  attendancePercentage: number;
  mainAssignmentsPassed: boolean;
  mainAssignmentsCompleted: boolean;
  promotionEligibility: string;
  reason: string;
  totalSubmissions: number;
  mainSubmissionsCount: number;
  groupName?: string;
  groupId?: string;
  mainAssignmentResults?: AssignmentResult[];
  subjectResults?: any[];
}

interface PromotionReport {
  semester: number;
  totalStudents: number;
  autoPromote: number;
  manualPromote: number;
  failed: number;
  report: StudentReport[];
}

interface Group {
  id: string;
  name: string;
  semester: number;
}

export default function PromotionModal({
  isOpen,
  onClose,
  selectedSemester,
  onSemesterChange,
  onPromoteSemester
}: PromotionModalProps) {
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [expandedStudent, setExpandedStudent] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedGroup, setSelectedGroup] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");

  const { 
    data: promotionReportData, 
    loading: promotionReportLoading,
    refetch: fetchPromotionReport 
  } = useApiGet(`/admin/promotion-report/${selectedSemester}`, {
    autoFetch: false
  });

  const { 
    data: groupsData,
    loading: groupsLoading 
  } = useApiGet(`/admin/groups/semester/${selectedSemester}`);

  const { post: manuallyPromoteApi, loading: manualPromoteLoading } = useApiPost({
    onSuccess: (data) => {
      toast.success(`Manually promoted ${data.promoted} students!`);
      setSelectedStudents([]);
      fetchPromotionReport();
    },
    onError: (err) => toast.error(err || "Failed to manually promote students")
  });

  useEffect(() => {
    if (isOpen) {
      fetchPromotionReport();
    }
  }, [isOpen, selectedSemester]);

  const promotionReport: PromotionReport | null = promotionReportData || null;
  const groups: Group[] = groupsData || [];

  // Filter students based on search term, group, and status
  const filteredStudents = promotionReport?.report?.filter((student: StudentReport) => {
    const matchesSearch = 
      student.studentCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.groupName?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesGroup = selectedGroup === "all" || student.groupId === selectedGroup;
    const matchesStatus = selectedStatus === "all" || student.promotionEligibility === selectedStatus;
    
    return matchesSearch && matchesGroup && matchesStatus;
  }) || [];

  const handleManualPromotion = async () => {
    if (selectedStudents.length === 0) {
      toast.error("Please select at least one student to promote");
      return;
    }

    await manuallyPromoteApi("/admin/manual-promote", {
      studentIds: selectedStudents,
      semester: parseInt(selectedSemester),
      reason: "Manual promotion approved by admin" // Default reason
    });
  };

  const handleStudentSelection = (studentId: string) => {
    setSelectedStudents(prev => 
      prev.includes(studentId) 
        ? prev.filter(id => id !== studentId)
        : [...prev, studentId]
    );
  };

  const handleSelectAllManual = () => {
    const manualStudents = filteredStudents
      .filter((student: StudentReport) => student.promotionEligibility === 'manual_promote')
      .map((student: StudentReport) => student.studentId);
    
    setSelectedStudents(manualStudents);
  };

  const handleDeselectAll = () => {
    setSelectedStudents([]);
  };

  const toggleStudentExpansion = (studentId: string) => {
    setExpandedStudent(expandedStudent === studentId ? null : studentId);
  };

  const getStatusIcon = (eligibility: string) => {
    switch (eligibility) {
      case 'auto_promote':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'manual_promote':
        return <AlertCircle className="w-4 h-4 text-yellow-500" />;
      default:
        return <XCircle className="w-4 h-4 text-red-500" />;
    }
  };

  const getStatusColor = (eligibility: string) => {
    switch (eligibility) {
      case 'auto_promote':
        return 'text-green-700 bg-green-100';
      case 'manual_promote':
        return 'text-yellow-700 bg-yellow-100';
      default:
        return 'text-red-700 bg-red-100';
    }
  };

  const getStatusText = (eligibility: string) => {
    switch (eligibility) {
      case 'auto_promote':
        return 'Auto Promote';
      case 'manual_promote':
        return 'Manual Review';
      default:
        return 'Not Eligible';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-purple-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Award className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Promotion Report - Semester {selectedSemester}</h2>
                <p className="text-gray-600">Student promotion eligibility and management</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors p-2 hover:bg-gray-100 rounded-lg"
            >
              ✕
            </button>
          </div>
          
          <div className="flex gap-4 mt-4 flex-wrap">
            <select
              value={selectedSemester}
              onChange={(e) => onSemesterChange(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {[1,2,3,4,5,6,7,8].map(sem => (
                <option key={sem} value={sem.toString()}>
                  Semester {sem}
                </option>
              ))}
            </select>
            <button
              onClick={() => onPromoteSemester(selectedSemester)}
              className="flex items-center gap-2 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold"
            >
              <TrendingUp className="w-4 h-4" />
              Run Auto Promotion
            </button>
          </div>
        </div>

        {/* Stats Overview */}
        {promotionReport && (
          <div className="p-6 border-b border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-green-600">{promotionReport.autoPromote}</div>
                <div className="text-green-700 font-medium">Auto Promote</div>
                <div className="text-green-600 text-sm flex items-center justify-center gap-1 mt-1">
                  <CheckCircle className="w-4 h-4" />
                  Meets all criteria
                </div>
              </div>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-yellow-600">{promotionReport.manualPromote}</div>
                <div className="text-yellow-700 font-medium">Manual Review</div>
                <div className="text-yellow-600 text-sm flex items-center justify-center gap-1 mt-1">
                  <AlertCircle className="w-4 h-4" />
                  Low attendance
                </div>
              </div>
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-red-600">{promotionReport.failed}</div>
                <div className="text-red-700 font-medium">Not Eligible</div>
                <div className="text-red-600 text-sm flex items-center justify-center gap-1 mt-1">
                  <XCircle className="w-4 h-4" />
                  Failed assignments
                </div>
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-blue-600">{promotionReport.totalStudents}</div>
                <div className="text-blue-700 font-medium">Total Students</div>
                <div className="text-blue-600 text-sm flex items-center justify-center gap-1 mt-1">
                  <BarChart3 className="w-4 h-4" />
                  In semester
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Filters Section */}
        <div className="p-4 border-b border-gray-200 bg-gray-50">
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
            {/* Search */}
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search by student code, name, or group..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Group Filter */}
            <div className="flex gap-2 items-center">
              <Users className="w-4 h-4 text-gray-500" />
              <select
                value={selectedGroup}
                onChange={(e) => setSelectedGroup(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              >
                <option value="all">All Groups</option>
                {groups.map((group) => (
                  <option key={group.id} value={group.id}>
                    {group.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Status Filter */}
            <div className="flex gap-2 items-center">
              <Filter className="w-4 h-4 text-gray-500" />
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              >
                <option value="all">All Status</option>
                <option value="auto_promote">Auto Promote</option>
                <option value="manual_promote">Manual Review</option>
                <option value="failed">Not Eligible</option>
              </select>
            </div>

            {/* Results Count */}
            <div className="text-sm text-gray-600 bg-white px-3 py-2 rounded border">
              Showing {filteredStudents.length} of {promotionReport?.totalStudents || 0} students
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {promotionReportLoading ? (
            <div className="p-8 text-center">
              <LoadingSpinner message="Loading promotion report..." />
            </div>
          ) : promotionReport ? (
            <div className="p-6">
              {/* Manual Promotion Section */}
              {promotionReport.manualPromote > 0 && (
                <div className="mb-8 bg-yellow-50 border border-yellow-200 rounded-lg p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <AlertCircle className="w-6 h-6 text-yellow-600" />
                      <h3 className="text-lg font-semibold text-yellow-800">
                        Manual Promotion Required ({promotionReport.manualPromote} students)
                      </h3>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={handleSelectAllManual}
                        className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded text-sm hover:bg-yellow-200"
                      >
                        Select All
                      </button>
                      <button
                        onClick={handleDeselectAll}
                        className="px-3 py-1 bg-gray-100 text-gray-700 rounded text-sm hover:bg-gray-200"
                      >
                        Deselect All
                      </button>
                    </div>
                  </div>

                  <div className="space-y-3 mb-4">
                    {filteredStudents
                      .filter((student: StudentReport) => student.promotionEligibility === 'manual_promote')
                      .map((student: StudentReport) => (
                        <div key={student.studentId} className="flex items-center justify-between p-3 bg-white rounded border">
                          <div className="flex items-center gap-3">
                            <input
                              type="checkbox"
                              checked={selectedStudents.includes(student.studentId)}
                              onChange={() => handleStudentSelection(student.studentId)}
                              className="w-4 h-4 text-yellow-600 rounded focus:ring-yellow-500"
                            />
                            <div>
                              <div className="font-semibold">
                                {student.studentCode} - {student.fullName}
                                {student.groupName && (
                                  <span className="ml-2 text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded">
                                    {student.groupName}
                                  </span>
                                )}
                              </div>
                              <div className="text-sm text-gray-600">
                                Attendance: {student.attendancePercentage.toFixed(1)}% | 
                                Assignments: {student.mainAssignmentsPassed ? 'Passed' : 'Failed'} |
                                Submissions: {student.mainSubmissionsCount || 0}
                              </div>
                              {student.reason && (
                                <div className="text-sm text-yellow-600">{student.reason}</div>
                              )}
                            </div>
                          </div>
                          <div className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-medium">
                            Manual Review
                          </div>
                        </div>
                      ))}
                  </div>

                  {/* REMOVED: Textarea for manual promotion reason */}
                  <button
                    onClick={handleManualPromotion}
                    disabled={selectedStudents.length === 0 || manualPromoteLoading}
                    className="w-full px-6 py-3 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {manualPromoteLoading ? "Promoting..." : `Promote Selected Students (${selectedStudents.length})`}
                  </button>
                </div>
              )}

              {/* All Students Report */}
              <div>
                <h3 className="text-lg font-semibold mb-4">All Students Report</h3>
                <div className="space-y-3">
                  {filteredStudents.map((student: StudentReport) => (
                    <div key={student.studentId} className={`border rounded-lg p-4 ${
                      student.promotionEligibility === 'auto_promote' ? 'border-green-200 bg-green-50' :
                      student.promotionEligibility === 'manual_promote' ? 'border-yellow-200 bg-yellow-50' :
                      'border-red-200 bg-red-50'
                    }`}>
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            {getStatusIcon(student.promotionEligibility)}
                            <div className="font-semibold text-gray-900">
                              {student.studentCode} - {student.fullName}
                            </div>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(student.promotionEligibility)}`}>
                              {getStatusText(student.promotionEligibility)}
                            </span>
                            {student.groupName && (
                              <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                                {student.groupName}
                              </span>
                            )}
                          </div>
                          
                          <div className="text-sm text-gray-600 mt-2 grid grid-cols-1 md:grid-cols-3 gap-2">
                            <span className="inline-flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              Attendance: <strong>{student.attendancePercentage.toFixed(1)}%</strong>
                            </span>
                            <span className="inline-flex items-center gap-1">
                              {student.mainAssignmentsPassed ? (
                                <CheckCircle className="w-3 h-3 text-green-500" />
                              ) : (
                                <XCircle className="w-3 h-3 text-red-500" />
                              )}
                              Main Assignments: <strong>{student.mainAssignmentsPassed ? 'Passed' : student.mainAssignmentsCompleted ? 'Failed' : 'Not Completed'}</strong>
                            </span>
                            <span className="inline-flex items-center gap-1">
                              <BarChart3 className="w-3 h-3" />
                              Submissions: <strong>{student.mainSubmissionsCount || 0}</strong>
                            </span>
                          </div>

                          {student.reason && (
                            <div className="text-sm text-gray-500 mt-2">{student.reason}</div>
                          )}

                          {/* Assignment Details */}
                          {student.mainAssignmentResults && student.mainAssignmentResults.length > 0 && (
                            <div className="mt-3">
                              <button
                                onClick={() => toggleStudentExpansion(student.studentId)}
                                className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                              >
                                {expandedStudent === student.studentId ? 'Hide' : 'Show'} Assignment Details
                              </button>
                              
                              {expandedStudent === student.studentId && (
                                <div className="mt-3 p-3 bg-white border rounded-lg">
                                  <h4 className="font-semibold text-sm mb-2">Main Assignment Results:</h4>
                                  <div className="space-y-2">
                                    {student.mainAssignmentResults.map((assignment: AssignmentResult, index: number) => (
                                      <div key={assignment.submissionId} className="flex justify-between items-center text-sm p-2 bg-gray-50 rounded">
                                        <div>
                                          <div className="font-medium">{assignment.assignmentTitle}</div>
                                          <div className="text-gray-600 text-xs">{assignment.subjectName} ({assignment.subjectCode})</div>
                                        </div>
                                        <div className="text-right">
                                          <div className={`font-bold ${assignment.passed ? 'text-green-600' : 'text-red-600'}`}>
                                            {assignment.obtainedMarks}/{assignment.maxMarks} 
                                            <span className="ml-1">({assignment.percentage.toFixed(1)}%)</span>
                                          </div>
                                          <div className={`text-xs ${assignment.passed ? 'text-green-600' : 'text-red-600'}`}>
                                            {assignment.passed ? 'PASS' : 'FAIL'}
                                          </div>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="p-8 text-center text-gray-500">
              <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p>No promotion data available for this semester.</p>
              <p className="text-sm mt-2">Run a promotion to see the report.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}