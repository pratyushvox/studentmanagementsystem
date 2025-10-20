import {
  Calendar,
  Award,
  Users,
  FileText,
  Crown,
  Edit,
  Trash2,
  Download,
  AlertCircle,
  CheckCircle,
  XCircle
} from "lucide-react";

interface Assignment {
  _id: string;
  title: string;
  description?: string;
  type: "main" | "weekly";
  semester: number;
  subjectId: {
    _id: string;
    name: string;
    code: string;
  };
  groups: Array<{
    _id: string;
    name: string;
    semester: number;
  }>;
  maxMarks: number;
  deadline: string;
  fileUrl?: string;
  isModuleLeaderAssignment: boolean;
  postedToAllStudents: boolean;
  submissionCount?: number;
  gradedCount?: number;
  submittedCount?: number;
  ungradedCount?: number;
  notSubmittedCount?: number;
  isOverdue?: boolean;
  createdAt: string;
}

interface AssignmentCardProps {
  assignment: Assignment;
  onEdit: () => void;
  onDelete: () => void;
  onView?: () => void;
}

export default function AssignmentCard({ 
  assignment, 
  onEdit, 
  onDelete,
  onView 
}: AssignmentCardProps) {
  const isOverdue = new Date(assignment.deadline) < new Date();
  const submissionRate = assignment.submissionCount
    ? ((assignment.submittedCount || 0) / assignment.submissionCount) * 100
    : 0;

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
      <div className="p-5">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <h3 
                className={`text-lg font-semibold text-gray-900 ${onView ? 'cursor-pointer hover:text-blue-600' : ''}`}
                onClick={onView}
              >
                {assignment.title}
              </h3>
              {assignment.type === "main" ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-yellow-100 text-yellow-700 rounded text-xs font-medium">
                  <Crown className="w-3 h-3" />
                  Main
                </span>
              ) : (
                <span className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded text-xs font-medium">
                  Weekly
                </span>
              )}
              {isOverdue && (
                <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded text-xs font-medium">
                  Overdue
                </span>
              )}
            </div>
            <p className="text-sm text-gray-600">
              {assignment.subjectId?.name} ({assignment.subjectId?.code})
            </p>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={onEdit}
              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
              title="Edit Assignment"
            >
              <Edit className="w-4 h-4" />
            </button>
            <button
              onClick={onDelete}
              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
              title="Delete Assignment"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Description */}
        {assignment.description && (
          <p className="text-sm text-gray-600 mb-3 line-clamp-2">
            {assignment.description}
          </p>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3 mb-3">
          <div className="flex items-center gap-2 text-sm">
            <Calendar className="w-4 h-4 text-gray-400" />
            <div className="flex flex-col">
              <span className="text-gray-600">
                {new Date(assignment.deadline).toLocaleDateString()}
              </span>
              <span className="text-xs text-gray-500">
                {new Date(assignment.deadline).toLocaleTimeString([], { 
                  hour: '2-digit', 
                  minute: '2-digit' 
                })}
              </span>
            </div>
          </div>
          
          <div className="flex items-center gap-2 text-sm">
            <Award className="w-4 h-4 text-gray-400" />
            <span className="text-gray-600">{assignment.maxMarks} marks</span>
          </div>
          
          <div className="flex items-center gap-2 text-sm">
            <Users className="w-4 h-4 text-gray-400" />
            <span className="text-gray-600">
              {assignment.groups?.length || 0} group{assignment.groups?.length !== 1 ? 's' : ''}
            </span>
          </div>
          
          <div className="flex items-center gap-2 text-sm">
            <FileText className="w-4 h-4 text-gray-400" />
            <span className="text-gray-600">
              {assignment.submissionCount || 0} student{assignment.submissionCount !== 1 ? 's' : ''}
            </span>
          </div>
        </div>

        {/* Progress Bar */}
        {assignment.submissionCount && assignment.submissionCount > 0 && (
          <div className="mb-3">
            <div className="flex justify-between text-xs text-gray-600 mb-1">
              <span>Submissions</span>
              <span>
                {assignment.submittedCount || 0}/{assignment.submissionCount || 0} ({submissionRate.toFixed(0)}%)
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${submissionRate}%` }}
              />
            </div>
          </div>
        )}

        {/* Footer Stats */}
        <div className="flex items-center justify-between pt-3 border-t border-gray-200">
          <div className="flex items-center gap-4 text-xs flex-wrap">
            <span className="flex items-center gap-1 text-green-600">
              <CheckCircle className="w-3 h-3" />
              {assignment.gradedCount || 0} graded
            </span>
            <span className="flex items-center gap-1 text-orange-600">
              <AlertCircle className="w-3 h-3" />
              {assignment.ungradedCount || 0} pending
            </span>
            <span className="flex items-center gap-1 text-gray-500">
              <XCircle className="w-3 h-3" />
              {assignment.notSubmittedCount || 0} not submitted
            </span>
          </div>

          {assignment.fileUrl && (
            <a
              href={assignment.fileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 font-medium transition"
              onClick={(e) => e.stopPropagation()}
            >
              <Download className="w-3 h-3" />
              File
            </a>
          )}
        </div>
      </div>
    </div>
  );
}