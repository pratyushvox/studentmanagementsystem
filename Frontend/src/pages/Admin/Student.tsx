import { useState, useEffect } from "react";
import { 
  Users, 
  Search, 
  Filter, 
  UserPlus, 
  Mail, 
  GraduationCap,
  CheckCircle,
  XCircle
} from "lucide-react";
import Navbar from "../../components/Navbar";
import Sidebar from "../../components/Sidebar";
import DataTable, { type Column, type Action } from "../../components/Table";
import ConfirmDialog from "../../components/Confirmationdialogue";
import UserFormModal from "../../components/UserFormModal";
import StatsCard from "../../components/Cardstats";
import { LoadingSpinner, ErrorDisplay } from "../../components/Loadingerror";
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const API_BASE_URL = "http://localhost:5000/api";

export default function AdminStudents() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [students, setStudents] = useState([]);
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [activeItem, setActiveItem] = useState("students");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterGrade, setFilterGrade] = useState("all");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  
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
    grade: ""
  });

  // Define form fields for student
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
      name: "grade",
      label: "Grade",
      type: "select" as const,
      required: true,
      options: [
        { value: "9", label: "Grade 9" },
        { value: "10", label: "Grade 10" },
        { value: "11", label: "Grade 11" },
        { value: "12", label: "Grade 12" }
      ]
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
    },
    {
      name: "grade",
      label: "Grade",
      type: "select" as const,
      required: true,
      options: [
        { value: "9", label: "Grade 9" },
        { value: "10", label: "Grade 10" },
        { value: "11", label: "Grade 11" },
        { value: "12", label: "Grade 12" }
      ]
    },
    {
      name: "isApproved",
      label: "Approval Status",
      type: "select" as const,
      required: true,
      options: [
        { value: "false", label: "Pending" },
        { value: "true", label: "Approved" }
      ]
    }
  ];

  useEffect(() => {
    fetchStudents();
  }, []);

  useEffect(() => {
    filterStudents();
  }, [students, searchTerm, filterGrade]);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_BASE_URL}/admin/users`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      
      const studentsOnly = data.filter(user => user.role === "student");
      setStudents(studentsOnly);
      setFilteredStudents(studentsOnly);
      setError(null);
    } catch (err) {
      setError(err.message);
      console.error("Error fetching students:", err);
    } finally {
      setLoading(false);
    }
  };

  const filterStudents = () => {
    let filtered = [...students];

    if (searchTerm) {
      filtered = filtered.filter(student => 
        student.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (filterGrade !== "all") {
      filtered = filtered.filter(student => student.grade === filterGrade);
    }

    setFilteredStudents(filtered);
  };

  const handleAddStudent = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_BASE_URL}/admin/create-student`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(newStudent)
      });

      if (response.ok) {
        toast.success("Student added successfully!");
        setShowAddModal(false);
        setNewStudent({
          fullName: "",
          email: "",
          password: "",
          grade: ""
        });
        fetchStudents();
      } else {
        const data = await response.json();
        toast.error(data.message || "Failed to add student");
      }
    } catch (err) {
      toast.error("Error adding student: " + err.message);
    }
  };

  const handleEditStudent = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("token");
      
      // Convert isApproved string to boolean
      const updateData = {
        ...selectedStudent,
        isApproved: selectedStudent.isApproved === "true" || selectedStudent.isApproved === true
      };
      
      const response = await fetch(`${API_BASE_URL}/admin/users/${selectedStudent._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(updateData)
      });

      if (response.ok) {
        toast.success("Student updated successfully!");
        setShowEditModal(false);
        setSelectedStudent(null);
        fetchStudents();
      } else {
        const data = await response.json();
        toast.error(data.message || "Failed to update student");
      }
    } catch (err) {
      toast.error("Error updating student: " + err.message);
    }
  };

  const handleApproveStudent = async (student) => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_BASE_URL}/admin/approve-student/${student._id}`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.ok) {
        toast.success(`${student.fullName} approved successfully!`);
        fetchStudents();
      } else {
        const data = await response.json();
        toast.error(data.message || "Failed to approve student");
      }
    } catch (err) {
      toast.error("Error approving student: " + err.message);
    }
  };

  const handleDeleteStudent = async (student) => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_BASE_URL}/admin/users/${student._id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.ok) {
        toast.success("Student deleted successfully!");
        fetchStudents();
      } else {
        const data = await response.json();
        toast.error(data.message || "Failed to delete student");
      }
    } catch (err) {
      toast.error("Error deleting student: " + err.message);
    }
  };

  const openEditModal = (student) => {
    setSelectedStudent({
      ...student,
      isApproved: student.isApproved ? "true" : "false"
    });
    setShowEditModal(true);
  };

  const openApproveConfirm = (student) => {
    setConfirmDialog({
      isOpen: true,
      type: "info",
      title: "Approve Student",
      message: `Are you sure you want to approve <strong>${student.fullName}</strong>? They will be able to access the system immediately.`,
      onConfirm: () => handleApproveStudent(student)
    });
  };

  const openDeleteConfirm = (student) => {
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
            {row.fullName.charAt(0).toUpperCase()}
          </div>
          <div className="ml-4">
            <div className="text-sm font-medium text-gray-900">
              {row.fullName}
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
      header: "Grade",
      accessor: "grade",
      cell: (row) => (
        <div className="flex items-center gap-2 text-sm text-gray-900">
          <GraduationCap className="w-4 h-4" />
          Grade {row.grade || "N/A"}
        </div>
      ),
      className: "whitespace-nowrap"
    },
    {
      header: "Subjects",
      accessor: "assignedSubjects",
      cell: (row) => (
        <div className="flex flex-wrap gap-1">
          {row.assignedSubjects?.length > 0 ? (
            row.assignedSubjects.map((subject, idx) => (
              <span
                key={idx}
                className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs"
              >
                {subject}
              </span>
            ))
          ) : (
            <span className="text-sm text-gray-500">No subjects</span>
          )}
        </div>
      )
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
      icon: "delete",
      label: "Delete Student",
      onClick: openDeleteConfirm
    }
  ];

  if (loading) {
    return <LoadingSpinner message="Loading students..." />;
  }

  if (error) {
    return <ErrorDisplay error={error} onRetry={fetchStudents} title="Error Loading Students" />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar onProfileClick={() => {}} />
      <Sidebar activeItem={activeItem} onItemClick={setActiveItem} userRole="admin" />
     
      <main className="lg:ml-64 p-6 lg:p-8">
        <div className="mt-10">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">Students Management</h1>
              <p className="text-gray-600 text-sm mt-1">
                Manage all students in the system
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

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
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
              subtitle="approved students"
              icon={CheckCircle}
              iconColor="text-green-600"
              iconBg="bg-green-100"
            />

            <StatsCard
              title="Pending Approval"
              count={students.filter(s => !s.isApproved).length}
              subtitle="pending students"
              icon={XCircle}
              iconColor="text-orange-600"
              iconBg="bg-orange-100"
            />
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                  value={filterGrade}
                  onChange={(e) => setFilterGrade(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none"
                >
                  <option value="all">All Grades</option>
                  <option value="9">Grade 9</option>
                  <option value="10">Grade 10</option>
                  <option value="11">Grade 11</option>
                  <option value="12">Grade 12</option>
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
    </div>
  );
}