import { useState, useEffect } from 'react';
import { Calendar, Clock, FileText, CheckCircle, AlertCircle, Search, Download, Upload, RefreshCw } from 'lucide-react';
import Navbar from '../../components/Navbar';
import Sidebar from '../../components/Sidebar';
import StatsCard from '../../components/Cardstats';
import SubmitAssignmentModal from '../../components/Submitassigmentmodal';
import { LoadingSpinner, ErrorDisplay, EmptyState } from '../../components/Loadingerror';
import { useApiGet, useApiUpload } from '../../hooks/useApi';

const API_BASE_URL = "http://localhost:5000/api";

interface Teacher {
  _id: string;
  fullName: string;
  email: string;
}

interface Assignment {
  _id: string;
  teacherId: Teacher;
  title: string;
  description: string;
  fileUrl?: string;
  grade: string;
  subject: string;
  deadline: string;
  createdAt: string;
  updatedAt: string;
  isSubmitted: boolean;
  isOverdue: boolean;
  canSubmit: boolean;
  submission?: Submission | null;
}

interface Submission {
  _id: string;
  assignmentId: string;
  studentId: string;
  fileUrl: string;
  grade?: number;
  feedback?: string;
  createdAt: string;
  updatedAt: string;
  status: string;
  submittedAt: string;
}

export default function StudentAssignmentsPage() {
  const [activeItem, setActiveItem] = useState('assignments');
  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
  const [isResubmitting, setIsResubmitting] = useState(false);

  // Use custom hooks for API calls
  const { 
    data: assignmentsData, 
    loading: assignmentsLoading, 
    error: assignmentsError, 
    execute: fetchAssignments 
  } = useApiGet('/student/assignments');

  const { 
    data: submissionsData, 
    loading: submissionsLoading, 
    error: submissionsError, 
    execute: fetchSubmissions 
  } = useApiGet('/student/submissions');

  const { 
    upload: submitAssignmentApi, 
    loading: submitting, 
    error: submitError,
    reset: resetSubmit 
  } = useApiUpload();

  const loading = assignmentsLoading || submissionsLoading;
  const error = assignmentsError || submissionsError;

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    await fetchAssignments();
    await fetchSubmissions();
  };

  const handleSubmitAssignment = async (assignment: Assignment, file: File) => {
    try {
      const formData = new FormData();
      formData.append('assignmentId', assignment._id);
      formData.append('file', file);

      const endpoint = isResubmitting 
        ? '/student/assignments/resubmit'
        : '/student/assignments/submit';

      const result = await submitAssignmentApi(endpoint, formData);

      if (result) {
        alert(`Assignment "${assignment.title}" ${isResubmitting ? 'resubmitted' : 'submitted'} successfully!`);
        setShowUploadModal(false);
        setSelectedAssignment(null);
        setIsResubmitting(false);
        resetSubmit();
        
        // Refresh data
        await fetchData();
      }
    } catch (err: any) {
      console.error(`Error ${isResubmitting ? 'resubmitting' : 'submitting'} assignment:`, err);
      alert(`Failed to ${isResubmitting ? 'resubmit' : 'submit'} assignment: ${err.message}`);
    }
  };

  const handleResubmitAssignment = (assignment: Assignment) => {
    setSelectedAssignment(assignment);
    setIsResubmitting(true);
    setShowUploadModal(true);
  };

  const handleNewSubmitAssignment = (assignment: Assignment) => {
    setSelectedAssignment(assignment);
    setIsResubmitting(false);
    setShowUploadModal(true);
  };

  const getDaysRemaining = (deadline: string): string => {
    const today = new Date();
    const due = new Date(deadline);
    const diffTime = due.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return 'Overdue';
    if (diffDays === 0) return 'Due today';
    if (diffDays === 1) return 'Due tomorrow';
    return `${diffDays} days left`;
  };

  const getStatusInfo = (assignment: Assignment) => {
    const submission = getSubmissionForAssignment(assignment._id);
    const hasSubmission = !!submission && submission.fileUrl && submission.fileUrl !== "";
    
    if (assignment.isOverdue && !hasSubmission) {
      return { status: 'overdue', label: 'Overdue', color: 'text-red-600 bg-red-50' };
    }
    if (hasSubmission) {
      const isGraded = submission?.status === 'graded' || (submission?.grade !== undefined && submission?.grade !== null);
      if (isGraded) {
        return { status: 'graded', label: 'Graded', color: 'text-green-600 bg-green-50' };
      }
      return { status: 'submitted', label: 'Submitted', color: 'text-purple-600 bg-purple-50' };
    }
    const daysLeft = Math.ceil((new Date(assignment.deadline).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
    if (daysLeft <= 2) {
      return { status: 'pending', label: 'Pending', color: 'text-orange-600 bg-orange-50' };
    }
    return { status: 'upcoming', label: 'Upcoming', color: 'text-blue-600 bg-blue-50' };
  };

  const getPriorityInfo = (assignment: Assignment) => {
    const daysLeft = Math.ceil((new Date(assignment.deadline).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
    if (daysLeft < 0 || daysLeft <= 1) {
      return { priority: 'high', label: 'High Priority', color: 'text-red-600 bg-red-50 border-red-200' };
    }
    if (daysLeft <= 3) {
      return { priority: 'medium', label: 'Medium Priority', color: 'text-orange-600 bg-orange-50 border-orange-200' };
    }
    return { priority: 'low', label: 'Low Priority', color: 'text-green-600 bg-green-50 border-green-200' };
  };

  const getSubmissionForAssignment = (assignmentId: string): Submission | undefined => {
    const submissions = submissionsData?.submissions || [];
    return submissions.find((s: Submission) => 
      s.assignmentId === assignmentId && s.fileUrl && s.fileUrl !== ""
    );
  };

  // Check if assignment has been submitted
  const hasSubmission = (assignment: Assignment): boolean => {
    const submission = getSubmissionForAssignment(assignment._id);
    return !!submission && submission.fileUrl && submission.fileUrl !== "";
  };

  // Check if assignment can be resubmitted (already submitted but not graded)
  const canResubmit = (assignment: Assignment): boolean => {
    const submission = getSubmissionForAssignment(assignment._id);
    const isGraded = submission?.status === 'graded' || (submission?.grade !== undefined && submission?.grade !== null);
    const isOverdue = new Date() > new Date(assignment.deadline);
    
    return hasSubmission(assignment) && !isGraded && !isOverdue;
  };

  const assignments = assignmentsData?.assignments || [];
  const submissions = submissionsData?.submissions || [];

  const filteredAssignments = assignments.filter((assignment: Assignment) => {
    const statusInfo = getStatusInfo(assignment);
    const matchesTab = activeTab === 'all' || statusInfo.status === activeTab;
    const matchesSearch = assignment.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         assignment.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         assignment.teacherId.fullName.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTab && matchesSearch;
  });

  const handleDownloadAssignment = (assignment: Assignment) => {
    if (assignment.fileUrl) {
      window.open(assignment.fileUrl, '_blank');
    }
  };

  const handleDownloadSubmission = (submission: Submission) => {
    if (submission.fileUrl) {
      window.open(submission.fileUrl, '_blank');
    }
  };

  if (loading) {
    return <LoadingSpinner message="Loading assignments..." />;
  }

  if (error) {
    return <ErrorDisplay error={error} onRetry={fetchData} title="Error Loading Assignments" />;
  }

  // Count assignments by status using the new logic
  const upcomingCount = assignments.filter((a: Assignment) => getStatusInfo(a).status === 'upcoming').length;
  const pendingCount = assignments.filter((a: Assignment) => getStatusInfo(a).status === 'pending').length;
  const submittedCount = assignments.filter((a: Assignment) => getStatusInfo(a).status === 'submitted').length;
  const gradedCount = assignments.filter((a: Assignment) => getStatusInfo(a).status === 'graded').length;
  const overdueCount = assignments.filter((a: Assignment) => getStatusInfo(a).status === 'overdue').length;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar onProfileClick={() => {}} />
      <Sidebar activeItem={activeItem} onItemClick={setActiveItem} userRole="student" />

      <main className="lg:ml-64 p-6 lg:p-8 space-y-6 mt-10">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Assignments</h1>
            <p className="text-gray-600 text-sm mt-1">Manage and submit your course assignments</p>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Clock className="w-4 h-4" />
            <span>{pendingCount + overdueCount} pending tasks</span>
          </div>
        </div>

        {/* Stats Cards using StatsCard Component */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          <StatsCard
            title="Total"
            count={assignments.length}
            subtitle="assignments"
            iconColor="text-gray-600"
            iconBg="bg-gray-50"
          />

          <StatsCard
            title="Upcoming"
            count={upcomingCount}
            subtitle="assignments"
            iconColor="text-blue-600"
            iconBg="bg-blue-50"
          />

          <StatsCard
            title="Pending"
            count={pendingCount}
            subtitle="assignments"
            iconColor="text-orange-600"
            iconBg="bg-orange-50"
          />

          <StatsCard
            title="Submitted"
            count={submittedCount}
            subtitle="assignments"
            iconColor="text-purple-600"
            iconBg="bg-purple-50"
          />

          <StatsCard
            title="Graded"
            count={gradedCount}
            subtitle="assignments"
            iconColor="text-green-600"
            iconBg="bg-green-50"
          />
        </div>

        {/* Filters and Search */}
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            {/* Tabs */}
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setActiveTab('all')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === 'all'
                    ? 'bg-teal-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                All ({assignments.length})
              </button>
              <button
                onClick={() => setActiveTab('upcoming')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === 'upcoming'
                    ? 'bg-teal-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Upcoming ({upcomingCount})
              </button>
              <button
                onClick={() => setActiveTab('pending')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === 'pending'
                    ? 'bg-teal-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Pending ({pendingCount})
              </button>
              <button
                onClick={() => setActiveTab('submitted')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === 'submitted'
                    ? 'bg-teal-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Submitted ({submittedCount})
              </button>
              <button
                onClick={() => setActiveTab('graded')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === 'graded'
                    ? 'bg-teal-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Graded ({gradedCount})
              </button>
            </div>

            {/* Search */}
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search assignments..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
          </div>
        </div>

        {/* Assignments List */}
        <div className="space-y-4">
          {filteredAssignments.length === 0 ? (
            <EmptyState 
              icon={FileText} 
              message="No assignments found"
              description="Try adjusting your filters or check back later"
            />
          ) : (
            filteredAssignments.map((assignment: Assignment) => {
              const statusInfo = getStatusInfo(assignment);
              const priorityInfo = getPriorityInfo(assignment);
              const submission = getSubmissionForAssignment(assignment._id);
              const hasSubmission = !!submission;
              const canResubmitAssignment = canResubmit(assignment);

              return (
                <div key={assignment._id} className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-start gap-3 mb-3">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${statusInfo.color}`}>
                          <FileText className="w-5 h-5" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900">{assignment.title}</h3>
                          <p className="text-sm text-gray-600 mt-1">
                            {assignment.subject} • {assignment.teacherId.fullName}
                          </p>
                          {assignment.description && (
                            <p className="text-sm text-gray-700 mt-2">{assignment.description}</p>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-3 mt-4">
                        <div className="flex items-center gap-1.5 text-sm text-gray-600">
                          <Calendar className="w-4 h-4" />
                          <span>Due: {new Date(assignment.deadline).toLocaleDateString()} at {new Date(assignment.deadline).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-sm text-gray-600">
                          <Clock className="w-4 h-4" />
                          <span>{getDaysRemaining(assignment.deadline)}</span>
                        </div>
                        <span className={`px-2 py-1 rounded text-xs font-medium border ${priorityInfo.color}`}>
                          {priorityInfo.label}
                        </span>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${statusInfo.color}`}>
                          {statusInfo.label}
                        </span>
                        {assignment.fileUrl && (
                          <button
                            onClick={() => handleDownloadAssignment(assignment)}
                            className="text-xs text-teal-600 hover:text-teal-700 font-medium flex items-center gap-1"
                          >
                            <Download className="w-3 h-3" />
                            Assignment File
                          </button>
                        )}
                      </div>

                      {submission && (
                        <div className="mt-3 pt-3 border-t border-gray-200">
                          <div className="flex flex-col gap-2 text-sm">
                            <span className="text-gray-600">
                              Submitted: {new Date(submission.submittedAt).toLocaleDateString()} at {new Date(submission.submittedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                            {submission.grade !== undefined && submission.grade !== null && (
                              <span className="text-gray-600">
                                Grade: <span className="font-semibold text-gray-900">{submission.grade}%</span>
                                <span className={`ml-2 ${submission.grade >= 90 ? 'text-green-600' : submission.grade >= 70 ? 'text-orange-600' : 'text-red-600'}`}>
                                  ({submission.grade >= 90 ? 'Excellent' : submission.grade >= 70 ? 'Good' : 'Needs Improvement'})
                                </span>
                              </span>
                            )}
                            {submission.feedback && (
                              <div className="mt-2 p-3 bg-blue-50 border border-blue-100 rounded-lg">
                                <p className="text-xs font-medium text-blue-900 mb-1">Instructor Feedback:</p>
                                <p className="text-sm text-blue-800">{submission.feedback}</p>
                              </div>
                            )}
                            {submission.fileUrl && (
                              <button
                                onClick={() => handleDownloadSubmission(submission)}
                                className="text-sm text-teal-600 hover:text-teal-700 font-medium flex items-center gap-1 w-fit"
                              >
                                <Download className="w-4 h-4" />
                                Download My Submission
                              </button>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Action Button */}
                    <div className="flex flex-col items-end gap-3">
                      {!hasSubmission && assignment.canSubmit && (
                        <button
                          onClick={() => handleNewSubmitAssignment(assignment)}
                          className="px-4 py-2 bg-teal-600 text-white rounded-lg text-sm font-medium hover:bg-teal-700 transition-colors flex items-center gap-2"
                        >
                          <Upload className="w-4 h-4" />
                          Submit
                        </button>
                      )}
                      
                      {canResubmitAssignment && (
                        <button
                          onClick={() => handleResubmitAssignment(assignment)}
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors flex items-center gap-2"
                        >
                          <RefreshCw className="w-4 h-4" />
                          Resubmit
                        </button>
                      )}
                      
                      {hasSubmission && !canResubmitAssignment && statusInfo.status === 'submitted' && (
                        <div className="flex flex-col items-center gap-2 text-purple-600">
                          <CheckCircle className="w-6 h-6" />
                          <span className="font-medium text-sm">Submitted</span>
                          <span className="text-xs text-gray-500">Waiting for grading</span>
                        </div>
                      )}
                      
                      {statusInfo.status === 'graded' && (
                        <div className="flex flex-col items-center gap-2">
                          <div className="flex items-center gap-2 text-green-600">
                            <CheckCircle className="w-6 h-6" />
                            <span className="font-medium text-sm">Graded</span>
                          </div>
                          {submission?.grade !== undefined && submission?.grade !== null && (
                            <span className="text-lg font-bold text-gray-900">
                              {submission.grade}%
                            </span>
                          )}
                        </div>
                      )}
                      
                      {statusInfo.status === 'overdue' && (
                        <div className="flex flex-col items-center gap-2 text-red-600">
                          <AlertCircle className="w-6 h-6" />
                          <span className="font-medium text-sm">Overdue</span>
                          <span className="text-xs text-gray-500">Submission closed</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </main>

      {/* Submit Assignment Modal */}
      {selectedAssignment && (
        <SubmitAssignmentModal
          assignment={selectedAssignment}
          isOpen={showUploadModal}
          onClose={() => {
            setShowUploadModal(false);
            setSelectedAssignment(null);
            setIsResubmitting(false);
            resetSubmit();
          }}
          onSubmit={handleSubmitAssignment}
          isSubmitting={submitting}
          isResubmit={isResubmitting}
        />
      )}
    </div>
  );
}