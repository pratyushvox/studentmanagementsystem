import { useState, useEffect } from "react";
import {
  BookOpen,
  Search,
  Filter,
  Plus,
  Award,
  Users,
  Clock,
  Save
} from "lucide-react";
import Navbar from "../../components/Navbar";
import Sidebar from "../../components/Sidebar";
import ConfirmDialog from "../../components/Confirmationdialogue";
import UserFormModal from "../../components/Userformmodal";
import StatsCard from "../../components/Cardstats";
import { LoadingSpinner, ErrorDisplay } from "../../components/Loadingerror";
import { useApiGet, useApiPost, useApiPut, useApiDelete } from "../../hooks/useApi";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import SubjectCard from "../../components/Subjectcard";

interface Teacher {
  _id: string;
  teacherId: string;
  userId: string; 
  fullName: string;
  email: string;
  department: string;
  specialization: string;
}
interface Subject {
  _id: string;
  code: string;
  name: string;
  semester: number;
  credits: number;
  description?: string;
  isActive: boolean;
  createdBy: { fullName: string };
  teachersCount?: number;
  groupsCount?: number;
  studentsCount?: number;
}

export default function AdminCourses() {
  const [activeItem, setActiveItem] = useState("courses");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterSemester, setFilterSemester] = useState("all");
  const [filterActive, setFilterActive] = useState("all");
  
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAssignTeacherModal, setShowAssignTeacherModal] = useState(false);
  const [expandedSubjectId, setExpandedSubjectId] = useState<string | null>(null);
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const [filteredSubjects, setFilteredSubjects] = useState<Subject[]>([]);
  const [selectedTeacherForAssign, setSelectedTeacherForAssign] = useState("");
  const [selectedGroupsForAssign, setSelectedGroupsForAssign] = useState<string[]>([]);

  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    type: "danger" as const,
    title: "",
    message: "",
    onConfirm: () => {}
  });

  const [newSubject, setNewSubject] = useState({
    code: "",
    name: "",
    semester: "1",
    credits: "3",
    description: ""
  });

  // API Hooks
  const {
    data: subjectsData,
    loading: subjectsLoading,
    error: subjectsError,
    refetch: refetchSubjects
  } = useApiGet("/admin/subjects", {
    autoFetch: true,
    onError: (err) => toast.error(`Failed to load subjects: ${err}`)
  });

  const {
    data: teachersData,
    loading: teachersLoading
  } = useApiGet("/admin/teachers-with-details", {
    autoFetch: true,
    onError: (err) => toast.error(`Failed to load teachers: ${err}`)
  });

  const {
    data: groupsData,
    loading: groupsLoading
  } = useApiGet("/admin/groups", {
    autoFetch: true,
    onError: (err) => toast.error(`Failed to load groups: ${err}`)
  });

  const { post: createSubjectApi } = useApiPost({
    onSuccess: () => {
      toast.success("Subject created successfully!");
      setShowAddModal(false);
      setNewSubject({
        code: "",
        name: "",
        semester: "1",
        credits: "3",
        description: ""
      });
      refetchSubjects();
    },
    onError: (err) => toast.error(err || "Failed to create subject")
  });

  const { put: updateSubjectApi } = useApiPut({
    onSuccess: () => {
      toast.success("Subject updated successfully!");
      setShowEditModal(false);
      setSelectedSubject(null);
      refetchSubjects();
    },
    onError: (err) => toast.error(err || "Failed to update subject")
  });

  const { delete: deleteSubjectApi } = useApiDelete({
    onSuccess: () => {
      toast.success("Subject deleted successfully!");
      refetchSubjects();
      if (expandedSubjectId) setExpandedSubjectId(null);
    },
    onError: (err) => toast.error(err || "Failed to delete subject")
  });

  const { post: assignTeacherApi } = useApiPost({
    onSuccess: () => {
      toast.success("Teacher assigned successfully!");
      setShowAssignTeacherModal(false);
      setSelectedTeacherForAssign("");
      setSelectedGroupsForAssign([]);
      refetchSubjects();
    },
    onError: (err) => toast.error(err || "Failed to assign teacher")
  });

  // Get data from API
  const subjects = Array.isArray(subjectsData) ? subjectsData : subjectsData?.subjects || [];
  const teachers = Array.isArray(teachersData) ? teachersData : teachersData?.teachers || [];
  const groups = Array.isArray(groupsData) ? groupsData : groupsData?.data || [];

  // Form fields
  const subjectAddFields = [
    {
      name: "code",
      label: "Subject Code",
      type: "text" as const,
      placeholder: "e.g., CS101",
      required: true
    },
    {
      name: "name",
      label: "Subject Name",
      type: "text" as const,
      placeholder: "e.g., Introduction to Programming",
      required: true
    },
    {
      name: "semester",
      label: "Semester",
      type: "select" as const,
      required: true,
      options: [
        { value: "1", label: "Semester 1" },
        { value: "2", label: "Semester 2" },
        { value: "3", label: "Semester 3" },
        { value: "4", label: "Semester 4" },
        { value: "5", label: "Semester 5" },
        { value: "6", label: "Semester 6" },
        { value: "7", label: "Semester 7" },
        { value: "8", label: "Semester 8" }
      ]
    },
    {
      name: "credits",
      label: "Credits",
      type: "number" as const,
      placeholder: "e.g., 3",
      required: true
    },
    {
      name: "description",
      label: "Description",
      type: "textarea" as const,
      placeholder: "Enter subject description",
      required: false
    }
  ];

  const subjectEditFields = [
    {
      name: "name",
      label: "Subject Name",
      type: "text" as const,
      required: true
    },
    {
      name: "credits",
      label: "Credits",
      type: "number" as const,
      required: true
    },
    {
      name: "description",
      label: "Description",
      type: "textarea" as const,
      required: false
    }
  ];

  // Filter subjects
  useEffect(() => {
    let filtered = [...subjects];

    if (searchTerm) {
      filtered = filtered.filter(
        (subject) =>
          subject.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          subject.code?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (filterSemester !== "all") {
      filtered = filtered.filter(
        (subject) => subject.semester?.toString() === filterSemester
      );
    }

    if (filterActive !== "all") {
      if (filterActive === "active") {
        filtered = filtered.filter((s) => s.isActive);
      } else if (filterActive === "inactive") {
        filtered = filtered.filter((s) => !s.isActive);
      }
    }

    setFilteredSubjects(filtered);
  }, [subjects, searchTerm, filterSemester, filterActive]);

  // Handlers
  const handleAddSubject = async (e: { preventDefault: () => void }) => {
    e.preventDefault();
    await createSubjectApi("/admin/subjects", {
      ...newSubject,
      semester: parseInt(newSubject.semester),
      credits: parseInt(newSubject.credits)
    });
  };

  const handleEditSubject = async (e: { preventDefault: () => void }) => {
    e.preventDefault();
    if (!selectedSubject) return;
    await updateSubjectApi(`/admin/subjects/${selectedSubject._id}`, {
      name: selectedSubject.name,
      credits: parseInt(selectedSubject.credits?.toString() || "3"),
      description: selectedSubject.description
    });
  };

  const handleDeleteSubject = async (subject: Subject) => {
    await deleteSubjectApi(`/admin/subjects/${subject._id}`);
  };

const handleAssignTeacher = async (e: { preventDefault: () => void }) => {
  e.preventDefault();
  if (!selectedSubject || !selectedTeacherForAssign) return;

  await assignTeacherApi(
    `/admin/teachers/${selectedTeacherForAssign}/subjects`,
    {
      subjectId: selectedSubject._id,
      semester: selectedSubject.semester, 
      groups: selectedGroupsForAssign
    }
  );
};

  const handleExpandSubject = (subject: Subject) => {
    if (expandedSubjectId === subject._id) {
      setExpandedSubjectId(null);
    } else {
      setExpandedSubjectId(subject._id);
      setSelectedSubject(subject);
    }
  };

  const openEditModal = (subject: Subject) => {
    setSelectedSubject(subject);
    setShowEditModal(true);
  };

  const openDeleteConfirm = (subject: Subject) => {
    setConfirmDialog({
      isOpen: true,
      type: "danger",
      title: "Delete Subject",
      message: `Are you sure you want to delete <strong>${subject.name}</strong>? This action cannot be undone.`,
      onConfirm: () => handleDeleteSubject(subject)
    });
  };

  const openAssignTeacherModal = (subject: Subject) => {
    setSelectedSubject(subject);
    setSelectedTeacherForAssign("");
    setSelectedGroupsForAssign([]);
    setShowAssignTeacherModal(true);
  };

  if (subjectsLoading) {
    return <LoadingSpinner message="Loading subjects..." />;
  }

  if (subjectsError) {
    return (
      <ErrorDisplay
        error={subjectsError}
        onRetry={refetchSubjects}
        title="Error Loading Subjects"
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <Sidebar activeItem={activeItem} onItemClick={setActiveItem} userRole="admin" />

      <main className="lg:ml-64 p-6 lg:p-8">
        <div className="mt-10">
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">Course Management</h1>
              <p className="text-gray-600 text-sm mt-1">
                Manage all subjects, assign teachers, and track enrollments
              </p>
            </div>
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add Subject
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
            <StatsCard
              title="Total Subjects"
              count={subjects.length}
              subtitle="active courses"
              icon={BookOpen}
              iconColor="text-blue-600"
              iconBg="bg-blue-100"
            />

            <StatsCard
              title="Total Credits"
              count={subjects.reduce((sum, s) => sum + (s.credits || 0), 0)}
              subtitle="credit hours"
              icon={Award}
              iconColor="text-indigo-600"
              iconBg="bg-indigo-100"
            />

            <StatsCard
              title="Teachers Assigned"
              count={subjects.reduce((sum, s) => sum + (s.teachersCount || 0), 0)}
              subtitle="total assignments"
              icon={Users}
              iconColor="text-green-600"
              iconBg="bg-green-100"
            />

            <StatsCard
              title="Total Students"
              count={subjects.reduce((sum, s) => sum + (s.studentsCount || 0), 0)}
              subtitle="enrolled"
              icon={Clock}
              iconColor="text-purple-600"
              iconBg="bg-purple-100"
            />
          </div>

          {/* Filters */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by name or code..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="relative">
                <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <select
                  value={filterSemester}
                  onChange={(e) => setFilterSemester(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none"
                >
                  <option value="all">All Semesters</option>
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => (
                    <option key={sem} value={sem.toString()}>
                      Semester {sem}
                    </option>
                  ))}
                </select>
              </div>

              <div className="relative">
                <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <select
                  value={filterActive}
                  onChange={(e) => setFilterActive(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none"
                >
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>

              <div className="flex items-center gap-2 text-sm text-gray-600">
                <span>Showing {filteredSubjects.length} of {subjects.length}</span>
              </div>
            </div>
          </div>

          {/* Subjects List - Using Imported SubjectCard */}
          <div className="space-y-3">
            {filteredSubjects.length > 0 ? (
              filteredSubjects.map((subject) => (
                <SubjectCard
                  key={subject._id}
                  subject={subject}
                  isExpanded={expandedSubjectId === subject._id}
                  onExpand={() => handleExpandSubject(subject)}
                  onEdit={() => openEditModal(subject)}
                  onDelete={() => openDeleteConfirm(subject)}
                  onAssignTeacher={() => openAssignTeacherModal(subject)}
                  onRemoveTeacher={() => {}}
                  groups={groups}
                />
              ))
            ) : (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
                <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No subjects found</p>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Add Subject Modal */}
      <UserFormModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSubmit={handleAddSubject}
        title="Add New Subject"
        formData={newSubject}
        setFormData={setNewSubject}
        fields={subjectAddFields}
        submitButtonText="Create Subject"
      />

      {/* Edit Subject Modal */}
      <UserFormModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        onSubmit={handleEditSubject}
        title="Edit Subject"
        formData={selectedSubject || {}}
        setFormData={setSelectedSubject}
        fields={subjectEditFields}
        submitButtonText="Update Subject"
      />

      {/* Assign Teacher Modal */}
      {showAssignTeacherModal && selectedSubject && (
        <AssignTeacherModal
          subject={selectedSubject}
          teachers={teachers}
          groups={groups}
          selectedTeacher={selectedTeacherForAssign}
          setSelectedTeacher={setSelectedTeacherForAssign}
          selectedGroups={selectedGroupsForAssign}
          setSelectedGroups={setSelectedGroupsForAssign}
          onSubmit={handleAssignTeacher}
          onClose={() => setShowAssignTeacherModal(false)}
          loading={teachersLoading || groupsLoading}
        />
      )}

      {/* Confirm Dialog */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        onClose={() => setConfirmDialog({ ...confirmDialog, isOpen: false })}
        onConfirm={confirmDialog.onConfirm}
        title={confirmDialog.title}
        message={confirmDialog.message}
        type={confirmDialog.type}
        confirmText="Delete"
      />
    </div>
  );
}

// Assign Teacher Modal Component
interface AssignTeacherModalProps {
  subject: Subject;
  teachers: Teacher[];
  groups: any[];
  selectedTeacher: string;
  setSelectedTeacher: (id: string) => void;
  selectedGroups: string[];
  setSelectedGroups: (ids: string[]) => void;
  onSubmit: (e: React.FormEvent) => void;
  onClose: () => void;
  loading: boolean;
}

function AssignTeacherModal({
  subject,
  teachers,
  groups,
  selectedTeacher,
  setSelectedTeacher,
  selectedGroups,
  setSelectedGroups,
  onSubmit,
  onClose,
  loading
}: AssignTeacherModalProps) {
  const semesterGroups = groups.filter(
    (g) => g.semester === subject.semester
  );

  const toggleGroup = (groupId: string) => {
    setSelectedGroups(
      selectedGroups.includes(groupId)
        ? selectedGroups.filter((id) => id !== groupId)
        : [...selectedGroups, groupId]
    );
  };

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-all duration-200">

      <div className="bg-white rounded-lg max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-bold mb-4">Assign Teacher to Subject</h2>

        <form onSubmit={onSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Teacher *
            </label>
            <select
              value={selectedTeacher}
              onChange={(e) => setSelectedTeacher(e.target.value)}
              required
              disabled={loading}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
            >
              <option value="">Choose a teacher...</option>
              {teachers.map((teacher) => (
                <option key={teacher._id} value={teacher._id}>
                  {teacher.fullName } 
                  {teacher.specialization && ` (${teacher.specialization})`}
                  {teacher.department && ` - ${teacher.department}`}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Assign to Groups (Optional)
            </label>
            <div className="space-y-2 max-h-48 overflow-y-auto border border-gray-200 rounded-lg p-3">
              {semesterGroups.length > 0 ? (
                semesterGroups.map((group) => (
                  <label key={group._id} className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedGroups.includes(group._id)}
                      onChange={() => toggleGroup(group._id)}
                      disabled={loading}
                      className="rounded text-blue-600"
                    />
                    <span className="text-sm text-gray-700">
                      {group.name} ({group.studentCount || 0}/{group.capacity} students)
                    </span>
                  </label>
                ))
              ) : (
                <p className="text-sm text-gray-500 text-center py-4">
                  No groups available for Semester {subject.semester}
                </p>
              )}
            </div>
          </div>

          <div className="flex gap-3 justify-end pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!selectedTeacher || loading}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              <Save size={16} />
              {loading ? "Assigning..." : "Assign Teacher"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}