import { BookOpen, Users, X } from "lucide-react";

interface Subject {
  subjectId: {
    _id: string;
    name: string;
    code: string;
  };
  semester: number;
  groups: Array<{
    _id: string;
    name: string;
    studentCount: number;
  }>;
}

interface TeacherSubjectsModalProps {
  isOpen: boolean;
  onClose: () => void;
  teacher: {
    fullName: string;
    teacherId: string;
  };
  subjects: Subject[];
}

export default function TeacherSubjectsModal({ 
  isOpen, 
  onClose, 
  teacher, 
  subjects 
}: TeacherSubjectsModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Blurry Backdrop */}
      <div 
        className="absolute inset-0 bg-gray-500/30 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[85vh] overflow-hidden transform transition-all">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-2xl font-bold">{teacher.fullName}</h2>
              <p className="text-blue-100 text-sm mt-1">{teacher.teacherId}</p>
              <div className="flex items-center gap-4 mt-2">
                <div className="flex items-center gap-1 text-blue-100">
                  <BookOpen className="w-4 h-4" />
                  <span className="text-sm">
                    {subjects.length} Subject{subjects.length !== 1 ? 's' : ''}
                  </span>
                </div>
                <div className="flex items-center gap-1 text-blue-100">
                  <Users className="w-4 h-4" />
                  <span className="text-sm">
                    {subjects.reduce((total, subject) => total + subject.groups.length, 0)} Groups
                  </span>
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:bg-white/20 rounded-lg p-2 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(85vh-120px)]">
          {subjects.length > 0 ? (
            <div className="space-y-6">
              {subjects.map((subject, idx) => (
                <div key={idx} className="bg-gray-50 rounded-xl p-5 border border-gray-200 hover:border-blue-200 transition-colors">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 text-lg mb-1">
                        {subject.subjectId.name}
                      </h3>
                      <p className="text-sm text-gray-600 mb-2">
                        Code: {subject.subjectId.code}
                      </p>
                      <div className="flex items-center gap-3 text-sm text-gray-700">
                        <span className="bg-blue-100 text-blue-700 px-2.5 py-1 rounded-full font-medium">
                          Semester {subject.semester}
                        </span>
                        <span className="text-gray-500">
                          {subject.groups.length} Group{subject.groups.length !== 1 ? 's' : ''}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  {subject.groups.length > 0 ? (
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                        <Users className="w-4 h-4" />
                        Teaching Groups
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {subject.groups.map((group) => (
                          <div 
                            key={group._id} 
                            className="bg-white rounded-lg p-3 border border-gray-300 hover:border-green-400 transition-colors"
                          >
                            <div className="flex justify-between items-center">
                              <span className="font-medium text-gray-900">
                                {group.name}
                              </span>
                              <span className="text-sm text-green-600 font-medium">
                                {group.studentCount} student{group.studentCount !== 1 ? 's' : ''}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-4">
                      <Users className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                      <p className="text-gray-500 text-sm">No groups assigned for this subject</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-500 mb-2">
                No Subjects Assigned
              </h3>
              <p className="text-gray-400 text-sm">
                This teacher doesn't have any subjects assigned yet.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}