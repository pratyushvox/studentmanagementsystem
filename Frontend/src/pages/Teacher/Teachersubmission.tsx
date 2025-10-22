import React, { useState, useEffect } from 'react';
import { Calendar, CheckCircle, Clock, FileText, ChevronLeft, ChevronRight, Filter, Download, Search, X, AlertCircle } from 'lucide-react';
import Navbar from '../../components/Navbar';
import Sidebar from '../../components/Sidebar';
import StatsCard from '../../components/Cardstats';
import { SubmissionCard } from '../../components/Submissioncard';
import UserFormModal from '../../components/Userformmodal';
import { useApiGet, useApiPatch } from '../../hooks/useApi';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const TeacherGradingDashboard = () => {
  const [activeItem, setActiveItem] = useState('grading');
  const [activeTab, setActiveTab] = useState('weekly');
  const [selectedWeek, setSelectedWeek] = useState('Sep 10 - Sep 16, 2025');
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [gradeModal, setGradeModal] = useState(false);
  const [gradeFormData, setGradeFormData] = useState({ marks: '', feedback: '' });
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedGroup, setSelectedGroup] = useState('');
  const [availableGroups, setAvailableGroups] = useState([]);

  // Fetch teacher's assigned subjects
  const { 
    data: subjectsData, 
    loading: subjectsLoading,
    error: subjectsError 
  } = useApiGet('/teacher/subjects', { autoFetch: true });

  // Fetch submissions for grading
  const { 
    data: submissionsData, 
    loading: submissionsLoading,
    error: submissionsError,
    refetch: refetchSubmissions 
  } = useApiGet('/teacher/submissions/for-grading', { autoFetch: true });

  // Grade submission API
  const { 
    patch: gradeSubmissionApi, 
    loading: gradingLoading 
  } = useApiPatch({
    onSuccess: (data) => {
      console.log('Graded successfully:', data);
      toast.success('Submission graded successfully!', {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
      refetchSubmissions(); // Refresh submissions list
      setGradeModal(false);
      setGradeFormData({ marks: '', feedback: '' });
      setSelectedSubmission(null);
    },
    onError: (error) => {
      toast.error(`Error grading submission: ${error}`, {
        position: "top-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
    }
  });

  // Show error toasts for API errors
  useEffect(() => {
    if (subjectsError) {
      toast.error(`Failed to load subjects: ${subjectsError}`, {
        position: "top-right",
        autoClose: 5000,
      });
    }
  }, [subjectsError]);

  useEffect(() => {
    if (submissionsError) {
      toast.error(`Failed to load submissions: ${submissionsError}`, {
        position: "top-right",
        autoClose: 5000,
      });
    }
  }, [submissionsError]);

  // Extract teacher assignments from subjects data
  const teacherAssignments = subjectsData?.assignedSubjects?.map(assignment => ({
    subjectId: assignment.subjectId._id,
    subjectName: assignment.subjectId.name,
    subjectCode: assignment.subjectId.code,
    semester: assignment.semester,
    credits: assignment.subjectId.credits,
    groups: assignment.groups.map(group => ({
      groupId: group._id,
      groupName: group.name,
      semester: group.semester,
      academicYear: group.academicYear,
      studentCount: group.studentCount
    }))
  })) || [];

  // Process submissions from API
  const processSubmissions = (submissions) => {
    if (!submissions || !Array.isArray(submissions)) return [];

    return submissions.map(sub => ({
      id: sub._id,
      studentName: sub.studentId?.userId?.fullName || 'Unknown',
      studentId: sub.studentId?.studentId || 'N/A',
      email: sub.studentId?.userId?.email || '',
      subject: sub.subjectId?.name || '',
      subjectId: sub.subjectId?._id || '',
      subjectCode: sub.subjectId?.code || '',
      group: sub.groupId?.name || '',
      groupId: sub.groupId?._id || '',
      semester: sub.groupId?.semester || 0,
      assignmentTitle: sub.assignmentId?.title || '',
      assignmentType: sub.assignmentId?.type || '',
      submittedAt: sub.submittedAt || sub.createdAt,
      deadline: sub.assignmentId?.deadline || '',
      status: sub.status,
      marks: sub.marks,
      feedback: sub.feedback,
      gradedAt: sub.gradedAt,
      fileUrl: sub.fileUrl,
      maxMarks: sub.assignmentId?.maxMarks || 0,
      isModuleLeaderAssignment: sub.assignmentId?.isModuleLeaderAssignment || false
    }));
  };

  const allSubmissions = processSubmissions(submissionsData?.submissions || []);

  // Filter submissions by type (weekly or main)
  const submissions = allSubmissions.filter(sub => 
    activeTab === 'weekly' ? sub.assignmentType === 'weekly' : sub.assignmentType === 'main'
  );

  // Handle subject selection and update available groups
  const handleSubjectChange = (subjectId) => {
    setSelectedSubject(subjectId);
    setSelectedGroup('');
    
    if (subjectId) {
      const subject = teacherAssignments.find(s => s.subjectId === subjectId);
      setAvailableGroups(subject ? subject.groups : []);
    } else {
      setAvailableGroups([]);
    }
  };

  // Filter submissions based on all criteria
  const filteredSubmissions = submissions.filter(sub => {
    const matchesStatus = filterStatus === 'all' || sub.status === filterStatus;
    const matchesSearch = sub.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         sub.studentId.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         sub.assignmentTitle.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSubject = !selectedSubject || sub.subjectId === selectedSubject;
    const matchesGroup = !selectedGroup || sub.groupId === selectedGroup;
    
    return matchesStatus && matchesSearch && matchesSubject && matchesGroup;
  });

  // Calculate statistics
  const stats = {
    total: submissions.length,
    pending: submissions.filter(s => s.status === 'pending').length,
    graded: submissions.filter(s => s.status === 'graded').length,
    late: submissions.filter(s => s.status === 'late').length
  };

  // Handle grade submission
  const handleGradeSubmission = async (e) => {
    e.preventDefault();
    
    if (!selectedSubmission) return;

    const marks = parseFloat(gradeFormData.marks);
    
    if (isNaN(marks) || marks < 0 || marks > selectedSubmission.maxMarks) {
      toast.warning(`Marks must be between 0 and ${selectedSubmission.maxMarks}`, {
        position: "top-right",
        autoClose: 4000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
      return;
    }

    if (marks < 0 || marks > selectedSubmission.maxMarks) {
      toast.warning(`Marks must be between 0 and ${selectedSubmission.maxMarks}`, {
        position: "top-right",
        autoClose: 4000,
      });
      return;
    }

    await gradeSubmissionApi(`/teacher/submissions/${selectedSubmission.id}/grade`, {
      marks: marks,
      feedback: gradeFormData.feedback || ''
    });
  };

  // Open grade modal
  const openGradeModal = (submission) => {
    setSelectedSubmission(submission);
    setGradeFormData({
      marks: submission.marks?.toString() || '',
      feedback: submission.feedback || ''
    });
    setGradeModal(true);
  };

  // Define form fields for grading modal
  const gradeFormFields = selectedSubmission ? [
    {
      name: 'marks',
      label: `Marks (out of ${selectedSubmission.maxMarks})`,
      type: 'number',
      placeholder: 'Enter marks',
      required: true,
      min: 0,
      max: selectedSubmission.maxMarks
    },
    {
      name: 'feedback',
      label: 'Feedback',
      type: 'textarea',
      placeholder: 'Provide constructive feedback to the student...',
      required: false,
      rows: 4
    }
  ] : [];

  // Handle tab change with notification
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    toast.info(`Showing ${tab === 'weekly' ? 'Weekly Submissions' : 'Main Assignments'}`, {
      position: "top-right",
      autoClose: 2000,
      hideProgressBar: true,
    });
  };

  // Handle filter changes with notification
  const handleFilterStatus = (status) => {
    setFilterStatus(status);
    if (status !== 'all') {
      toast.info(`Filtering by ${status} submissions`, {
        position: "top-right",
        autoClose: 2000,
        hideProgressBar: true,
      });
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <div className="fixed top-0 left-0 right-0 z-40">
        <Navbar />
      </div>

      <div className="flex flex-1 pt-16">
        <div className="w-64 fixed top-16 left-0 bottom-0 z-30">
          <Sidebar
            activeItem={activeItem}
            onItemClick={setActiveItem}
            userRole="teacher"
          />
        </div>

        <main className="flex-1 ml-64 p-6 overflow-y-auto">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Submission Grading</h1>
            <p className="text-gray-600">Review and grade student submissions</p>
          </div>

          {/* Loading State */}
          {(submissionsLoading || subjectsLoading) && (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Loading submissions...</p>
              </div>
            </div>
          )}

          {/* Error State */}
          {!submissionsLoading && submissionsError && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <div className="flex items-center gap-2 text-red-800">
                <AlertCircle className="w-5 h-5" />
                <p>Failed to load submissions. Please try refreshing the page.</p>
              </div>
            </div>
          )}

          {!submissionsLoading && !subjectsLoading && (
            <>
              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <StatsCard
                  title="Total Submissions"
                  count={stats.total}
                  subtitle="submissions"
                  icon={FileText}
                  iconColor="text-blue-500"
                  iconBg="bg-blue-50"
                />
                <StatsCard
                  title="Pending"
                  count={stats.pending}
                  subtitle="to grade"
                  icon={Clock}
                  iconColor="text-yellow-500"
                  iconBg="bg-yellow-50"
                />
                <StatsCard
                  title="Graded"
                  count={stats.graded}
                  subtitle="completed"
                  icon={CheckCircle}
                  iconColor="text-green-500"
                  iconBg="bg-green-50"
                />
                <StatsCard
                  title="Late Submissions"
                  count={stats.late}
                  subtitle="late"
                  icon={Clock}
                  iconColor="text-red-500"
                  iconBg="bg-red-50"
                />
              </div>

              <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                {/* Tabs */}
                <div className="border-b border-gray-200">
                  <div className="flex">
                    <button
                      onClick={() => handleTabChange('weekly')}
                      className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                        activeTab === 'weekly'
                          ? 'border-indigo-600 text-indigo-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      Weekly Submissions
                    </button>
                    <button
                      onClick={() => handleTabChange('main')}
                      className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                        activeTab === 'main'
                          ? 'border-indigo-600 text-indigo-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      Main Assignments
                    </button>
                  </div>
                </div>

                {/* Subject and Group Filters */}
                <div className="p-5 bg-indigo-50 border-b border-indigo-100">
                  <div className="flex items-center gap-2 mb-3">
                    <Filter className="w-5 h-5 text-indigo-600" />
                    <h3 className="text-sm font-semibold text-indigo-900">Filter by Subject & Group</h3>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Select Subject</label>
                      <select
                        value={selectedSubject}
                        onChange={(e) => handleSubjectChange(e.target.value)}
                        className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white text-sm font-medium"
                      >
                        <option value="">📚 All Subjects</option>
                        {teacherAssignments.map((subject) => (
                          <option key={subject.subjectId} value={subject.subjectId}>
                            {subject.subjectCode} - {subject.subjectName} (Sem {subject.semester})
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Select Group</label>
                      <select
                        value={selectedGroup}
                        onChange={(e) => setSelectedGroup(e.target.value)}
                        disabled={!selectedSubject || availableGroups.length === 0}
                        className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white text-sm font-medium disabled:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        <option value="">👥 All Groups</option>
                        {availableGroups.map((group) => (
                          <option key={group.groupId} value={group.groupId}>
                            {group.groupName} ({group.studentCount} students)
                          </option>
                        ))}
                      </select>
                      {!selectedSubject && (
                        <p className="text-xs text-gray-500 mt-1.5">Select a subject first to filter by group</p>
                      )}
                      {selectedSubject && availableGroups.length === 0 && (
                        <p className="text-xs text-amber-600 mt-1.5">⚠️ No groups assigned for this subject</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Search and Status Filters */}
                <div className="p-4 border-b border-gray-200">
                  <div className="flex items-center gap-2 mb-3">
                    <Search className="w-5 h-5 text-gray-600" />
                    <h3 className="text-sm font-semibold text-gray-900">Search & Filter Status</h3>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row gap-3">
                    <div className="flex-1 relative">
                      <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                      <input
                        type="text"
                        placeholder="Search by student name, ID, or assignment..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      />
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleFilterStatus('all')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                          filterStatus === 'all'
                            ? 'bg-indigo-600 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        All
                      </button>
                      <button
                        onClick={() => handleFilterStatus('pending')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                          filterStatus === 'pending'
                            ? 'bg-yellow-600 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        Pending
                      </button>
                      <button
                        onClick={() => handleFilterStatus('graded')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                          filterStatus === 'graded'
                            ? 'bg-green-600 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        Graded
                      </button>
                    </div>
                  </div>
                </div>

                {/* Submissions List */}
                <div>
                  {filteredSubmissions.length === 0 ? (
                    <div className="p-12 text-center text-gray-500">
                      <FileText className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                      <p className="text-lg font-medium mb-1">No submissions found</p>
                      <p className="text-sm">
                        {selectedSubject || selectedGroup ? 
                          'No submissions for the selected filters' : 
                          'Try adjusting your filters or search query'
                        }
                      </p>
                    </div>
                  ) : (
                    filteredSubmissions.map((submission) => (
                      <SubmissionCard
                        key={submission.id}
                        submission={submission}
                        onViewFile={() => {
                          window.open(submission.fileUrl, '_blank');
                          toast.info('Opening submission file...', {
                            position: "top-right",
                            autoClose: 2000,
                            hideProgressBar: true,
                          });
                        }}
                        onGrade={() => openGradeModal(submission)}
                      />
                    ))
                  )}
                </div>
              </div>
            </>
          )}
        </main>
      </div>

      {/* Grading Modal */}
      <UserFormModal
        isOpen={gradeModal}
        onClose={() => {
          setGradeModal(false);
          setSelectedSubmission(null);
          setGradeFormData({ marks: '', feedback: '' });
          toast.info('Grading cancelled', {
            position: "top-right",
            autoClose: 2000,
            hideProgressBar: true,
          });
        }}
        onSubmit={handleGradeSubmission}
        title={`Grade Submission - ${selectedSubmission?.studentName || ''}`}
        formData={gradeFormData}
        setFormData={setGradeFormData}
        fields={gradeFormFields}
        submitButtonText={gradingLoading ? "Submitting..." : "Submit Grade"}
        isLoading={gradingLoading}
      />
    </div>
  );
};

export default TeacherGradingDashboard;