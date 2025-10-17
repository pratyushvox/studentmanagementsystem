import { useState, useEffect } from 'react';
import { Users, BookOpen, GraduationCap, X } from 'lucide-react';
import { useApiGet } from '../hooks/useApi';

interface GroupDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  group: any;
}

export default function GroupDetailsModal({ 
  isOpen, 
  onClose, 
  group
}: GroupDetailsModalProps) {
  const [students, setStudents] = useState([]);

  // ✅ Updated API path with /admin prefix
  const { data: studentsData, loading, refetch } = useApiGet(
    group?._id ? `/admin/students?groupId=${group._id}` : '',
    {
      autoFetch: false,
      onSuccess: (data) => setStudents(data?.students || data || []),
      onError: (error) => {
        console.error('Error loading students:', error);
        setStudents([]);
      }
    }
  );

  useEffect(() => {
    if (isOpen && group?._id) {
      refetch();
    }
  }, [isOpen, group?._id]);

  if (!isOpen || !group) return null;

  return (
    <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-blue-600 to-blue-700">
          <div className="text-white">
            <h2 className="text-2xl font-bold">{group.name}</h2>
            <p className="text-blue-100 mt-1">
              Semester {group.semester} • Academic Year {group.academicYear}
            </p>
          </div>
          <button 
            onClick={onClose} 
            className="p-2 hover:bg-white/10 rounded-lg transition-colors text-white"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-100px)]">
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-xl">
              <Users className="w-8 h-8 text-blue-600 mb-2" />
              <p className="text-sm text-blue-600 font-medium">Total Students</p>
              <p className="text-2xl font-bold text-blue-900">{group.studentCount}</p>
            </div>
            <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-xl">
              <BookOpen className="w-8 h-8 text-green-600 mb-2" />
              <p className="text-sm text-green-600 font-medium">Subjects</p>
              <p className="text-2xl font-bold text-green-900">{group.subjectTeachers?.length || 0}</p>
            </div>
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-xl">
              <GraduationCap className="w-8 h-8 text-purple-600 mb-2" />
              <p className="text-sm text-purple-600 font-medium">Capacity</p>
              <p className="text-2xl font-bold text-purple-900">{group.capacity}</p>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-600" />
              Students in Group ({students.length})
            </h3>
            {loading ? (
              <div className="text-center py-8">
                <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
                <p className="text-gray-600 mt-3">Loading students...</p>
              </div>
            ) : students.length === 0 ? (
              <div className="text-center py-8 bg-gray-50 rounded-lg">
                <Users className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600">No students assigned yet</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {students.map((student: any, idx) => (
                  <div key={student._id || idx} className="bg-gray-50 p-3 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors">
                    <p className="font-medium text-gray-900">
                      {student.userId?.fullName || student.fullName || 'N/A'}
                    </p>
                    <p className="text-sm text-gray-600">
                      {student.userId?.email || student.email || 'No email'}
                    </p>
                    {student.studentId && (
                      <p className="text-xs text-gray-500 mt-1">
                        Student ID: {student.studentId}
                      </p>
                    )}
                    {student.currentSemester && (
                      <p className="text-xs text-gray-500">
                        Current Semester: {student.currentSemester}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}