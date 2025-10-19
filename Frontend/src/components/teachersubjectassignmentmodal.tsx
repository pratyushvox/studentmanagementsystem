import { Crown, UserPlus } from "lucide-react";

interface Teacher {
  _id: string;
  teacherId?: string;
  fullName: string;
  email?: string;
  department?: string;
  specialization?: string;
  isModuleLeader?: boolean;
}

interface Group {
  _id: string;
  name: string;
  studentCount?: number;
  capacity?: number;
  semester: number;
}

interface Subject {
  _id: string;
  name: string;
  code: string;
  semester: number;
}

interface SubjectAssignmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  subject: Subject;
  teachers: Teacher[];
  groups?: Group[];
  selectedTeacher: string;
  setSelectedTeacher: (id: string) => void;
  selectedGroups?: string[];
  setSelectedGroups?: (ids: string[]) => void;
  loading: boolean;
  type: "module-leader" | "regular-teacher";
}

export default function SubjectAssignmentModal({
  isOpen,
  onClose,
  onSubmit,
  subject,
  teachers,
  groups = [],
  selectedTeacher,
  setSelectedTeacher,
  selectedGroups = [],
  setSelectedGroups,
  loading,
  type
}: SubjectAssignmentModalProps) {
  if (!isOpen) return null;

  const semesterGroups = groups.filter(g => g.semester === subject.semester);

  const toggleGroup = (groupId: string) => {
    if (!setSelectedGroups) return;
    setSelectedGroups(
      selectedGroups.includes(groupId)
        ? selectedGroups.filter(id => id !== groupId)
        : [...selectedGroups, groupId]
    );
  };

  const modalConfig = {
    "module-leader": {
      title: "Assign Module Leader",
      icon: Crown,
      iconColor: "text-yellow-600",
      buttonColor: "bg-yellow-600 hover:bg-yellow-700",
      noteText: "Module leaders can create main assignments that are posted to all students in the semester.",
      noteBg: "bg-yellow-50 border-yellow-200 text-yellow-800",
      selectLabel: "Select Module Leader",
      buttonText: "Assign Module Leader",
      showGroups: false
    },
    "regular-teacher": {
      title: "Assign Teacher to Subject",
      icon: UserPlus,
      iconColor: "text-blue-600",
      buttonColor: "bg-blue-600 hover:bg-blue-700",
      noteText: null,
      noteBg: "",
      selectLabel: "Select Teacher",
      buttonText: "Assign Teacher",
      showGroups: true
    }
  };

  const config = modalConfig[type];
  const IconComponent = config.icon;

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div 
        className="bg-white rounded-lg max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center gap-2 mb-4">
          <IconComponent className={`w-6 h-6 ${config.iconColor}`} />
          <h2 className="text-xl font-bold text-gray-900">{config.title}</h2>
        </div>

        {/* Note (for module leader only) */}
        {config.noteText && (
          <div className={`mb-4 p-3 border rounded-lg ${config.noteBg}`}>
            <p className="text-sm">
              <strong>Note:</strong> {config.noteText}
            </p>
          </div>
        )}

        <form onSubmit={onSubmit} className="space-y-6">
          {/* Subject Info */}
          <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-gray-600">Subject:</span>
                <p className="font-semibold text-gray-900">{subject.name}</p>
              </div>
              <div>
                <span className="text-gray-600">Semester:</span>
                <p className="font-semibold text-gray-900">{subject.semester}</p>
              </div>
            </div>
          </div>

          {/* Teacher Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {config.selectLabel} *
            </label>
            <select
              value={selectedTeacher}
              onChange={(e) => setSelectedTeacher(e.target.value)}
              required
              disabled={loading}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
            >
              <option value="">Choose a teacher...</option>
              {teachers.map((teacher) => (
                <option key={teacher._id} value={teacher._id}>
                  {teacher.fullName}
                  {teacher.isModuleLeader && " ⭐"}
                  {teacher.specialization && ` (${teacher.specialization})`}
                  {teacher.department && ` - ${teacher.department}`}
                </option>
              ))}
            </select>
            {teachers.length === 0 && (
              <p className="mt-2 text-sm text-amber-600">
                No teachers available. Please create teachers first.
              </p>
            )}
          </div>

          {/* Groups Selection (for regular teacher only) */}
          {config.showGroups && setSelectedGroups && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Assign to Groups (Optional)
              </label>
              <div className="space-y-2 max-h-48 overflow-y-auto border border-gray-200 rounded-lg p-3 bg-gray-50">
                {semesterGroups.length > 0 ? (
                  semesterGroups.map((group) => (
                    <label 
                      key={group._id} 
                      className="flex items-center gap-3 p-2 hover:bg-white rounded cursor-pointer transition"
                    >
                      <input
                        type="checkbox"
                        checked={selectedGroups.includes(group._id)}
                        onChange={() => toggleGroup(group._id)}
                        disabled={loading}
                        className="w-4 h-4 rounded text-blue-600 focus:ring-2 focus:ring-blue-500 disabled:cursor-not-allowed"
                      />
                      <span className="text-sm text-gray-700 flex-1">
                        {group.name}
                      </span>
                      <span className="text-xs text-gray-500">
                        {group.studentCount || 0}/{group.capacity || 0} students
                      </span>
                    </label>
                  ))
                ) : (
                  <p className="text-sm text-gray-500 text-center py-4">
                    No groups available for Semester {subject.semester}
                  </p>
                )}
              </div>
              {semesterGroups.length > 0 && (
                <p className="mt-2 text-xs text-gray-500">
                  {selectedGroups.length} group(s) selected
                </p>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 justify-end pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!selectedTeacher || loading}
              className={`flex items-center gap-2 px-4 py-2 text-white rounded-lg transition shadow-md hover:shadow-lg disabled:bg-gray-300 disabled:cursor-not-allowed ${config.buttonColor}`}
            >
              <IconComponent size={16} />
              {loading ? "Assigning..." : config.buttonText}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}