import { useState, useEffect } from "react";
import { 
  Users, 
  Search, 
  UserPlus, 
  Mail,
  BookOpen,
  Calendar,
  Award,
  Eye,
  GraduationCap,
  UsersRound,
  Filter,
  AlertCircle
} from "lucide-react";
import Navbar from "../../components/Navbar";
import Sidebar from "../../components/Sidebar";
import DataTable, { type Column, type Action } from "../../components/Table";
import ConfirmDialog from "../../components/Confirmationdialogue";
import UserFormModal from "../../components/Userformmodal";
import StatsCard from "../../components/Cardstats";
import { LoadingSpinner, ErrorDisplay } from "../../components/Loadingerror";
import { useApiGet, useApiPost, useApiPut, useApiDelete } from "../../hooks/useApi";
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

interface Teacher {
  _id: string;
  userId: string;
  teacherId: string;
  fullName: string;
  email: string;
  department?: string;
  specialization?: string;
  assignedSubjectsCount: number;
  totalGroups: number;
  createdAt: string;
  isApproved: boolean;
  profileCompleted: boolean;
}

interface TeacherDetails extends Teacher {
  assignedSubjects: Array<{
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
  }>;
}

export default function AdminTeachers() {
  const [activeItem, setActiveItem] = useState("teachers");
  const [searchTerm, setSearchTerm] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null);
  const [teacherDetails, setTeacherDetails] = useState<TeacherDetails | null>(null);
  
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    type: "danger" as "danger" | "warning",
    title: "",
    message: "",
    onConfirm: () => {}
  });

  const [newTeacher, setNewTeacher] = useState({
    fullName: "",
    email: "",
    password: "",
    department: "",
    specialization: ""
  });

  // API Hooks
  const { 
    data: teachersData, 
    loading, 
    error, 
    refetch 
  } = useApiGet<{ teachers: Teacher[]; count: number }>(
    "/admin/teachers-with-details", 
    { autoFetch: true }
  );

  const { post: createTeacher, loading: creating } = useApiPost({
    onSuccess: () => {
      toast.success("Teacher added successfully!");
      setShowAddModal(false);
      setNewTeacher({
        fullName: "",
        email: "",
        password: "",
        department: "",
        specialization: ""
      });
      refetch();
    },
    onError: (error) => toast.error(error)
  });

  const { put: updateTeacher, loading: updating } = useApiPut({
    onSuccess: () => {
      toast.success("Teacher updated successfully!");
      setShowEditModal(false);
      setSelectedTeacher(null);
      refetch();
    },
    onError: (error) => toast.error(error)
  });

  const { delete: deleteTeacher } = useApiDelete({
    onSuccess: () => {
      toast.success("Teacher deleted successfully!");
      refetch();
    },
    onError: (error) => toast.error(error)
  });

  const teachers = teachersData?.teachers || [];

  // Filter teachers
  const filteredTeachers = teachers.filter(teacher => {
    const matchesSearch = 
      teacher.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      teacher.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      teacher.teacherId?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesDepartment = !departmentFilter || teacher.department === departmentFilter;
    
    return matchesSearch && matchesDepartment;
  });

  // Department mapping based on BIT subject categories
  // Department represents the academic area, which groups related subjects together
  const departmentToSubjects: Record<string, string[]> = {
    "Programming & Software Development": [
      "Programming Fundamentals",
      "Object Oriented Programming",
      "Data Structures & Algorithms",
      "Software Engineering"
    ],
    "Database & Information Systems": [
      "Database Management Systems"
    ],
    "Web & Mobile Development": [
      "Web Technologies",
      "Advanced Web Development",
      "Mobile Application Development"
    ],
    "Networks & Security": [
      "Computer Networks",
      "Cybersecurity"
    ],
    "Cloud & DevOps": [
      "Cloud Computing",
      "DevOps & CI/CD"
    ],
    "Artificial Intelligence & Machine Learning": [
      "Machine Learning Fundamentals",
      "Artificial Intelligence"
    ],
    "Data Science & Big Data": [
      "Big Data Analytics"
    ],
    "Emerging Technologies": [
      "Blockchain Technology",
      "IoT & Embedded Systems"
    ],
    "Computer Systems & Architecture": [
      "Digital Logic",
      "Computer Architecture",
      "Operating Systems",
      "Advanced System Design"
    ],
    "Mathematics & Foundations": [
      "Mathematics I"
    ],
    "Project Management": [
      "Major Project I",
      "Major Project II"
    ]
  };

  // Extract department names for dropdown
  const departments = Object.keys(departmentToSubjects);

  // Define form fields
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
    },
    {
      name: "department",
      label: "Department",
      type: "select" as const,
      placeholder: "Select department",
      required: true,
      options: departments.map(dept => ({ value: dept, label: dept }))
    },
    {
      name: "specialization",
      label: "Specialization",
      type: "text" as const,
      placeholder: "e.g., Deep Learning, Cloud Architecture",
      required: false,
      helpText: "Specific area of expertise within the department"
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
    },
    {
      name: "department",
      label: "Department",
      type: "select" as const,
      required: true,
      options: departments.map(dept => ({ value: dept, label: dept }))
    },
    {
      name: "specialization",
      label: "Specialization",
      type: "text" as const,
      required: false,
      placeholder: "e.g., Deep Learning, Cloud Architecture"
    }
  ];

  const handleAddTeacher = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const teacherEmailRegex = /^[a-zA-Z0-9._%+-]+@teacher\.padhaihub\.edu\.np$/;
    if (!teacherEmailRegex.test(newTeacher.email)) {
      toast.error("Email must be from @teacher.padhaihub.edu.np domain");
      return;
    }

    await createTeacher("/admin/create-teacher", newTeacher);
  };

  const handleEditTeacher = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTeacher) return;
    
    await updateTeacher(
      `/admin/teachers/${selectedTeacher._id}`, 
      {
        department: selectedTeacher.department,
        specialization: selectedTeacher.specialization
      }
    );
  };

  const handleDeleteTeacher = async (teacher: Teacher) => {
    await deleteTeacher(`/admin/users/${teacher.userId}`);
  };

  const handleViewDetails = async (teacher: Teacher) => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`http://localhost:5000/api/admin/teachers/${teacher._id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      setTeacherDetails(data.teacher);
      setShowDetailsModal(true);
    } catch (err: any) {
      toast.error("Failed to load teacher details");
    }
  };

  const openEditModal = (teacher: Teacher) => {
    setSelectedTeacher({ ...teacher });
    setShowEditModal(true);
  };

  const openDeleteConfirm = (teacher: Teacher) => {
    setConfirmDialog({
      isOpen: true,
      type: "danger",
      title: "Delete Teacher",
      message: `Are you sure you want to delete <strong>${teacher.fullName}</strong>? This action cannot be undone.`,
      onConfirm: () => handleDeleteTeacher(teacher)
    });
  };

  const formatDate = (dateString: string) => {
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
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-semibold shadow-md">
            {row.fullName?.charAt(0).toUpperCase()}
          </div>
          <div>
            <div className="text-sm font-medium text-gray-900">
              {row.fullName}
            </div>
            <div className="text-xs text-gray-500">
              {row.teacherId}
            </div>
          </div>
        </div>
      ),
      className: "whitespace-nowrap"
    },
    {
      header: "Contact & Department",
      accessor: "email",
      cell: (row) => (
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2 text-sm text-gray-700">
            <Mail className="w-3.5 h-3.5 text-gray-400" />
            {row.email}
          </div>
          {row.department && (
            <div className="flex items-center gap-2">
              <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded font-medium">
                {row.department}
              </span>
              {row.specialization && (
                <span className="text-xs text-gray-500">
                  • {row.specialization}
                </span>
              )}
            </div>
          )}
        </div>
      ),
      className: "max-w-xs"
    },
    {
      header: "Teaching Load",
      accessor: "assignedSubjectsCount",
      cell: (row) => (
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-blue-500" />
            <span className="text-sm font-medium text-gray-900">
              {row.assignedSubjectsCount} Subject{row.assignedSubjectsCount !== 1 ? 's' : ''}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <UsersRound className="w-4 h-4 text-green-500" />
            <span className="text-sm text-gray-600">
              {row.totalGroups} Group{row.totalGroups !== 1 ? 's' : ''}
            </span>
          </div>
        </div>
      ),
      className: "whitespace-nowrap"
    },
    {
      header: "Status",
      accessor: "isApproved",
      cell: (row) => (
        <div className="flex flex-col gap-1">
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
            row.isApproved 
              ? 'bg-green-100 text-green-800' 
              : 'bg-yellow-100 text-yellow-800'
          }`}>
            {row.isApproved ? '✓ Approved' : '⏳ Pending'}
          </span>
          {row.profileCompleted && (
            <span className="text-xs text-gray-500 flex items-center gap-1">
              <Award className="w-3 h-3" />
              Profile Complete
            </span>
          )}
        </div>
      ),
      className: "whitespace-nowrap"
    },
    {
      header: "Joined",
      accessor: "createdAt",
      cell: (row) => (
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Calendar className="w-4 h-4 text-gray-400" />
          {formatDate(row.createdAt)}
        </div>
      ),
      className: "whitespace-nowrap"
    }
  ];

  const actions: Action[] = [
    {
      icon: "eye",
      label: "View Details",
      onClick: handleViewDetails
    },
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
    return <ErrorDisplay error={error} onRetry={refetch} title="Error Loading Teachers" />;
  }

  // Calculate stats
  const totalStudents = teachers.reduce((sum, t) => sum + (t.totalGroups || 0), 0);
  const activeTeachers = teachers.filter(t => t.isApproved).length;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar onProfileClick={() => {}} />
      <Sidebar activeItem={activeItem} onItemClick={setActiveItem} userRole="admin" />
     
      <main className="lg:ml-64 p-6 lg:p-8">
        <div className="mt-10">
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <GraduationCap className="w-7 h-7 text-purple-600" />
                Teachers Management
              </h1>
              <p className="text-gray-600 text-sm mt-1">
                Manage faculty members and their profiles
              </p>
              <div className="mt-2 flex items-start gap-2 text-sm text-blue-700 bg-blue-50 px-3 py-2 rounded-lg border border-blue-200">
                <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>
                  <strong>Note:</strong> Subject and group assignments are managed in the <strong>Courses/Subjects</strong> section
                </span>
              </div>
            </div>
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all shadow-md hover:shadow-lg"
            >
              <UserPlus className="w-4 h-4" />
              Add Teacher
            </button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <StatsCard
              title="Total Teachers"
              count={teachers.length}
              subtitle="registered faculty"
              icon={Users}
              iconColor="text-purple-600"
              iconBg="bg-purple-100"
            />

            <StatsCard
              title="Active Teachers"
              count={activeTeachers}
              subtitle="approved accounts"
              icon={Award}
              iconColor="text-green-600"
              iconBg="bg-green-100"
            />

            <StatsCard
              title="Total Subjects"
              count={teachers.reduce((sum, t) => sum + (t.assignedSubjectsCount || 0), 0)}
              subtitle="subjects assigned"
              icon={BookOpen}
              iconColor="text-blue-600"
              iconBg="bg-blue-100"
            />

            <StatsCard
              title="Teaching Groups"
              count={totalStudents}
              subtitle="active groups"
              icon={UsersRound}
              iconColor="text-orange-600"
              iconBg="bg-orange-100"
            />
          </div>

          {/* Filters */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="relative md:col-span-2">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by name, email, or ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>

              <div className="relative">
                <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <select
                  value={departmentFilter}
                  onChange={(e) => setDepartmentFilter(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent appearance-none bg-white"
                >
                  <option value="">All Departments</option>
                  {departments.map(dept => (
                    <option key={dept} value={dept}>{dept}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-200">
              <span className="text-sm text-gray-600">
                Showing <span className="font-semibold text-gray-900">{filteredTeachers.length}</span> of <span className="font-semibold text-gray-900">{teachers.length}</span> teachers
              </span>
              {departmentFilter && (
                <button
                  onClick={() => setDepartmentFilter("")}
                  className="text-sm text-purple-600 hover:text-purple-700 font-medium"
                >
                  Clear Filters
                </button>
              )}
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

      {/* Modals */}
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
        isLoading={creating}
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
        isLoading={updating}
      />

      {/* Teacher Details Modal */}
      {showDetailsModal && teacherDetails && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-gradient-to-r from-purple-600 to-pink-600 text-white p-6 rounded-t-xl">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-2xl font-bold">{teacherDetails.fullName}</h2>
                  <p className="text-purple-100 text-sm mt-1">{teacherDetails.teacherId}</p>
                </div>
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="text-white hover:bg-white/20 rounded-lg p-2 transition-colors"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="p-6">
              {/* Basic Info */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <p className="text-sm text-gray-500">Email</p>
                  <p className="text-sm font-medium text-gray-900">{teacherDetails.email}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Department</p>
                  <p className="text-sm font-medium text-gray-900">{teacherDetails.department || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Specialization</p>
                  <p className="text-sm font-medium text-gray-900">{teacherDetails.specialization || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Joined Date</p>
                  <p className="text-sm font-medium text-gray-900">{formatDate(teacherDetails.createdAt)}</p>
                </div>
              </div>

              {/* Assigned Subjects */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-purple-600" />
                  Assigned Subjects ({teacherDetails.assignedSubjects?.length || 0})
                </h3>
                
                {teacherDetails.assignedSubjects?.length > 0 ? (
                  <div className="space-y-4">
                    {teacherDetails.assignedSubjects.map((subject, idx) => (
                      <div key={idx} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h4 className="font-semibold text-gray-900">{subject.subjectId.name}</h4>
                            <p className="text-sm text-gray-600">{subject.subjectId.code}</p>
                          </div>
                          <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-medium">
                            Semester {subject.semester}
                          </span>
                        </div>
                        
                        {subject.groups.length > 0 && (
                          <div className="mt-3">
                            <p className="text-xs text-gray-500 mb-2">Teaching Groups:</p>
                            <div className="flex flex-wrap gap-2">
                              {subject.groups.map((group) => (
                                <span key={group._id} className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">
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
                  <div className="text-center py-8">
                    <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">No subjects assigned yet</p>
                    <p className="text-xs text-gray-400 mt-1">
                      Assign subjects from the Courses section
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}