import { CheckCircle, Clock, Download, FileText } from "lucide-react";


const StatusBadge = ({ status }: { status: 'graded' | 'pending' | 'late' }) => {
  const getStatusColor = (status: string) => {
    switch(status) {
      case 'graded': return 'bg-green-100 text-green-700 border-green-200';
      case 'pending': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'late': return 'bg-red-100 text-red-700 border-red-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };


  const getStatusIcon = (status: string) => {
    switch(status) {
      case 'graded': return <CheckCircle className="w-4 h-4" />;
      case 'pending': return <Clock className="w-4 h-4" />;
      case 'late': return <Clock className="w-4 h-4" />;
      default: return <FileText className="w-4 h-4" />;
    }
  };

  return (
    <span className={`px-2.5 py-1 rounded-full text-xs font-medium border flex items-center gap-1 ${getStatusColor(status)}`}>
      {getStatusIcon(status)}
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
};

interface SubmissionCardProps {
  submission: {
    id: number;
    studentName: string;
    studentId: string;
    group: string;
    subjectCode: string;
    subject: string;
    semester: number;
    submittedAt: string;
    assignmentTitle: string;
    status: 'graded' | 'pending' | 'late';
    marks?: number;
    maxMarks: number;
    feedback?: string;
    gradedAt?: string;
    fileUrl: string;
  };
  onViewFile: () => void;
  onGrade: () => void;
}

export const SubmissionCard: React.FC<SubmissionCardProps> = ({ 
  submission, 
  onViewFile, 
  onGrade 
}) => {
  return (
    <div className="p-5 hover:bg-gray-50 transition-colors">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h3 className="text-lg font-semibold text-gray-900">{submission.studentName}</h3>
            <StatusBadge status={submission.status} />
          </div>
          <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm mb-3">
            <div className="flex items-center text-gray-600">
              <span className="font-medium mr-2">Student ID:</span>
              {submission.studentId}
            </div>
            <div className="flex items-center text-gray-600">
              <span className="font-medium mr-2">Group:</span>
              {submission.group}
            </div>
            <div className="flex items-center text-gray-600">
              <span className="font-medium mr-2">Subject:</span>
              {submission.subjectCode} - {submission.subject}
            </div>
            <div className="flex items-center text-gray-600">
              <span className="font-medium mr-2">Semester:</span>
              {submission.semester}
            </div>
            <div className="flex items-center text-gray-600 col-span-2">
              <span className="font-medium mr-2">Submitted:</span>
              {new Date(submission.submittedAt).toLocaleString()}
            </div>
          </div>
          <p className="text-sm text-gray-700 font-medium mb-2">{submission.assignmentTitle}</p>
          {submission.status === 'graded' && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3 mt-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-green-900">
                  Grade: {submission.marks}/{submission.maxMarks}
                </span>
                <span className="text-xs text-green-700">
                  Graded on {new Date(submission.gradedAt!).toLocaleDateString()}
                </span>
              </div>
              {submission.feedback && (
                <p className="text-sm text-green-800">{submission.feedback}</p>
              )}
            </div>
          )}
        </div>
        <div className="flex flex-col gap-2">
          <button
            onClick={onViewFile}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-2 text-sm font-medium"
          >
            <Download className="w-4 h-4" />
            View File
          </button>
          <button
            onClick={onGrade}
            className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 text-sm font-medium ${
              submission.status === 'graded'
                ? 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200'
                : 'bg-indigo-600 text-white hover:bg-indigo-700'
            }`}
          >
            <CheckCircle className="w-4 h-4" />
            {submission.status === 'graded' ? 'Edit Grade' : 'Grade Now'}
          </button>
        </div>
      </div>
    </div>
  );
}