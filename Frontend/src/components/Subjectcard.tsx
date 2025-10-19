import { useState, useEffect } from "react";
import { 
  ChevronDown, 
  Edit2, 
  Trash2, 
  Plus, 
  Users, 
  Award,
  GraduationCap,
  Mail,
  Trash,
  AlertCircle,
  Crown,
  UserCog
} from "lucide-react";
import { toast } from "react-toastify";
import ConfirmDialog from "../components/Confirmationdialogue"; 

interface ModuleLeader {
  _id: string;
  fullName: string;
  email: string;
  teacherId: string;
  department: string;
}

interface SubjectCardProps {
  subject: {
    _id: string;
    code: string;
    name: string;
    semester: number;
    credits: number;
    description?: string;
    isActive: boolean;
    moduleLeader?: ModuleLeader;
    hasModuleLeader?: boolean;
    teachersCount?: number;
    groupsCount?: number;
    studentsCount?: number;
  };
  isExpanded: boolean;
  onExpand: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onAssignTeacher: () => void;
  onAssignModuleLeader?: () => void;
  onRemoveModuleLeader?: () => void;
  groups: any[];
}

interface TeacherDetail {
  _id: string;
  teacherId: string;
  fullName: string;
  email: string;
  department: string;
  specialization?: string;
  isModuleLeader?: boolean;
  groupsAssigned: Array<{
    _id: string;
    name: string;
    studentCount: number;
  }>;
}

export default function SubjectCard({
  subject,
  isExpanded,
  onExpand,
  onEdit,
  onDelete,
  onAssignTeacher,
  onAssignModuleLeader,
  onRemoveModuleLeader,
  groups
}: SubjectCardProps) {
  const [teacherDetails, setTeacherDetails] = useState<TeacherDetail[]>([]);
  const [loadingTeachers, setLoadingTeachers] = useState(false);

  // Confirmation dialog state
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [teacherToRemove, setTeacherToRemove] = useState<string | null>(null);

  // Fetch teacher details when expanded
  useEffect(() => {
    if (isExpanded && subject._id) {
      fetchTeacherDetails();
    }
  }, [isExpanded, subject._id]);

  const fetchTeacherDetails = async () => {
    setLoadingTeachers(true);
    try {
      const token = localStorage.getItem("token");
      
      // Fetch all teachers
      const teachersResponse = await fetch(
        "http://localhost:5000/api/admin/teachers-with-details",
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const teachersData = await teachersResponse.json();
      
      // Filter teachers assigned to this subject
      const assignedTeachers = (teachersData.teachers || [])
        .map((teacher: any) => {
          const subjectAssignment = teacher.assignedSubjects?.find(
            (s: any) => String(s.subjectId?._id || s.subjectId) === String(subject._id)
          );
          if (subjectAssignment) {
            return {
              _id: teacher._id,
              teacherId: teacher.teacherId,
              fullName: teacher.fullName,
              email: teacher.email,
              department: teacher.department,
              specialization: teacher.specialization,
              isModuleLeader: teacher.isModuleLeader,
              groupsAssigned: subjectAssignment.groups || []
            };
          }
          return null;
        })
        .filter(Boolean);

      setTeacherDetails(assignedTeachers as TeacherDetail[]);
    } catch (error) {
      console.error("Failed to fetch teacher details:", error);
      toast.error("Failed to load teacher details");
    } finally {
      setLoadingTeachers(false);
    }
  };

  const handleRemoveTeacher = async (teacherId: string) => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `http://localhost:5000/api/admin/teachers/${teacherId}/subjects/${subject._id}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (response.ok) {
        toast.success("Teacher removed successfully!");
        // refresh
        fetchTeacherDetails();
      } else {
        const data = await response.json();
        toast.error(data.message || "Failed to remove teacher");
      }
    } catch (error) {
      toast.error("Failed to remove teacher");
    } finally {
      // Close dialog and clear selected teacher after attempt
      setConfirmDialogOpen(false);
      setTeacherToRemove(null);
    }
  };

  const semesterGroups = groups.filter(g => g.semester === subject.semester);

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
      {/* Header - Clickable */}
      <div
        onClick={onExpand}
        className="p-5 cursor-pointer hover:bg-gray-50 transition flex items-center justify-between"
      >
        <div className="flex items-center flex-1">
          <ChevronDown
            size={20}
            className={`text-gray-400 mr-4 transition-transform ${isExpanded ? "rotate-180" : ""}`}
          />
          <div className="flex-1">
            <div className="flex items-center gap-3 flex-wrap">
              <h3 className="text-lg font-semibold text-gray-900">{subject.name}</h3>
              <span className="bg-blue-100 text-blue-700 px-2.5 py-0.5 rounded-full text-xs font-medium">
                {subject.code}
              </span>
              {!subject.isActive && (
                <span className="bg-gray-100 text-gray-700 px-2.5 py-0.5 rounded-full text-xs font-medium">
                  Inactive
                </span>
              )}
            </div>

            <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
              <span className="flex items-center gap-1">
                <Award className="w-4 h-4" />
                Semester {subject.semester}
              </span>
              <span className="flex items-center gap-1">
                <Award className="w-4 h-4" />
                {subject.credits} Credits
              </span>
              <span className="flex items-center gap-1">
                <GraduationCap className="w-4 h-4" />
                {subject.teachersCount || 0} Teachers
              </span>
              <span className="flex items-center gap-1">
                <Users className="w-4 h-4" />
                {subject.studentsCount || 0} Students
              </span>
            </div>

            {/* Module Leader Badge */}
            <div className="mt-3">
              {subject.moduleLeader ? (
                <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-yellow-50 to-amber-50 border border-yellow-300 rounded-lg">
                  <Crown className="w-4 h-4 text-yellow-600" />
                  <span className="text-sm font-semibold text-yellow-800">
                    Module Leader: {subject.moduleLeader.fullName}
                  </span>
                  <span className="text-xs text-yellow-600">
                    ({subject.moduleLeader.teacherId})
                  </span>
                </div>
              ) : (
                <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg">
                  <Crown className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-500">No Module Leader Assigned</span>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 ml-4">
          {/* Module Leader Button */}
          {subject.moduleLeader ? (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onRemoveModuleLeader?.();
              }}
              className="p-2 text-yellow-600 hover:bg-yellow-50 rounded-lg transition"
              title="Remove module leader"
            >
              <Crown size={18} />
            </button>
          ) : (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onAssignModuleLeader?.();
              }}
              className="p-2 text-yellow-600 hover:bg-yellow-50 rounded-lg transition"
              title="Assign module leader"
            >
              <Crown size={18} />
            </button>
          )}

          <button
            onClick={(e) => {
              e.stopPropagation();
              onEdit();
            }}
            className="p-2 text-gray-600 hover:bg-blue-50 hover:text-blue-600 rounded-lg transition"
            title="Edit subject"
          >
            <Edit2 size={18} />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="p-2 text-gray-600 hover:bg-red-50 hover:text-red-600 rounded-lg transition"
            title="Delete subject"
          >
            <Trash2 size={18} />
          </button>
        </div>
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="border-t border-gray-200 bg-gray-50">
          <div className="p-5 space-y-6">
            {/* Module Leader Details (Expanded View) */}
            {subject.moduleLeader && (
              <div className="bg-gradient-to-r from-yellow-50 to-amber-50 rounded-lg p-4 border border-yellow-200">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Crown className="w-5 h-5 text-yellow-600" />
                      <h4 className="font-semibold text-gray-900">Module Leader</h4>
                    </div>
                    <div className="space-y-1 text-sm">
                      <p className="font-medium text-gray-900">{subject.moduleLeader.fullName}</p>
                      <div className="flex items-center gap-1 text-gray-600">
                        <Mail className="w-3 h-3" />
                        {subject.moduleLeader.email}
                      </div>
                      <p className="text-xs text-gray-600">
                        ID: {subject.moduleLeader.teacherId} • {subject.moduleLeader.department}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onRemoveModuleLeader?.();
                    }}
                    className="text-yellow-600 hover:bg-yellow-100 p-2 rounded-lg transition"
                    title="Remove module leader"
                  >
                    <Trash className="w-4 h-4" />
                  </button>
                </div>
                <div className="mt-3 pt-3 border-t border-yellow-200">
                  <p className="text-xs text-yellow-800">
                    <strong>Note:</strong> Module leader can create main assignments for all students in this semester.
                  </p>
                </div>
              </div>
            )}

            {/* Description */}
            {subject.description && (
              <div>
                <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  Description
                </h4>
                <p className="text-sm text-gray-600 bg-white rounded-lg p-3 border border-gray-200">
                  {subject.description}
                </p>
              </div>
            )}

            {/* Assigned Teachers */}
            <div>
              <div className="flex justify-between items-center mb-3">
                <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                  <GraduationCap className="w-5 h-5 text-purple-600" />
                  Assigned Teachers ({teacherDetails.length})
                </h4>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onAssignTeacher();
                  }}
                  className="flex items-center gap-1 bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white px-3 py-1.5 rounded-lg text-sm transition shadow-md hover:shadow-lg"
                >
                  <Plus size={16} />
                  Assign Teacher
                </button>
              </div>

              {loadingTeachers ? (
                <div className="text-center py-4">
                  <div className="animate-spin w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full mx-auto"></div>
                  <p className="text-sm text-gray-500 mt-2">Loading teachers...</p>
                </div>
              ) : teacherDetails.length > 0 ? (
                <div className="space-y-3">
                  {teacherDetails.map((teacher) => (
                    <div
                      key={teacher._id}
                      className="bg-white rounded-lg p-4 border border-gray-200 hover:border-purple-200 transition"
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex items-start gap-3 flex-1">
                          <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-semibold flex-shrink-0">
                            {teacher.fullName?.charAt(0).toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <h5 className="font-semibold text-gray-900">{teacher.fullName}</h5>
                              {teacher.isModuleLeader && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-yellow-100 text-yellow-700 rounded text-xs font-medium">
                                  <Crown className="w-3 h-3" />
                                  Leader
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-gray-600 mt-0.5">
                              {teacher.teacherId} • {teacher.department}
                            </p>
                            <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
                              <Mail className="w-3 h-3" />
                              {teacher.email}
                            </div>
                            {teacher.specialization && (
                              <p className="text-xs text-purple-600 mt-1">
                                Specialization: {teacher.specialization}
                              </p>
                            )}
                          </div>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setTeacherToRemove(teacher._id);
                            setConfirmDialogOpen(true);
                          }}
                          className="text-red-600 hover:bg-red-50 p-2 rounded-lg transition flex-shrink-0"
                          title="Remove teacher"
                        >
                          <Trash className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Groups assigned to this teacher */}
                      {teacher.groupsAssigned && teacher.groupsAssigned.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-gray-200">
                          <p className="text-xs font-medium text-gray-700 mb-2">Teaching Groups:</p>
                          <div className="flex flex-wrap gap-2">
                            {teacher.groupsAssigned.map((group) => (
                              <span 
                                key={group._id} 
                                className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium"
                              >
                                {group.name} ({group.studentCount} students)
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 bg-white rounded-lg border border-gray-200">
                  <GraduationCap className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 text-sm">No teachers assigned yet</p>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onAssignTeacher();
                    }}
                    className="mt-3 text-blue-600 hover:text-blue-700 text-sm font-medium"
                  >
                    Assign your first teacher →
                  </button>
                </div>
              )}
            </div>

            {/* Available Groups */}
            <div>
              <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <Users className="w-5 h-5 text-green-600" />
                Available Groups in Semester {subject.semester} ({semesterGroups.length})
              </h4>

              {semesterGroups.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {semesterGroups.map((group) => (
                    <div
                      key={group._id}
                      className="bg-white rounded-lg p-3 border border-gray-200 hover:border-green-200 transition"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <h5 className="font-semibold text-gray-900 text-sm">{group.name}</h5>
                          <p className="text-xs text-gray-600 mt-1">
                            {group.studentCount || 0}/{group.capacity || 0} students
                          </p>
                        </div>
                        {group.teacherId ? (
                          <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-medium">
                            Assigned
                          </span>
                        ) : (
                          <span className="px-2 py-1 bg-orange-100 text-orange-700 rounded text-xs font-medium">
                            Unassigned
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 bg-white rounded-lg border border-gray-200">
                  <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 text-sm">No groups available for this semester</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Confirm Dialog for removing teacher */}
      <ConfirmDialog
        isOpen={confirmDialogOpen}
        onClose={() => {
          setConfirmDialogOpen(false);
          setTeacherToRemove(null);
        }}
        onConfirm={() => {
          if (teacherToRemove) handleRemoveTeacher(teacherToRemove);
        }}
        title="Remove Teacher"
        message={`Are you sure you want to remove this teacher from <strong>${subject.name}</strong>? This action cannot be undone.`}
        confirmText="Remove"
        cancelText="Cancel"
        type="danger"
      />
    </div>
  );
}