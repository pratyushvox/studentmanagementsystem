import { useState, useEffect, type SetStateAction } from "react";
import { 
  Users, 
  Search, 
  Filter, 
  UserPlus, 
  Mail, 
  GraduationCap,
  CheckCircle,
  XCircle,
  UsersRound,
  BookOpen,
  Wand2,
  AlertCircle
} from "lucide-react";
import Navbar from "../../components/Navbar";
import Sidebar from "../../components/Sidebar";
import DataTable, { type Column, type Action } from "../../components/Table";
import ConfirmDialog from "../../components/Confirmationdialogue";
import UserFormModal from "../../components/Userformmodal";
import StatsCard from "../../components/Cardstats";
import { LoadingSpinner, ErrorDisplay } from "../../components/Loadingerror";
import { useApiGet, useApiPost, useApiPut, useApiPatch, useApiDelete } from "../../hooks/useApi";
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

export default function AdminStudents() {
  const [activeItem, setActiveItem] = useState("students");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterSemester, setFilterSemester] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAssignGroupModal, setShowAssignGroupModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [filteredStudents, setFilteredStudents] = useState([]);

  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    type: "danger",
    title: "",
    message: "",
    onConfirm: () => {}
  });

  const [newStudent, setNewStudent] = useState({
    fullName: "",
    email: "",
    password: "",
    semester: "1",
    enrollmentYear: new Date().getFullYear().toString()
  });

  const [assignGroupData, setAssignGroupData] = useState({
    studentId: "",
    groupId: ""
  });

  // API Hooks
  const { 
    data: studentsData, 
    loading: studentsLoading, 
    error: studentsError, 
    refetch: refetchStudents 
  } = useApiGet("/admin/students-with-details", {
    autoFetch: true,
    onError: (err) => toast.error(`Failed to load students: ${err}`)
  });

  const { 
    data: groupsData, 
    loading: groupsLoading 
  } = useApiGet("/admin/groups", {
    autoFetch: true,
    onError: (err) => toast.error(`Failed to load groups: ${err}`)
  });

  const { post: createStudentApi } = useApiPost({
    onSuccess: () => {
      toast.success("Student added successfully!");
      setShowAddModal(false);
      setNewStudent({
        fullName: "",
        email: "",
        password: "",
        semester: "1",
        enrollmentYear: new Date().getFullYear().toString()
      });
      refetchStudents();
    },
    onError: (err) => toast.error(err || "Failed to add student")
  });

  const { put: updateStudentApi } = useApiPut({
    onSuccess: () => {
      toast.success("Student updated successfully!");
      setShowEditModal(false);
      setSelectedStudent(null);
      refetchStudents();
    },
    onError: (err) => toast.error(err || "Failed to update student")
  });

  const { post: assignGroupApi } = useApiPost({
    onSuccess: () => {
      toast.success("Student assigned to group successfully!");
      setShowAssignGroupModal(false);
      setAssignGroupData({ studentId: "", groupId: "" });
      refetchStudents();
    },
    onError: (err) => toast.error(err || "Failed to assign group")
  });

  const { patch: approveStudentApi } = useApiPatch({
    onSuccess: (data) => {
      toast.success(`${data.user?.fullName} approved successfully!`);
      refetchStudents();
    },
    onError: (err) => toast.error(err || "Failed to approve student")
  });

  const { delete: deleteStudentApi } = useApiDelete({
    onSuccess: () => {
      toast.success("Student deleted successfully!");
      refetchStudents();
    },
    onError: (err) => toast.error(err || "Failed to delete student")
  });

  const { post: autoAssignApi } = useApiPost({
    onSuccess: (data) => {
      let message = `Successfully assigned ${data.assigned} students!`;
      if (data.skipped > 0) {
        message += `\n\nSkipped ${data.skipped} students (no available groups or groups are full)`;
      }
      if (data.details && data.details.length > 0) {
        message += '\n\nDetails:';
        data.details.forEach((detail: any) => {
          message += `\n• Semester ${detail.semester}: ${detail.assigned} assigned, ${detail.skipped} skipped`;
        });
      }
      alert(message);
      toast.success(`Assigned ${data.assigned} students using Round-Robin algorithm!`);
      refetchStudents();
    },
    onError: (err) => toast.error(err || "Failed to auto-assign students")
  });

  // Get students array from response
  const students = studentsData?.students || [];
  const groups = groupsData?.data || groupsData || [];

  // Define form fields
  const studentAddFields = [
    {
      name: "fullName",
      label: "Full Name",
      type: "text" as const,
      placeholder: "Enter full name",
      required: true
    },
    {
      name: "email",
      label: "Email",
      type: "email" as const,
      placeholder: "student@example.com",
      required: true
    },
    {
      name: "password",
      label: "Password",
      type: "password" as const,
      placeholder: "Enter password",
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
      name: "enrollmentYear",
      label: "Enrollment Year",
      type: "text" as const,
      placeholder: "2024",
      required: true
    }
  ];

  const studentEditFields = [
    {
      name: "fullName",
      label: "Full Name",
      type: "text" as const,
      required: true
    },
    {
      name: "email",
      label: "Email",
      type: "email" as const,
      required: true
    }
  ];

  // Filter students
  useEffect(() => {
    let filtered = [...students];

    if (searchTerm) {
      filtered = filtered.filter(student => 
        student.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.email?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (filterSemester !== "all") {
      filtered = filtered.filter(student => 
        student.semester?.toString() === filterSemester
      );
    }

    if (filterStatus !== "all") {
      if (filterStatus === "approved") {
        filtered = filtered.filter(s => s.isApproved);
      } else if (filterStatus === "pending") {
        filtered = filtered.filter(s => !s.isApproved);
      }
    }

    setFilteredStudents(filtered);
  }, [students, searchTerm, filterSemester, filterStatus]);

  // Handlers
  const handleAddStudent = async (e: { preventDefault: () => void; }) => {
    e.preventDefault();
    await createStudentApi("/admin/create-student", {
      ...newStudent,
      semester: parseInt(newStudent.semester),
      enrollmentYear: parseInt(newStudent.enrollmentYear)
    });
  };

  const handleEditStudent = async (e: { preventDefault: () => void; }) => {
    e.preventDefault();
    await updateStudentApi(`/admin/users/${selectedStudent._id}`, {
      fullName: selectedStudent.fullName,
      email: selectedStudent.email
    });
  };

  const handleAssignGroup = async (e: { preventDefault: () => void; }) => {
    e.preventDefault();
    await assignGroupApi("/admin/groups/assign-student", assignGroupData);
  };

  const handleApproveStudent = async (student: { _id: any; fullName: any; }) => {
    await approveStudentApi(`/admin/users/${student._id}/approve`);
  };

  const handleDeleteStudent = async (student: { _id: any; }) => {
    await deleteStudentApi(`/admin/users/${student._id}`);
  };

  const handleAutoAssignGroups = async () => {
    if (!confirm("This will automatically assign all unassigned students to groups using Round-Robin distribution.\n\nStudents will be evenly distributed across available groups in their semester.\n\nContinue?")) {
      return;
    }
    await autoAssignApi("/admin/groups/auto-assign-students", {});
  };

  // Modal handlers
  const openEditModal = (student: SetStateAction<null>) => {
    setSelectedStudent(student);
    setShowEditModal(true);
  };

  const openAssignGroupModal = (student: { _id: any; }) => {
    setAssignGroupData({
      studentId: student._id,
      groupId: ""
    });
    setShowAssignGroupModal(true);
  };

  const openApproveConfirm = (student: { fullName: any; }) => {
    setConfirmDialog({
      isOpen: true,
      type: "info",
      title: "Approve Student",
      message: `Are you sure you want to approve <strong>${student.fullName}</strong>? They will be able to access the system immediately.`,
      onConfirm: () => handleApproveStudent(student)
    });
  };

  const openDeleteConfirm = (student: { fullName: any; }) => {
    setConfirmDialog({
      isOpen: true,
      type: "danger",
      title: "Delete Student",
      message: `Are you sure you want to delete <strong>${student.fullName}</strong>? This action cannot be undone.`,
      onConfirm: () => handleDeleteStudent(student)
    });
  };

  const columns: Column[] = [
    {
      header: "Student",
      accessor: "fullName",
      cell: (row) => (
        <div className="flex items-center">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold">
            {row.fullName?.charAt(0).toUpperCase()}
          </div>
          <div className="ml-4">
            <div className="text-sm font-medium text-gray-900">
              {row.fullName}
            </div>
            <div className="text-xs text-gray-500">
              {row.studentId || "ID pending"}
            </div>
          </div>
        </div>
      ),
      className: "whitespace-nowrap"
    },
    {
      header: "Email",
      accessor: "email",
      cell: (row) => (
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Mail className="w-4 h-4" />
          {row.email}
        </div>
      ),
      className: "whitespace-nowrap"
    },
    {
      header: "Semester",
      accessor: "semester",
      cell: (row) => (
        <div className="flex items-center gap-2">
          <GraduationCap className="w-4 h-4 text-blue-600" />
          <span className="text-sm font-medium text-gray-900">
            {row.semester ? `Semester ${row.semester}` : "Not assigned"}
          </span>
        </div>
      ),
      className: "whitespace-nowrap"
    },
    {
      header: "Group",
      accessor: "groupId",
      cell: (row) => (
        row.groupId ? (
          <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs font-medium">
            {row.groupName || "Group assigned"}
          </span>
        ) : (
          <button
            onClick={(e) => {
              e.stopPropagation();
              openAssignGroupModal(row);
            }}
            className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs font-medium hover:bg-gray-200 transition-colors"
          >
            Assign Group
          </button>
        )
      ),
      className: "whitespace-nowrap"
    },
    {
      header: "Status",
      accessor: "isApproved",
      cell: (row) => (
        row.isApproved ? (
          <span className="flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium w-fit">
            <CheckCircle className="w-3 h-3" />
            Approved
          </span>
        ) : (
          <button
            onClick={(e) => {
              e.stopPropagation();
              openApproveConfirm(row);
            }}
            className="flex items-center gap-1 px-2 py-1 bg-orange-100 text-orange-700 rounded-full text-xs font-medium w-fit hover:bg-orange-200 transition-colors cursor-pointer"
          >
            <XCircle className="w-3 h-3" />
            Pending - Click to Approve
          </button>
        )
      ),
      className: "whitespace-nowrap"
    }
  ];

  const actions: Action[] = [
    {
      icon: "edit",
      label: "Edit Student",
      onClick: openEditModal
    },
    {
      icon: "users",
      label: "Assign Group",
      onClick: openAssignGroupModal
    },
    {
      icon: "delete",
      label: "Delete Student",
      onClick: openDeleteConfirm
    }
  ];

  if (studentsLoading) {
    return <LoadingSpinner message="Loading students..." />;
  }

  if (studentsError) {
    return <ErrorDisplay error={studentsError} onRetry={refetchStudents} title="Error Loading Students" />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <Sidebar activeItem={activeItem} onItemClick={setActiveItem} userRole="admin" />
     
      <main className="lg:ml-64 p-6 lg:p-8">
        <div className="mt-10">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">Students Management</h1>
              <p className="text-gray-600 text-sm mt-1">
                Manage all students in the semester system
              </p>
            </div>
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <UserPlus className="w-4 h-4" />
              Add Student
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
            <StatsCard
              title="Total Students"
              count={students.length}
              subtitle="registered students"
              icon={Users}
              iconColor="text-blue-600"
              iconBg="bg-blue-100"
            />

            <StatsCard
              title="Approved Students"
              count={students.filter(s => s.isApproved).length}
              subtitle="can access system"
              icon={CheckCircle}
              iconColor="text-green-600"
              iconBg="bg-green-100"
            />

            <StatsCard
              title="Pending Approval"
              count={students.filter(s => !s.isApproved).length}
              subtitle="awaiting approval"
              icon={XCircle}
              iconColor="text-orange-600"
              iconBg="bg-orange-100"
            />

            <StatsCard
              title="Unassigned"
              count={students.filter(s => !s.groupId).length}
              subtitle="no group assigned"
              icon={UsersRound}
              iconColor="text-purple-600"
              iconBg="bg-purple-100"
            />
          </div>

          <div className="bg-gradient-to-r from-purple-500 via-purple-600 to-blue-600 rounded-xl shadow-lg p-6 text-white mb-6">
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center backdrop-blur-sm">
                    <Wand2 className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold">Auto-Assign Groups (Round-Robin)</h3>
                    <p className="text-sm text-white/90">Evenly distribute students across available groups</p>
                  </div>
                </div>
                
                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 space-y-2">
                  <div className="flex items-start gap-2 text-sm">
                    <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold mb-1">How Round-Robin Works:</p>
                      <ul className="list-disc list-inside space-y-1 ml-2 text-white/90">
                        <li>Groups students by their semester</li>
                        <li>Distributes students one-by-one to each group in rotation</li>
                        <li>Result: Equal distribution (e.g., 100 students → 5 groups = 20 each)</li>
                        <li>Respects group capacity limits</li>
                      </ul>
                    </div>
                  </div>
                  
                  {students.filter(s => !s.groupId).length > 0 && (
                    <div className="flex items-center gap-2 text-sm bg-white/10 rounded px-3 py-2 mt-2">
                      <Users className="w-4 h-4" />
                      <span className="font-semibold">{students.filter(s => !s.groupId).length} students</span>
                      <span className="text-white/80">waiting to be assigned</span>
                    </div>
                  )}
                </div>
              </div>
              
              <button
                onClick={handleAutoAssignGroups}
                disabled={groupsLoading || students.filter(s => !s.groupId).length === 0}
                className="flex items-center gap-3 px-8 py-4 bg-white text-purple-600 rounded-lg hover:bg-gray-100 transition-all font-bold text-lg shadow-lg disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap transform hover:scale-105"
              >
                <Wand2 className="w-6 h-6" />
                {groupsLoading ? (
                  <span className="animate-pulse">Assigning...</span>
                ) : (
                  <>Auto-Assign All</>
                )}
              </button>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by name or email..."
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
                  {[1,2,3,4,5,6,7,8].map(sem => (
                    <option key={sem} value={sem.toString()}>Semester {sem}</option>
                  ))}
                </select>
              </div>

              <div className="relative">
                <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none"
                >
                  <option value="all">All Status</option>
                  <option value="approved">Approved</option>
                  <option value="pending">Pending</option>
                </select>
              </div>

              <div className="flex items-center gap-2 text-sm text-gray-600">
                <span>Showing {filteredStudents.length} of {students.length} students</span>
              </div>
            </div>
          </div>

          <DataTable
            columns={columns}
            data={filteredStudents}
            actions={actions}
            emptyMessage="No students found"
          />
        </div>
      </main>

      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        onClose={() => setConfirmDialog({ ...confirmDialog, isOpen: false })}
        onConfirm={confirmDialog.onConfirm}
        title={confirmDialog.title}
        message={confirmDialog.message}
        type={confirmDialog.type}
        confirmText={confirmDialog.type === "info" ? "Approve" : "Delete"}
      />

      <UserFormModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSubmit={handleAddStudent}
        title="Add New Student"
        formData={newStudent}
        setFormData={setNewStudent}
        fields={studentAddFields}
        submitButtonText="Add Student"
      />

      <UserFormModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        onSubmit={handleEditStudent}
        title="Edit Student"
        formData={selectedStudent || {}}
        setFormData={setSelectedStudent}
        fields={studentEditFields}
        submitButtonText="Update Student"
      />

      {/* Assign Group Modal */}
      {showAssignGroupModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h2 className="text-xl font-bold mb-4">Assign Student to Group</h2>
            <form onSubmit={handleAssignGroup} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Select Group *
                </label>
                <select
                  value={assignGroupData.groupId}
                  onChange={(e) => setAssignGroupData({...assignGroupData, groupId: e.target.value})}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Choose a group...</option>
                  {groups.map(group => (
                    <option key={group._id} value={group._id}>
                      {group.name} - Semester {group.semester} ({group.studentCount}/{group.capacity})
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex gap-3 justify-end">
                <button
                  type="button"
                  onClick={() => setShowAssignGroupModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Assign Group
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}