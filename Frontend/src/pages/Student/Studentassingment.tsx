import { useState, useEffect } from 'react';
import { Calendar, Clock, FileText, CheckCircle, AlertCircle, Search, Download, Upload } from 'lucide-react';
import Navbar from '../../components/Navbar';
import Sidebar from '../../components/Sidebar';
import SubmitAssignmentModal from '../../components/Submitassigmentmodal';
import { LoadingSpinner, ErrorDisplay, EmptyState } from '../../components/LoadingError';

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
}

export default function StudentAssignmentsPage() {
  const [activeItem, setActiveItem] = useState('assignments');
  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");

      // Fetch assignments
      const assignmentsRes = await fetch(`${API_BASE_URL}/student/assignments`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const assignmentsData = await assignmentsRes.json();

      if (!assignmentsRes.ok) {
        throw new Error(assignmentsData.message || 'Failed to fetch assignments');
      }

      // Fetch submissions
      const submissionsRes = await fetch(`${API_BASE_URL}/student/submissions`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const submissionsData = await submissionsRes.json();

      if (!submissionsRes.ok) {
        throw new Error(submissionsData.message || 'Failed to fetch submissions');
      }

      setAssignments(assignmentsData.assignments || []);
      setSubmissions(submissionsData.submissions || []);
      setError(null);
    } catch (err: any) {
      setError(err.message);
      console.error("Error fetching data:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitAssignment = async (assignment: Assignment, file: File) => {
    try {
      setSubmitting(true);
      const token = localStorage.getItem("token");
      const formData = new FormData();
      
      formData.append('assignmentId', assignment._id);
      formData.append('file', file);

      const response = await fetch(`${API_BASE_URL}/student/assignments/submit`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to submit assignment');
      }

      alert(`Assignment "${assignment.title}" submitted successfully!`);
      setShowUploadModal(false);
      setSelectedAssignment(null);
      
      // Refresh data
      await fetchData();
    } catch (err: any) {
      console.error("Error submitting assignment:", err);
      alert(`Failed to submit assignment: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
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
    if (assignment.isOverdue && !assignment.isSubmitted) {
      return { status: 'overdue', label: 'Overdue', color: 'text-red-600 bg-red-50' };
    }
    if (assignment.isSubmitted) {
      const submission = submissions.find(s => s.assignmentId === assignment._id);
      if (submission?.grade !== undefined && submission?.grade !== null) {
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
    return submissions.find(s => s.assignmentId === assignmentId);
  };

  const filteredAssignments = assignments.filter(assignment => {
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

  // Count assignments by status
  const upcomingCount = assignments.filter(a => getStatusInfo(a).status === 'upcoming').length;
  const pendingCount = assignments.filter(a => getStatusInfo(a).status === 'pending').length;
  const submittedCount = assignments.filter(a => getStatusInfo(a).status === 'submitted').length;
  const gradedCount = assignments.filter(a => getStatusInfo(a).status === 'graded').length;
  const overdueCount = assignments.filter(a => getStatusInfo(a).status === 'overdue').length;

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

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          <div className="bg-white border border-gray-200 rounded-lg p-4 text-center">
            <p className="text-2xl font-semibold text-gray-900">{assignments.length}</p>
            <p className="text-xs text-gray-600 mt-1">Total</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-4 text-center">
            <p className="text-2xl font-semibold text-blue-600">{upcomingCount}</p>
            <p className="text-xs text-gray-600 mt-1">Upcoming</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-4 text-center">
            <p className="text-2xl font-semibold text-orange-600">{pendingCount}</p>
            <p className="text-xs text-gray-600 mt-1">Pending</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-4 text-center">
            <p className="text-2xl font-semibold text-purple-600">{submittedCount}</p>
            <p className="text-xs text-gray-600 mt-1">Submitted</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-4 text-center">
            <p className="text-2xl font-semibold text-green-600">{gradedCount}</p>
            <p className="text-xs text-gray-600 mt-1">Graded</p>
          </div>
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
            filteredAssignments.map((assignment) => {
              const statusInfo = getStatusInfo(assignment);
              const priorityInfo = getPriorityInfo(assignment);
              const submission = getSubmissionForAssignment(assignment._id);

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
                              Submitted: {new Date(submission.createdAt).toLocaleDateString()} at {new Date(submission.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
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
                    <div className="flex-shrink-0">
                      {assignment.canSubmit && (
                        <button
                          onClick={() => {
                            setSelectedAssignment(assignment);
                            setShowUploadModal(true);
                          }}
                          className="px-4 py-2 bg-teal-600 text-white rounded-lg text-sm font-medium hover:bg-teal-700 transition-colors flex items-center gap-2"
                        >
                          <Upload className="w-4 h-4" />
                          Submit
                        </button>
                      )}
                      {assignment.isSubmitted && !submission?.grade && (
                        <div className="flex items-center gap-2 text-purple-600 text-sm">
                          <CheckCircle className="w-5 h-5" />
                          <span className="font-medium">Submitted</span>
                        </div>
                      )}
                      {submission?.grade !== undefined && submission?.grade !== null && (
                        <div className="flex flex-col items-end gap-2">
                          <div className="flex items-center gap-2 text-green-600 text-sm">
                            <CheckCircle className="w-5 h-5" />
                            <span className="font-medium">Graded</span>
                          </div>
                        </div>
                      )}
                      {assignment.isOverdue && !assignment.isSubmitted && (
                        <div className="flex items-center gap-2 text-red-600 text-sm">
                          <AlertCircle className="w-5 h-5" />
                          <span className="font-medium">Overdue</span>
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
          }}
          onSubmit={handleSubmitAssignment}
          isSubmitting={submitting}
        />
      )}
    </div>
  );
}