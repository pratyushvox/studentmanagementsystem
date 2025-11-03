import { useState, useEffect } from "react";
import {
  BookOpen,
  Search,
  Filter,
  Plus,
  Award,
  Users,
  Clock,
  Save,
  Crown,
  UserCog
} from "lucide-react";
import Navbar from "../../components/Navbar";
import Sidebar from "../../components/Sidebar";
import ConfirmDialog from "../../components/Confirmationdialogue";
import UserFormModal from "../../components/Userformmodal";
import StatsCard from "../../components/Cardstats";
import { LoadingSpinner, ErrorDisplay } from "../../components/Loadingerror";
import { useApiGet, useApiPost, useApiPut, useApiDelete, useApiPatch } from "../../hooks/useApi";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import SubjectCard from "../../components/Subjectcard";
import SubjectAssignmentModal from "../../components/teachersubjectassignmentmodal";

interface Teacher {
  _id: string;
  teacherId: string;
  userId: string; 
  fullName: string;
  email: string;
  department: string;
  specialization: string;
  isModuleLeader?: boolean;
}

interface ModuleLeader {
  _id: string;
  fullName: string;
  email: string;
  teacherId: string;
  department: string;
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
  moduleLeader?: ModuleLeader;
  hasModuleLeader?: boolean;
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
  const [showAssignModuleLeaderModal, setShowAssignModuleLeaderModal] = useState(false);
  const [expandedSubjectId, setExpandedSubjectId] = useState<string | null>(null);
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const [filteredSubjects, setFilteredSubjects] = useState<Subject[]>([]);
  const [selectedTeacherForAssign, setSelectedTeacherForAssign] = useState("");
  const [selectedGroupsForAssign, setSelectedGroupsForAssign] = useState<string[]>([]);
  const [selectedModuleLeader, setSelectedModuleLeader] = useState("");

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
    description: "",
    moduleLeaderId: ""
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
        description: "",
        moduleLeaderId: ""
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

  const { patch: assignModuleLeaderApi } = useApiPatch({
    onSuccess: () => {
      toast.success("Module leader assigned successfully!");
      setShowAssignModuleLeaderModal(false);
      setSelectedModuleLeader("");
      refetchSubjects();
    },
    onError: (err) => toast.error(err || "Failed to assign module leader")
  });

  const { delete: removeModuleLeaderApi } = useApiDelete({
    onSuccess: () => {
      toast.success("Module leader removed successfully!");
      refetchSubjects();
    },
    onError: (err) => toast.error(err || "Failed to remove module leader")
  });

  // Get data from API
  const subjects = Array.isArray(subjectsData) ? subjectsData : subjectsData?.subjects || [];
  const teachers = Array.isArray(teachersData) ? teachersData : teachersData?.teachers || [];
  const groups = Array.isArray(groupsData) ? groupsData : groupsData?.data || [];

  // Calculate stats
  const subjectsWithModuleLeader = subjects.filter(s => s.hasModuleLeader || s.moduleLeader).length;

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
    },
    {
      name: "moduleLeaderId",
      label: "Module Leader (Optional)",
      type: "select" as const,
      required: false,
      options: [
        { value: "", label: "Assign later" },
        ...teachers.map(t => ({
          value: t._id,
          label: `${t.fullName}${t.department ? ` - ${t.department}` : ''}`
        }))
      ]
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
      credits: parseInt(newSubject.credits),
      ...(newSubject.moduleLeaderId && { moduleLeaderId: newSubject.moduleLeaderId })
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
      groups: selectedGroupsForAssign
      
    }
  );
};
  const handleAssignModuleLeader = async (e: { preventDefault: () => void }) => {
    e.preventDefault();
    if (!selectedSubject || !selectedModuleLeader) return;

    await assignModuleLeaderApi(
      `/admin/subjects/${selectedSubject._id}/module-leader`,
      { moduleLeaderId: selectedModuleLeader }
    );
  };

  const handleRemoveModuleLeader = async (subject: Subject) => {
    await removeModuleLeaderApi(`/admin/subjects/${subject._id}/module-leader`);
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

  const openAssignModuleLeaderModal = (subject: Subject) => {
    setSelectedSubject(subject);
    setSelectedModuleLeader(subject.moduleLeader?._id || "");
    setShowAssignModuleLeaderModal(true);
  };

  const openRemoveModuleLeaderConfirm = (subject: Subject) => {
    setConfirmDialog({
      isOpen: true,
      type: "warning",
      title: "Remove Module Leader",
      message: `Are you sure you want to remove <strong>${subject.moduleLeader?.fullName}</strong> as module leader for <strong>${subject.name}</strong>?`,
      onConfirm: () => handleRemoveModuleLeader(subject)
    });
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
                Manage subjects, assign module leaders and teachers
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
              title="Module Leaders"
              count={subjectsWithModuleLeader}
              subtitle="subjects with leaders"
              icon={Crown}
              iconColor="text-yellow-600"
              iconBg="bg-yellow-100"
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

          {/* Subjects List */}
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
                  onAssignModuleLeader={() => openAssignModuleLeaderModal(subject)}
                  onRemoveModuleLeader={() => openRemoveModuleLeaderConfirm(subject)}
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

      {/* Assign Teacher Modal - Using SubjectAssignmentModal */}
      {showAssignTeacherModal && selectedSubject && (
        <SubjectAssignmentModal
          isOpen={showAssignTeacherModal}
          onClose={() => setShowAssignTeacherModal(false)}
          onSubmit={handleAssignTeacher}
          subject={selectedSubject}
          teachers={teachers}
          groups={groups}
          selectedTeacher={selectedTeacherForAssign}
          setSelectedTeacher={setSelectedTeacherForAssign}
          selectedGroups={selectedGroupsForAssign}
          setSelectedGroups={setSelectedGroupsForAssign}
          loading={teachersLoading || groupsLoading}
          type="regular-teacher"
        />
      )}

      {/* Assign Module Leader Modal - Using SubjectAssignmentModal */}
      {showAssignModuleLeaderModal && selectedSubject && (
        <SubjectAssignmentModal
          isOpen={showAssignModuleLeaderModal}
          onClose={() => setShowAssignModuleLeaderModal(false)}
          onSubmit={handleAssignModuleLeader}
          subject={selectedSubject}
          teachers={teachers}
          selectedTeacher={selectedModuleLeader}
          setSelectedTeacher={setSelectedModuleLeader}
          loading={teachersLoading}
          type="module-leader"
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
        confirmText={confirmDialog.type === "warning" ? "Remove" : "Delete"}
      />
    </div>
  );
}