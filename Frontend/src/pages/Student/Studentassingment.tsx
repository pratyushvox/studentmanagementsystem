import React, { useState } from 'react';
import { Calendar, Clock, FileText, CheckCircle, AlertCircle, Search, Download } from 'lucide-react';

import Navbar from '../../components/Navbar';
import Sidebar from '../../components/Sidebar';
import SubmitAssignmentModal from '../../components/Submitassigmentmodal';

interface Assignment {
  id: number;
  title: string;
  course: string;
  instructor: string;
  dueDate: string;
  dueTime: string;
  status: 'upcoming' | 'pending' | 'submitted' | 'graded';
  priority: 'high' | 'medium' | 'low';
  description: string;
  points: number;
  submittedDate?: string;
  grade?: number;
  feedback?: string;
}

export default function StudentAssignmentsPage() {
  const [activeItem, setActiveItem] = useState('assignments');
  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);

 

  const assignments: Assignment[] = [
    {
      id: 1,
      title: 'Mathematics Quiz 3',
      course: 'Advanced Calculus',
      instructor: 'Dr. Sarah Johnson',
      dueDate: '2025-10-07',
      dueTime: '11:59 PM',
      status: 'pending',
      priority: 'high',
      description: 'Complete problems 1-25 from Chapter 7. Show all work and provide detailed explanations.',
      points: 100,
    },
    {
      id: 2,
      title: 'Physics Lab Report',
      course: 'Quantum Physics',
      instructor: 'Prof. Michael Chen',
      dueDate: '2025-10-09',
      dueTime: '11:59 PM',
      status: 'pending',
      priority: 'medium',
      description: 'Write a detailed report on the quantum tunneling experiment conducted in lab.',
      points: 150,
    },
    {
      id: 3,
      title: 'English Essay',
      course: 'Literature 101',
      instructor: 'Dr. Emily Brown',
      dueDate: '2025-10-12',
      dueTime: '11:59 PM',
      status: 'upcoming',
      priority: 'low',
      description: 'Analyze the themes in Shakespeare\'s Hamlet (1500 words minimum).',
      points: 100,
    },
    {
      id: 4,
      title: 'Chemistry Project',
      course: 'Organic Chemistry',
      instructor: 'Prof. David Lee',
      dueDate: '2025-10-15',
      dueTime: '11:59 PM',
      status: 'upcoming',
      priority: 'medium',
      description: 'Research and present on organic compound synthesis methods.',
      points: 120,
    },
    {
      id: 5,
      title: 'Data Structures Assignment',
      course: 'Computer Science',
      instructor: 'Dr. Alex Kumar',
      dueDate: '2025-09-28',
      dueTime: '11:59 PM',
      status: 'submitted',
      priority: 'medium',
      description: 'Implement binary search tree with insertion and deletion operations.',
      points: 80,
      submittedDate: '2025-09-27',
    },
    {
      id: 6,
      title: 'History Research Paper',
      course: 'World History',
      instructor: 'Prof. Maria Garcia',
      dueDate: '2025-09-20',
      dueTime: '11:59 PM',
      status: 'graded',
      priority: 'high',
      description: 'Research paper on the Industrial Revolution and its impact on society.',
      points: 200,
      submittedDate: '2025-09-19',
      grade: 185,
      feedback: 'Excellent work! Your analysis was thorough and well-researched.'
    },
    {
      id: 7,
      title: 'Calculus Problem Set 4',
      course: 'Advanced Calculus',
      instructor: 'Dr. Sarah Johnson',
      dueDate: '2025-09-15',
      dueTime: '11:59 PM',
      status: 'graded',
      priority: 'medium',
      description: 'Integration techniques and applications.',
      points: 100,
      submittedDate: '2025-09-14',
      grade: 95,
      feedback: 'Great understanding of the concepts. Minor calculation error on problem 12.'
    },
  ];

  const getDaysRemaining = (dueDate: string): string => {
    const today = new Date('2025-10-05');
    const due = new Date(dueDate);
    const diffTime = due.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return 'Overdue';
    if (diffDays === 0) return 'Due today';
    if (diffDays === 1) return 'Due tomorrow';
    return `${diffDays} days left`;
  };

  const getPriorityColor = (priority: string): string => {
    switch(priority) {
      case 'high': return 'text-red-600 bg-red-50 border-red-200';
      case 'medium': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'low': return 'text-green-600 bg-green-50 border-green-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getStatusColor = (status: string): string => {
    switch(status) {
      case 'upcoming': return 'text-blue-600 bg-blue-50';
      case 'pending': return 'text-orange-600 bg-orange-50';
      case 'submitted': return 'text-purple-600 bg-purple-50';
      case 'graded': return 'text-green-600 bg-green-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const filteredAssignments = assignments.filter(assignment => {
    const matchesTab = activeTab === 'all' || assignment.status === activeTab;
    const matchesSearch = assignment.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         assignment.course.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTab && matchesSearch;
  });

  const handleSubmitClick = (assignment: Assignment) => {
    setSelectedAssignment(assignment);
    setShowUploadModal(true);
  };

  const handleSubmitAssignment = (assignment: Assignment, file: File) => {
    console.log('Submitting assignment:', assignment.title);
    console.log('File:', file.name);
    alert(`Assignment "${assignment.title}" submitted successfully!`);
  };

  // Count assignments by status
  const upcomingCount = assignments.filter(a => a.status === 'upcoming').length;
  const pendingCount = assignments.filter(a => a.status === 'pending').length;
  const submittedCount = assignments.filter(a => a.status === 'submitted').length;
  const gradedCount = assignments.filter(a => a.status === 'graded').length;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar/>
      <Sidebar activeItem={activeItem} onItemClick={setActiveItem} userRole="student" />

      <main className="lg:ml-64 pt-16">
        <div className="p-6 lg:p-8 space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">Assignments</h1>
              <p className="text-gray-600 text-sm mt-1">Manage and submit your course assignments</p>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Clock className="w-4 h-4" />
              <span>{pendingCount} pending tasks</span>
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
              <div className="bg-white border border-gray-200 rounded-lg p-12 text-center">
                <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No assignments found</p>
              </div>
            ) : (
              filteredAssignments.map((assignment) => (
                <div key={assignment.id} className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-start gap-3 mb-3">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                          assignment.status === 'graded' ? 'bg-green-50' :
                          assignment.status === 'submitted' ? 'bg-purple-50' :
                          assignment.status === 'pending' ? 'bg-orange-50' : 'bg-blue-50'
                        }`}>
                          <FileText className={`w-5 h-5 ${
                            assignment.status === 'graded' ? 'text-green-600' :
                            assignment.status === 'submitted' ? 'text-purple-600' :
                            assignment.status === 'pending' ? 'text-orange-600' : 'text-blue-600'
                          }`} />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900">{assignment.title}</h3>
                          <p className="text-sm text-gray-600 mt-1">{assignment.course} • {assignment.instructor}</p>
                          <p className="text-sm text-gray-700 mt-2">{assignment.description}</p>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-3 mt-4">
                        <div className="flex items-center gap-1.5 text-sm text-gray-600">
                          <Calendar className="w-4 h-4" />
                          <span>Due: {new Date(assignment.dueDate).toLocaleDateString()} at {assignment.dueTime}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-sm text-gray-600">
                          <Clock className="w-4 h-4" />
                          <span>{getDaysRemaining(assignment.dueDate)}</span>
                        </div>
                        <span className={`px-2 py-1 rounded text-xs font-medium border ${getPriorityColor(assignment.priority)}`}>
                          {assignment.priority.charAt(0).toUpperCase() + assignment.priority.slice(1)} Priority
                        </span>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(assignment.status)}`}>
                          {assignment.status.charAt(0).toUpperCase() + assignment.status.slice(1)}
                        </span>
                        <span className="text-sm text-gray-600">
                          {assignment.points} points
                        </span>
                      </div>

                      {(assignment.status === 'submitted' || assignment.status === 'graded') && (
                        <div className="mt-3 pt-3 border-t border-gray-200">
                          <div className="flex flex-col gap-2 text-sm">
                            <span className="text-gray-600">
                              Submitted: {assignment.submittedDate ? new Date(assignment.submittedDate).toLocaleDateString() : 'N/A'}
                            </span>
                            {assignment.grade !== undefined && (
                              <span className="text-gray-600">
                                Grade: <span className="font-semibold text-gray-900">{assignment.grade}/{assignment.points}</span> 
                                <span className={`ml-2 ${assignment.grade / assignment.points >= 0.9 ? 'text-green-600' : assignment.grade / assignment.points >= 0.7 ? 'text-orange-600' : 'text-red-600'}`}>
                                  ({Math.round((assignment.grade / assignment.points) * 100)}%)
                                </span>
                              </span>
                            )}
                            {assignment.feedback && (
                              <div className="mt-2 p-3 bg-blue-50 border border-blue-100 rounded-lg">
                                <p className="text-xs font-medium text-blue-900 mb-1">Instructor Feedback:</p>
                                <p className="text-sm text-blue-800">{assignment.feedback}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Action Button */}
                    <div className="flex-shrink-0">
                      {(assignment.status === 'pending' || assignment.status === 'upcoming') && (
                        <button
                          onClick={() => handleSubmitClick(assignment)}
                          className="px-4 py-2 bg-teal-600 text-white rounded-lg text-sm font-medium hover:bg-teal-700 transition-colors flex items-center gap-2"
                        >
                          <FileText className="w-4 h-4" />
                          Submit
                        </button>
                      )}
                      {assignment.status === 'submitted' && (
                        <div className="flex items-center gap-2 text-purple-600 text-sm">
                          <CheckCircle className="w-5 h-5" />
                          <span className="font-medium">Submitted</span>
                        </div>
                      )}
                      {assignment.status === 'graded' && (
                        <div className="flex flex-col items-end gap-2">
                          <div className="flex items-center gap-2 text-green-600 text-sm">
                            <CheckCircle className="w-5 h-5" />
                            <span className="font-medium">Graded</span>
                          </div>
                          <button className="text-sm text-teal-600 hover:text-teal-700 font-medium flex items-center gap-1">
                            <Download className="w-4 h-4" />
                            Download
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </main>

      {/* Submit Assignment Modal */}
      <SubmitAssignmentModal
        assignment={selectedAssignment}
        isOpen={showUploadModal}
        onClose={() => {
          setShowUploadModal(false);
          setSelectedAssignment(null);
        }}
        onSubmit={handleSubmitAssignment}
      />
    </div>
  );
}