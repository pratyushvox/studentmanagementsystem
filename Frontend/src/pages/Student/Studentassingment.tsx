import { useState, useEffect } from 'react';
import { Calendar, Clock, FileText, CheckCircle, AlertCircle, Search, Download, Upload, RefreshCw } from 'lucide-react';
import Navbar from '../../components/Navbar';
import Sidebar from '../../components/Sidebar';
import StatsCard from '../../components/Cardstats';
import SubmitAssignmentModal from '../../components/Submitassigmentmodal';
import { LoadingSpinner, ErrorDisplay, EmptyState } from '../../components/Loadingerror';
import { useApiGet, useApiUpload } from '../../hooks/useApi';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

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
  assignmentId: any; // Can be string or object with _id
  studentId: string;
  fileUrl: string;
  marks?: number;
  feedback?: string;
  createdAt: string;
  updatedAt: string;
  status: "pending" | "submitted" | "late" | "graded";
  submittedAt: string;
}

export default function StudentAssignmentsPage() {
  const [activeItem, setActiveItem] = useState('assignments');
  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
  const [isResubmitting, setIsResubmitting] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  // Use custom hooks for API calls
  const { 
    data: assignmentsData, 
    loading: assignmentsLoading, 
    error: assignmentsError, 
    refetch: fetchAssignments 
  } = useApiGet('/student/assignments', { autoFetch: true });

  const { 
    data: submissionsData, 
    loading: submissionsLoading, 
    error: submissionsError, 
    refetch: fetchSubmissions 
  } = useApiGet('/student/submissions', { autoFetch: true });

  const { 
    upload: submitAssignmentApi, 
    loading: submitting
  } = useApiUpload({
    onSuccess: (data) => {
      const message = data?.message || (isResubmitting ? 'Assignment resubmitted successfully!' : 'Assignment submitted successfully!');
      toast.success(message);
      setShowUploadModal(false);
      setSelectedAssignment(null);
      setIsResubmitting(false);
      
      // Force refresh data with a small delay to ensure backend has updated
      setTimeout(() => {
        fetchAssignments();
        fetchSubmissions();
        setRefreshKey(prev => prev + 1);
      }, 500);
    },
    onError: (err) => {
      toast.error(err || `Failed to ${isResubmitting ? 'resubmit' : 'submit'} assignment`);
    }
  });

  const loading = assignmentsLoading || submissionsLoading;
  const error = assignmentsError || submissionsError;

  const handleSubmitAssignment = async (assignment: Assignment, file: File) => {
    const formData = new FormData();
    formData.append('assignmentId', assignment._id);
    formData.append('file', file);

    const endpoint = isResubmitting 
      ? '/student/assignments/resubmit'
      : '/student/assignments/submit';

    await submitAssignmentApi(endpoint, formData);
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

  // Get submission for assignment - handle both string and object assignmentId
  const getSubmissionForAssignment = (assignmentId: string): Submission | undefined => {
    const submissions = submissionsData?.submissions || [];
    
    const submission = submissions.find((s: Submission) => {
      // Handle both string and object assignmentId
      const submissionAssignmentId = typeof s.assignmentId === 'object' && s.assignmentId !== null
        ? s.assignmentId._id 
        : s.assignmentId;
      
      return submissionAssignmentId === assignmentId;
    });
    
    return submission;
  };

  // Status detection based on your submission model
  const getStatusInfo = (assignment: Assignment) => {
    const submission = getSubmissionForAssignment(assignment._id);
    
    if (!submission || !submission.fileUrl || submission.fileUrl === "") {
      // No submission or no file
      const isOverdue = new Date() > new Date(assignment.deadline);
      if (isOverdue) {
        return { status: 'overdue', label: 'Overdue', color: 'text-red-600 bg-red-50' };
      }
      
      const daysLeft = Math.ceil((new Date(assignment.deadline).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
      if (daysLeft <= 2) {
        return { status: 'pending', label: 'Pending', color: 'text-orange-600 bg-orange-50' };
      }
      return { status: 'upcoming', label: 'Upcoming', color: 'text-blue-600 bg-blue-50' };
    }

    // Has submission with file - check the actual status from database
    switch (submission.status) {
      case 'graded':
        return { status: 'graded', label: 'Graded', color: 'text-green-600 bg-green-50' };
      case 'late':
        return { status: 'submitted', label: 'Late Submission', color: 'text-orange-600 bg-orange-50' };
      case 'submitted':
        return { status: 'submitted', label: 'Submitted', color: 'text-purple-600 bg-purple-50' };
      case 'pending':
        return { status: 'submitted', label: 'Submitted', color: 'text-purple-600 bg-purple-50' };
      default:
        return { status: 'submitted', label: 'Submitted', color: 'text-purple-600 bg-purple-50' };
    }
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

  // Check if assignment has been submitted
  const hasSubmission = (assignment: Assignment): boolean => {
    const submission = getSubmissionForAssignment(assignment._id);
    return !!submission && !!submission.fileUrl && submission.fileUrl !== "";
  };

  // Check if assignment can be resubmitted
  const canResubmit = (assignment: Assignment): boolean => {
    const submission = getSubmissionForAssignment(assignment._id);
    if (!submission) return false;
    
    const hasFile = !!submission.fileUrl && submission.fileUrl !== "";
    const isGraded = submission.status === 'graded';
    
    return hasFile && !isGraded;
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
    return <ErrorDisplay error={error} onRetry={() => { fetchAssignments(); fetchSubmissions(); }} title="Error Loading Assignments" />;
  }

  // Count assignments by status
  const statusCounts = {
    upcoming: assignments.filter((a: Assignment) => getStatusInfo(a).status === 'upcoming').length,
    pending: assignments.filter((a: Assignment) => getStatusInfo(a).status === 'pending').length,
    submitted: assignments.filter((a: Assignment) => getStatusInfo(a).status === 'submitted').length,
    graded: assignments.filter((a: Assignment) => getStatusInfo(a).status === 'graded').length,
    overdue: assignments.filter((a: Assignment) => getStatusInfo(a).status === 'overdue').length,
  };

  return (
    <div className="min-h-screen bg-gray-50" key={refreshKey}>
      <Navbar />
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
            <span>{statusCounts.pending + statusCounts.overdue} pending tasks</span>
          </div>
        </div>

        {/* Stats Cards */}
       
        {/* Filters and Search */}
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="flex flex-wrap gap-2">
              {['all', 'upcoming', 'pending', 'submitted', 'graded', 'overdue'].map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    activeTab === tab ? 'bg-teal-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)} ({tab === 'all' ? assignments.length : statusCounts[tab as keyof typeof statusCounts]})
                </button>
              ))}
            </div>
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
            <EmptyState icon={FileText} message="No assignments found" description="Try adjusting your filters or check back later" />
          ) : (
            filteredAssignments.map((assignment: Assignment) => {
              const statusInfo = getStatusInfo(assignment);
              const priorityInfo = getPriorityInfo(assignment);
              const submission = getSubmissionForAssignment(assignment._id);
              const hasSubmissionFile = hasSubmission(assignment);
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
                          <button onClick={() => handleDownloadAssignment(assignment)} className="text-xs text-teal-600 hover:text-teal-700 font-medium flex items-center gap-1">
                            <Download className="w-3 h-3" /> Assignment File
                          </button>
                        )}
                      </div>

                      {submission && hasSubmissionFile && (
                        <div className="mt-3 pt-3 border-t border-gray-200">
                          <div className="flex flex-col gap-2 text-sm">
                            <span className="text-gray-600">
                              Submitted: {new Date(submission.submittedAt).toLocaleDateString()} at {new Date(submission.submittedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                            {submission.marks !== undefined && submission.marks !== null && (
                              <span className="text-gray-600">
                                Grade: <span className="font-semibold text-gray-900">{submission.marks}%</span>
                              </span>
                            )}
                            {submission.feedback && (
                              <div className="mt-2 p-3 bg-blue-50 border border-blue-100 rounded-lg">
                                <p className="text-xs font-medium text-blue-900 mb-1">Instructor Feedback:</p>
                                <p className="text-sm text-blue-800">{submission.feedback}</p>
                              </div>
                            )}
                            {submission.fileUrl && (
                              <button onClick={() => handleDownloadSubmission(submission)} className="text-sm text-teal-600 hover:text-teal-700 font-medium flex items-center gap-1 w-fit cursor-pointer">
                                <Download className="w-4 h-4 " /> Download My Submission
                              </button>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-col items-end gap-3">
                      {/* Show Submit button only if NO submission exists and not overdue */}
                      {!hasSubmissionFile && statusInfo.status !== 'overdue' && (
                        <button 
                          onClick={() => handleNewSubmitAssignment(assignment)} 
                          className="px-4 py-2 bg-teal-600 text-white rounded-lg text-sm font-medium hover:bg-teal-700 transition-colors flex items-center gap-2"
                        >
                          <Upload className="w-4 h-4" /> Submit
                        </button>
                      )}
                      
                      {/* Show Resubmit button if submission exists and can be resubmitted */}
                      {hasSubmissionFile && canResubmitAssignment && (
                        <button 
                          onClick={() => handleResubmitAssignment(assignment)} 
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors flex items-center gap-2"
                        >
                          <RefreshCw className="w-4 h-4" /> Resubmit
                        </button>
                      )}
                      
                      {/* Show Submitted status if submitted but can't resubmit (graded) */}
                      {hasSubmissionFile && !canResubmitAssignment && statusInfo.status === 'graded' && (
                        <div className="flex flex-col items-center gap-2">
                          <CheckCircle className="w-6 h-6 text-green-600" />
                          <span className="font-medium text-sm text-green-600">Graded</span>
                          {submission?.marks !== undefined && (
                            <span className="text-lg font-bold text-gray-900">{submission.marks}%</span>
                          )}
                        </div>
                      )}
                      
                      {/* Show Submitted status if submitted and awaiting grade */}
                      {hasSubmissionFile && canResubmitAssignment && statusInfo.status === 'submitted' && (
                        <div className="flex flex-col items-center gap-2 text-purple-600">
                          <CheckCircle className="w-6 h-6" />
                          <span className="font-medium text-sm">Submitted</span>
                          <span className="text-xs text-gray-500">Awaiting grade</span>
                        </div>
                      )}
                      
                      {/* Show Overdue status if no submission and past deadline */}
                      {statusInfo.status === 'overdue' && !hasSubmissionFile && (
                        <div className="flex flex-col items-center gap-2 text-red-600">
                          <AlertCircle className="w-6 h-6" />
                          <span className="font-medium text-sm">Overdue</span>
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
          }}
          onSubmit={handleSubmitAssignment}
          isSubmitting={submitting}
          isResubmit={isResubmitting}
        />
      )}
    </div>
  );
}