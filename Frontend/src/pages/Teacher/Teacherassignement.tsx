import { useState, useEffect } from "react";
import {
  Plus,
  FileText,
  Calendar,
  Clock,
  Users,
  Award,
  Crown,
  Edit,
  Trash2,
  Download,
  AlertCircle,
  CheckCircle,
  XCircle,
  Upload,
  Search,
  Filter
} from "lucide-react";
import Navbar from "../../components/Navbar";
import Sidebar from "../../components/Sidebar";
import { LoadingSpinner, ErrorDisplay, EmptyState } from "../../components/Loadingerror";
import { FormInput, FormSelect, FormTextarea } from "../../components/FormInput";
import AssignmentCard from "../../components/Assignmentcardmodal";
import ConfirmDialog from "../../components/Confirmationdialogue";
import { useApiGet, useApiUpload, useApiDelete, useApiPut } from "../../hooks/useApi";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

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

interface Subject {
  _id: string;
  name: string;
  code: string;
  semester: number;
}

interface Group {
  _id: string;
  name: string;
  semester: number;
  studentCount: number;
  capacity: number;
}

export default function TeacherAssignments() {
  const [activeItem, setActiveItem] = useState("assignments");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
  const [filterType, setFilterType] = useState("all");
  const [filterSubject, setFilterSubject] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredAssignments, setFilteredAssignments] = useState<Assignment[]>([]);

  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: () => {}
  });

  const [newAssignment, setNewAssignment] = useState({
    title: "",
    description: "",
    subjectId: "",
    type: "weekly" as "main" | "weekly",
    groups: [] as string[],
    maxMarks: "100",
    deadline: ""
  });

  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // API Hooks
  const {
    data: assignmentsData,
    loading: assignmentsLoading,
    error: assignmentsError,
    refetch: refetchAssignments
  } = useApiGet<{ assignments: Assignment[] }>("/teacher/assignments", {
    autoFetch: true,
    onError: (err) => toast.error(`Failed to load assignments: ${err}`)
  });

  const {
    data: statsData,
    loading: statsLoading
  } = useApiGet("/teacher/assignments/statistics", {
    autoFetch: true
  });

  const {
    data: teacherData
  } = useApiGet("/teacher/dashboard", {
    autoFetch: true
  });

  const { upload: createAssignmentApi, loading: creating } = useApiUpload({
    onSuccess: () => {
      toast.success("Assignment created successfully!");
      setShowCreateModal(false);
      resetForm();
      refetchAssignments();
    },
    onError: (err) => toast.error(err || "Failed to create assignment")
  });

  const { put: updateAssignmentApi, loading: updating } = useApiPut({
    onSuccess: () => {
      toast.success("Assignment updated successfully!");
      setShowEditModal(false);
      setSelectedAssignment(null);
      refetchAssignments();
    },
    onError: (err) => toast.error(err || "Failed to update assignment")
  });

  const { delete: deleteAssignmentApi } = useApiDelete({
    onSuccess: () => {
      toast.success("Assignment deleted successfully!");
      refetchAssignments();
    },
    onError: (err) => toast.error(err || "Failed to delete assignment")
  });

  // Extract data
  const assignments = assignmentsData?.assignments || [];
  const stats = statsData?.statistics || {};
  const teacher = teacherData?.dashboard?.teacher || teacherData?.teacher;
  const isModuleLeader = teacher?.isModuleLeader || false;
  const assignedSubjects = teacher?.assignedSubjects || [];

  // Get unique subjects and groups
  const subjects: Subject[] = assignedSubjects
    .filter((as: any) => as.subjectId && as.subjectId._id)
    .map((as: any) => ({
      _id: as.subjectId._id,
      name: as.subjectId.name,
      code: as.subjectId.code,
      semester: as.semester
    }));

  const allGroups: Group[] = assignedSubjects
    .filter((as: any) => as.groups && as.groups.length > 0)
    .flatMap((as: any) =>
      as.groups.map((g: any) => ({
        _id: g._id,
        name: g.name,
        semester: as.semester,
        studentCount: g.studentCount || 0,
        capacity: g.capacity || 0
      }))
    );

  // Filter assignments
  useEffect(() => {
    let filtered = [...assignments];

    if (searchTerm) {
      filtered = filtered.filter(a =>
        a.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.subjectId?.name?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (filterType !== "all") {
      filtered = filtered.filter(a => a.type === filterType);
    }

    if (filterSubject !== "all") {
      filtered = filtered.filter(a => a.subjectId._id === filterSubject);
    }

    setFilteredAssignments(filtered);
  }, [assignments, searchTerm, filterType, filterSubject]);

  // Handlers
  const resetForm = () => {
    setNewAssignment({
      title: "",
      description: "",
      subjectId: "",
      type: "weekly",
      groups: [],
      maxMarks: "100",
      deadline: ""
    });
    setSelectedFile(null);
  };

  const handleCreateAssignment = async (e: React.FormEvent) => {
    e.preventDefault();

    const formData = new FormData();
    formData.append("title", newAssignment.title);
    formData.append("description", newAssignment.description);
    formData.append("subjectId", newAssignment.subjectId);
    formData.append("type", newAssignment.type);
    formData.append("maxMarks", newAssignment.maxMarks);
    formData.append("deadline", newAssignment.deadline);

    if (newAssignment.type === "weekly") {
      formData.append("groups", JSON.stringify(newAssignment.groups));
    }

    if (selectedFile) {
      formData.append("file", selectedFile);
    }

    await createAssignmentApi("/teacher/assignments", formData);
  };

  const handleUpdateAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAssignment) return;

    await updateAssignmentApi(`/teacher/assignments/${selectedAssignment._id}`, {
      title: selectedAssignment.title,
      description: selectedAssignment.description,
      maxMarks: selectedAssignment.maxMarks,
      deadline: selectedAssignment.deadline
    });
  };

  const handleDeleteAssignment = async (assignment: Assignment) => {
    await deleteAssignmentApi(`/teacher/assignments/${assignment._id}`);
  };

  const openEditModal = (assignment: Assignment) => {
    setSelectedAssignment(assignment);
    setShowEditModal(true);
  };

  const openDeleteConfirm = (assignment: Assignment) => {
    setConfirmDialog({
      isOpen: true,
      title: "Delete Assignment",
      message: `Are you sure you want to delete "<strong>${assignment.title}</strong>"? This action cannot be undone.`,
      onConfirm: () => handleDeleteAssignment(assignment)
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const getSubjectGroups = (subjectId: string) => {
    const subject = assignedSubjects.find((as: any) => as.subjectId._id === subjectId);
    return subject?.groups || [];
  };

  if (assignmentsLoading) {
    return <LoadingSpinner message="Loading assignments..." />;
  }

  if (assignmentsError) {
    return (
      <ErrorDisplay
        error={assignmentsError}
        onRetry={refetchAssignments}
        title="Error Loading Assignments"
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <Sidebar activeItem={activeItem} onItemClick={setActiveItem} userRole="teacher" />

      <main className="lg:ml-64 p-6 lg:p-8">
        <div className="mt-10">
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">My Assignments</h1>
              <p className="text-gray-600 text-sm mt-1">
                Create and manage your assignments
                {isModuleLeader && " • Module Leader Privileges"}
              </p>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-md hover:shadow-lg"
            >
              <Plus className="w-4 h-4" />
              Create Assignment
            </button>
          </div>

          {/* Filters */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search assignments..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="relative">
                <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none"
                >
                  <option value="all">All Types</option>
                  <option value="main">Main Assignments</option>
                  <option value="weekly">Weekly Assignments</option>
                </select>
              </div>

              <div className="relative">
                <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <select
                  value={filterSubject}
                  onChange={(e) => setFilterSubject(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none"
                >
                  <option value="all">All Subjects</option>
                  {subjects.map(subject => (
                    <option key={subject._id} value={subject._id}>
                      {subject.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2 text-sm text-gray-600">
                <span>Showing {filteredAssignments.length} of {assignments.length}</span>
              </div>
            </div>
          </div>

          {/* Assignments Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {filteredAssignments.length > 0 ? (
              filteredAssignments.map((assignment) => (
                <AssignmentCard
                  key={assignment._id}
                  assignment={assignment}
                  onEdit={() => openEditModal(assignment)}
                  onDelete={() => openDeleteConfirm(assignment)}
                />
              ))
            ) : (
              <div className="col-span-full">
                <EmptyState
                  icon={FileText}
                  message="No assignments found"
                  description="Create your first assignment to get started"
                />
                <div className="text-center mt-4">
                  <button
                    onClick={() => setShowCreateModal(true)}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                  >
                    <Plus className="w-4 h-4" />
                    Create Assignment
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Create Assignment Modal */}
      {showCreateModal && (
        <CreateAssignmentModal
          isOpen={showCreateModal}
          onClose={() => {
            setShowCreateModal(false);
            resetForm();
          }}
          onSubmit={handleCreateAssignment}
          formData={newAssignment}
          setFormData={setNewAssignment}
          selectedFile={selectedFile}
          onFileChange={handleFileChange}
          subjects={subjects}
          getSubjectGroups={getSubjectGroups}
          isModuleLeader={isModuleLeader}
          loading={creating}
        />
      )}

      {/* Edit Assignment Modal */}
      {showEditModal && selectedAssignment && (
        <EditAssignmentModal
          isOpen={showEditModal}
          onClose={() => {
            setShowEditModal(false);
            setSelectedAssignment(null);
          }}
          onSubmit={handleUpdateAssignment}
          assignment={selectedAssignment}
          setAssignment={setSelectedAssignment}
          loading={updating}
        />
      )}

      {/* Confirm Dialog */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        onClose={() => setConfirmDialog({ ...confirmDialog, isOpen: false })}
        onConfirm={confirmDialog.onConfirm}
        title={confirmDialog.title}
        message={confirmDialog.message}
        type="danger"
        confirmText="Delete"
      />
    </div>
  );
}

// Create Assignment Modal Component
interface CreateAssignmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  formData: any;
  setFormData: (data: any) => void;
  selectedFile: File | null;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  subjects: Subject[];
  getSubjectGroups: (subjectId: string) => any[];
  isModuleLeader: boolean;
  loading: boolean;
}

function CreateAssignmentModal({
  isOpen,
  onClose,
  onSubmit,
  formData,
  setFormData,
  selectedFile,
  onFileChange,
  subjects,
  getSubjectGroups,
  isModuleLeader,
  loading
}: CreateAssignmentModalProps) {
  if (!isOpen) return null;

  const availableGroups = formData.subjectId ? getSubjectGroups(formData.subjectId) : [];

  const toggleGroup = (groupId: string) => {
    setFormData({
      ...formData,
      groups: formData.groups.includes(groupId)
        ? formData.groups.filter((id: string) => id !== groupId)
        : [...formData.groups, groupId]
    });
  };

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto shadow-xl">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Create Assignment</h2>

        <form onSubmit={onSubmit} className="space-y-4">
          <FormInput
            label="Title"
            name="title"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            placeholder="e.g., Assignment 1 - Data Structures"
            required
          />

          <FormTextarea
            label="Description"
            name="description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Enter assignment description..."
            rows={3}
          />

          <FormSelect
            label="Subject"
            name="subjectId"
            value={formData.subjectId}
            onChange={(e) => setFormData({ ...formData, subjectId: e.target.value, groups: [] })}
            options={subjects.map(s => ({ value: s._id, label: `${s.name} (${s.code})` }))}
            placeholder="Select subject..."
            required
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Assignment Type <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-2 gap-3">
              {isModuleLeader && (
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, type: "main", groups: [] })}
                  className={`p-4 border-2 rounded-lg transition ${
                    formData.type === "main"
                      ? "border-yellow-500 bg-yellow-50"
                      : "border-gray-200 hover:border-yellow-300"
                  }`}
                >
                  <Crown className={`w-6 h-6 mx-auto mb-2 ${formData.type === "main" ? "text-yellow-600" : "text-gray-400"}`} />
                  <p className="font-medium text-sm">Main Assignment</p>
                  <p className="text-xs text-gray-500 mt-1">For all students in semester</p>
                </button>
              )}
              <button
                type="button"
                onClick={() => setFormData({ ...formData, type: "weekly" })}
                className={`p-4 border-2 rounded-lg transition ${
                  formData.type === "weekly"
                    ? "border-purple-500 bg-purple-50"
                    : "border-gray-200 hover:border-purple-300"
                }`}
              >
                <Calendar className={`w-6 h-6 mx-auto mb-2 ${formData.type === "weekly" ? "text-purple-600" : "text-gray-400"}`} />
                <p className="font-medium text-sm">Weekly Assignment</p>
                <p className="text-xs text-gray-500 mt-1">For specific groups</p>
              </button>
            </div>
          </div>

          {formData.type === "weekly" && formData.subjectId && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Groups <span className="text-red-500">*</span>
              </label>
              <div className="space-y-2 max-h-40 overflow-y-auto border border-gray-200 rounded-lg p-3 bg-gray-50">
                {availableGroups.length > 0 ? (
                  availableGroups.map((group: any) => (
                    <label
                      key={group._id}
                      className="flex items-center gap-3 p-2 hover:bg-white rounded cursor-pointer transition"
                    >
                      <input
                        type="checkbox"
                        checked={formData.groups.includes(group._id)}
                        onChange={() => toggleGroup(group._id)}
                        className="w-4 h-4 rounded text-blue-600"
                      />
                      <span className="text-sm text-gray-700 flex-1">{group.name}</span>
                      <span className="text-xs text-gray-500">
                        {group.studentCount || 0} students
                      </span>
                    </label>
                  ))
                ) : (
                  <p className="text-sm text-gray-500 text-center py-4">
                    No groups available for this subject
                  </p>
                )}
              </div>
              {availableGroups.length > 0 && (
                <p className="mt-2 text-xs text-gray-500">
                  {formData.groups.length} group(s) selected
                </p>
              )}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <FormInput
              label="Max Marks"
              name="maxMarks"
              type="number"
              value={formData.maxMarks}
              onChange={(e) => setFormData({ ...formData, maxMarks: e.target.value })}
              placeholder="100"
              required
            />
            <FormInput
              label="Deadline"
              name="deadline"
              type="datetime-local"
              value={formData.deadline}
              onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Attachment (Optional)
            </label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition">
              <input
                type="file"
                id="file-upload"
                onChange={onFileChange}
                className="hidden"
                accept=".pdf,.doc,.docx,.ppt,.pptx,.txt"
              />
              <label htmlFor="file-upload" className="cursor-pointer">
                <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                {selectedFile ? (
                  <div>
                    <p className="text-sm font-medium text-gray-900">{selectedFile.name}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                ) : (
                  <div>
                    <p className="text-sm text-gray-600">Click to upload or drag and drop</p>
                    <p className="text-xs text-gray-500 mt-1">
                      PDF, DOC, DOCX, PPT, PPTX, TXT (Max 10MB)
                    </p>
                  </div>
                )}
              </label>
            </div>
          </div>

          <div className="flex gap-3 justify-end pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !formData.subjectId || (formData.type === "weekly" && formData.groups.length === 0)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:bg-gray-300 disabled:cursor-not-allowed shadow-md hover:shadow-lg"
            >
              {loading ? (
                <>
                  <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                  Creating...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  Create Assignment
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Edit Assignment Modal Component
interface EditAssignmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  assignment: Assignment;
  setAssignment: (assignment: Assignment) => void;
  loading: boolean;
}

function EditAssignmentModal({
  isOpen,
  onClose,
  onSubmit,
  assignment,
  setAssignment,
  loading
}: EditAssignmentModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-lg w-full p-6 shadow-xl">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Edit Assignment</h2>

        <form onSubmit={onSubmit} className="space-y-4">
          <FormInput
            label="Title"
            name="title"
            value={assignment.title}
            onChange={(e) => setAssignment({ ...assignment, title: e.target.value })}
            required
          />

          <FormTextarea
            label="Description"
            name="description"
            value={assignment.description || ""}
            onChange={(e) => setAssignment({ ...assignment, description: e.target.value })}
            rows={3}
          />

          <div className="grid grid-cols-2 gap-4">
            <FormInput
              label="Max Marks"
              name="maxMarks"
              type="number"
              value={assignment.maxMarks.toString()}
              onChange={(e) => setAssignment({ ...assignment, maxMarks: parseInt(e.target.value) })}
              required
            />
            <FormInput
              label="Deadline"
              name="deadline"
              type="datetime-local"
              value={assignment.deadline ? new Date(assignment.deadline).toISOString().slice(0, 16) : ""}
              onChange={(e) => setAssignment({ ...assignment, deadline: e.target.value })}
              required
            />
          </div>

          {assignment.gradedCount && assignment.gradedCount > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
              <div className="flex gap-2">
                <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-amber-800">
                  <p className="font-medium">Note:</p>
                  <p>Some submissions have been graded. Changing max marks may affect grading.</p>
                </div>
              </div>
            </div>
          )}

          <div className="flex gap-3 justify-end pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:bg-gray-300 disabled:cursor-not-allowed shadow-md hover:shadow-lg"
            >
              {loading ? (
                <>
                  <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                  Updating...
                </>
              ) : (
                <>
                  <Edit className="w-4 h-4" />
                  Update Assignment
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}