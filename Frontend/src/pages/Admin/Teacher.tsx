import { useState, useEffect } from "react";
import { 
  Users, 
  Search, 
  Filter, 
  UserPlus, 
  Mail,
  BookOpen,
  Calendar
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

export default function AdminTeachers() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [teachers, setTeachers] = useState([]);
  const [filteredTeachers, setFilteredTeachers] = useState([]);
  const [activeItem, setActiveItem] = useState("teachers");
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState(null);
  
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    type: "danger",
    title: "",
    message: "",
    onConfirm: () => {}
  });

  const [newTeacher, setNewTeacher] = useState({
    fullName: "",
    email: "",
    password: ""
  });

  // Define form fields for teacher
  const teacherAddFields = [
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
      placeholder: "name@teacher.padhaihub.edu.np",
      required: true
    },
    {
      name: "password",
      label: "Password",
      type: "password" as const,
      placeholder: "Enter password",
      required: true
    }
  ];

  const teacherEditFields = [
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
      required: true,
      disabled: true
    }
  ];

  useEffect(() => {
    fetchTeachers();
  }, []);

  useEffect(() => {
    filterTeachers();
  }, [teachers, searchTerm]);

  const fetchTeachers = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_BASE_URL}/admin/users`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      
      const teachersOnly = data.filter(user => user.role === "teacher");
      setTeachers(teachersOnly);
      setFilteredTeachers(teachersOnly);
      setError(null);
    } catch (err) {
      setError(err.message);
      console.error("Error fetching teachers:", err);
    } finally {
      setLoading(false);
    }
  };

  const filterTeachers = () => {
    let filtered = [...teachers];

    if (searchTerm) {
      filtered = filtered.filter(teacher => 
        teacher.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        teacher.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredTeachers(filtered);
  };

  const handleAddTeacher = async (e) => {
    e.preventDefault();
    
    // Validate email domain
    const teacherEmailRegex = /^[a-zA-Z0-9._%+-]+@teacher\.padhaihub\.edu\.np$/;
    if (!teacherEmailRegex.test(newTeacher.email)) {
      toast.error("Email must be from @teacher.padhaihub.edu.np domain");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_BASE_URL}/admin/create-teacher`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(newTeacher)
      });

      if (response.ok) {
        toast.success("Teacher added successfully!");
        setShowAddModal(false);
        setNewTeacher({
          fullName: "",
          email: "",
          password: ""
        });
        fetchTeachers();
      } else {
        const data = await response.json();
        toast.error(data.message || "Failed to add teacher");
      }
    } catch (err) {
      toast.error("Error adding teacher: " + err.message);
    }
  };

  const handleEditTeacher = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_BASE_URL}/admin/users/${selectedTeacher._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(selectedTeacher)
      });

      if (response.ok) {
        toast.success("Teacher updated successfully!");
        setShowEditModal(false);
        setSelectedTeacher(null);
        fetchTeachers();
      } else {
        const data = await response.json();
        toast.error(data.message || "Failed to update teacher");
      }
    } catch (err) {
      toast.error("Error updating teacher: " + err.message);
    }
  };

  const handleDeleteTeacher = async (teacher) => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_BASE_URL}/admin/users/${teacher._id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.ok) {
        toast.success("Teacher deleted successfully!");
        fetchTeachers();
      } else {
        const data = await response.json();
        toast.error(data.message || "Failed to delete teacher");
      }
    } catch (err) {
      toast.error("Error deleting teacher: " + err.message);
    }
  };

  const openEditModal = (teacher) => {
    setSelectedTeacher({ ...teacher });
    setShowEditModal(true);
  };

  const openDeleteConfirm = (teacher) => {
    setConfirmDialog({
      isOpen: true,
      type: "danger",
      title: "Delete Teacher",
      message: `Are you sure you want to delete <strong>${teacher.fullName}</strong>? This action cannot be undone.`,
      onConfirm: () => handleDeleteTeacher(teacher)
    });
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const columns: Column[] = [
    {
      header: "Teacher",
      accessor: "fullName",
      cell: (row) => (
        <div className="flex items-center">
          <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-semibold">
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
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Mail className="w-4 h-4" />
            {row.email}
          </div>
          <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded w-fit">
            @teacher.padhaihub.edu.np
          </span>
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
            <span className="text-sm text-gray-500">No subjects assigned</span>
          )}
        </div>
      )
    },
    {
      header: "Joined Date",
      accessor: "createdAt",
      cell: (row) => (
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Calendar className="w-4 h-4" />
          {formatDate(row.createdAt)}
        </div>
      ),
      className: "whitespace-nowrap"
    }
  ];

  const actions: Action[] = [
    {
      icon: "edit",
      label: "Edit Teacher",
      onClick: openEditModal
    },
    {
      icon: "delete",
      label: "Delete Teacher",
      onClick: openDeleteConfirm
    }
  ];

  if (loading) {
    return <LoadingSpinner message="Loading teachers..." />;
  }

  if (error) {
    return <ErrorDisplay error={error} onRetry={fetchTeachers} title="Error Loading Teachers" />;
  }

  // Calculate unique subjects
  const uniqueSubjects = new Set();
  teachers.forEach(teacher => {
    teacher.assignedSubjects?.forEach(subject => uniqueSubjects.add(subject));
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar onProfileClick={() => {}} />
      <Sidebar activeItem={activeItem} onItemClick={setActiveItem} userRole="admin" />
     
      <main className="lg:ml-64 p-6 lg:p-8">
        <div className="mt-10">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">Teachers Management</h1>
              <p className="text-gray-600 text-sm mt-1">
                Manage all teachers in the system
              </p>
            </div>
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              <UserPlus className="w-4 h-4" />
              Add Teacher
            </button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <StatsCard
              title="Total Teachers"
              count={teachers.length}
              subtitle="registered teachers"
              icon={Users}
              iconColor="text-purple-600"
              iconBg="bg-purple-100"
            />

            <StatsCard
              title="Subjects Covered"
              count={uniqueSubjects.size}
              subtitle="unique subjects"
              icon={BookOpen}
              iconColor="text-blue-600"
              iconBg="bg-blue-100"
            />

            <StatsCard
              title="Active Accounts"
              count={teachers.length}
              subtitle="active teachers"
              icon={Mail}
              iconColor="text-green-600"
              iconBg="bg-green-100"
            />
          </div>

          {/* Search */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by name or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>

              <div className="flex items-center gap-2 text-sm text-gray-600">
                <span>Showing {filteredTeachers.length} of {teachers.length} teachers</span>
              </div>
            </div>
          </div>

          {/* Teachers Table */}
          <DataTable
            columns={columns}
            data={filteredTeachers}
            actions={actions}
            emptyMessage="No teachers found"
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
        confirmText="Delete"
      />

      <UserFormModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSubmit={handleAddTeacher}
        title="Add New Teacher"
        formData={newTeacher}
        setFormData={setNewTeacher}
        fields={teacherAddFields}
        submitButtonText="Add Teacher"
      />

      <UserFormModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        onSubmit={handleEditTeacher}
        title="Edit Teacher"
        formData={selectedTeacher || {}}
        setFormData={setSelectedTeacher}
        fields={teacherEditFields}
        submitButtonText="Update Teacher"
      />
    </div>
  );
}