import { useState, useEffect } from 'react';
import { Users, Plus, RefreshCw, BookOpen, Search, Filter } from 'lucide-react';
import { useApiGet, useApiPost, useApiPut, useApiDelete } from '../../hooks/useApi';
import DataTable from '../../components/Table';
import UserFormModal from '../../components/Userformmodal';
import ConfirmDialog from '../../components/Confirmationdialogue';
import GroupDetailsModal from '../../components/GroupDetailsModal';
import Navbar from '../../components/Navbar';
import Sidebar from '../../components/Sidebar';

export default function GroupManagement() {
  const [activeItem, setActiveItem] = useState("groups");
  const [filteredGroups, setFilteredGroups] = useState([]);
  const [selectedSemester, setSelectedSemester] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    semester: '',
    academicYear: new Date().getFullYear().toString(),
    capacity: '50'
  });

  // ✅ Updated API paths
  const { data: groups, loading, refetch: loadGroups } = useApiGet('/admin/groups', {
    onError: (error) => alert(`Failed to load groups: ${error}`)
  });

  const { post: createGroup, loading: createLoading } = useApiPost({
    onSuccess: () => {
      alert('Group created successfully!');
      loadGroups();
      setShowCreateModal(false);
      setFormData({
        name: '',
        semester: '',
        academicYear: new Date().getFullYear().toString(),
        capacity: '50'
      });
    },
    onError: (error) => alert(`Failed to create group: ${error}`)
  });

  const { put: updateGroup, loading: editLoading } = useApiPut({
    onSuccess: () => {
      alert('Group updated successfully!');
      loadGroups();
      setShowEditModal(false);
      setFormData({
        name: '',
        semester: '',
        academicYear: new Date().getFullYear().toString(),
        capacity: '50'
      });
      setSelectedGroup(null);
    },
    onError: (error) => alert(`Failed to update group: ${error}`)
  });

  const { delete: deleteGroup } = useApiDelete({
    onSuccess: () => {
      alert('Group deleted successfully!');
      loadGroups();
      setShowConfirmDialog(false);
      setSelectedGroup(null);
    },
    onError: (error) => alert(`Failed to delete group: ${error}`)
  });

  const { post: autoAssign, loading: autoAssignLoading } = useApiPost({
    onSuccess: (data) => {
      alert(`Successfully assigned ${data.assigned} students! ${data.skipped} skipped.`);
      loadGroups();
    },
    onError: (error) => alert(`Auto-assign failed: ${error}`)
  });

  // Filter logic
  useEffect(() => {
    if (groups) filterGroups();
  }, [groups, selectedSemester, searchQuery]);

  const filterGroups = () => {
    let filtered = [...(groups || [])];
    if (selectedSemester !== 'all') {
      filtered = filtered.filter(g => g.semester === parseInt(selectedSemester));
    }
    if (searchQuery) {
      filtered = filtered.filter(g =>
        g.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        g.semester.toString().includes(searchQuery)
      );
    }
    setFilteredGroups(filtered);
  };

  // ✅ Updated route paths here too
  const handleCreateGroup = async () => {
    if (!formData.name || !formData.semester || !formData.academicYear) {
      alert('Please fill all required fields');
      return;
    }
    await createGroup('/admin/groups', {
      name: formData.name,
      semester: parseInt(formData.semester),
      academicYear: parseInt(formData.academicYear),
      capacity: parseInt(formData.capacity)
    });
  };

  const handleEditGroup = (group) => {
    setSelectedGroup(group);
    setFormData({
      name: group.name,
      semester: group.semester.toString(),
      academicYear: group.academicYear.toString(),
      capacity: group.capacity.toString()
    });
    setShowEditModal(true);
  };

  const handleUpdateGroup = async () => {
    if (!formData.name || !formData.semester || !formData.academicYear) {
      alert('Please fill all required fields');
      return;
    }
    await updateGroup(`/admin/groups/${selectedGroup._id}`, {
      name: formData.name,
      semester: parseInt(formData.semester),
      academicYear: parseInt(formData.academicYear),
      capacity: parseInt(formData.capacity)
    });
  };

  const handleAutoAssign = async () => {
    if (confirm('This will automatically assign all unassigned students to groups. Continue?')) {
      await autoAssign('/admin/groups/auto-assign-students', {});
    }
  };

  const handleDeleteGroup = (group) => {
    setSelectedGroup(group);
    setShowConfirmDialog(true);
  };

  const confirmDelete = async () => {
    await deleteGroup(`/admin/groups/${selectedGroup._id}`);
  };

  const columns = [
    { header: 'Group Name', accessor: 'name', cell: (row) => (
      <div>
        <p className="font-medium text-gray-900">{row.name}</p>
        <p className="text-sm text-gray-500">Academic Year {row.academicYear}</p>
      </div>
    )},
    { header: 'Semester', accessor: 'semester', cell: (row) => (
      <span className="px-3 py-1 bg-blue-100 text-blue-700 text-sm font-medium rounded-full">
        Semester {row.semester}
      </span>
    )},
    { header: 'Students / Capacity', accessor: 'studentCount', cell: (row) => {
      const fill = (row.studentCount / row.capacity) * 100;
      const isFull = row.studentCount >= row.capacity;
      const isAlmostFull = fill >= 80;
      return (
        <div>
          <p className={`font-semibold ${isFull ? 'text-red-600' : isAlmostFull ? 'text-orange-600' : 'text-green-600'}`}>
            {row.studentCount} / {row.capacity}
          </p>
          <div className="w-32 bg-gray-200 rounded-full h-2 mt-1">
            <div className={`h-full rounded-full ${isFull ? 'bg-red-500' : isAlmostFull ? 'bg-orange-500' : 'bg-green-500'}`}
              style={{ width: `${Math.min(fill, 100)}%` }} />
          </div>
        </div>
      );
    }},
    { header: 'Subjects', accessor: 'subjectTeachers', cell: (row) => (
      <div className="flex items-center gap-2">
        <BookOpen className="w-4 h-4 text-gray-400" />
        <span className="text-sm text-gray-600">{row.subjectTeachers?.length || 0}</span>
      </div>
    )},
  ];

  const actions = [
    { icon: "view", label: "View Details", onClick: (row) => { setSelectedGroup(row); setShowDetailsModal(true); }},
    { icon: "edit", label: "Edit Group", onClick: handleEditGroup },
    { icon: "delete", label: "Delete Group", onClick: handleDeleteGroup },
  ];

  const formFields = [
    { name: 'name', label: 'Group Name', type: 'text', placeholder: 'e.g., Group A', required: true },
    { name: 'semester', label: 'Semester', type: 'select', required: true,
      options: [1,2,3,4,5,6,7,8].map(s => ({ value: s.toString(), label: `Semester ${s}` })) },
    { name: 'academicYear', label: 'Academic Year', type: 'number', placeholder: '2025', required: true },
    { name: 'capacity', label: 'Capacity', type: 'number', placeholder: '50', required: true },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <Sidebar activeItem={activeItem} onItemClick={setActiveItem} userRole="admin" />

      <main className="lg:ml-64 p-6 lg:p-8 transition-all duration-300">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8 mt-10">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Group Management</h1>
              <p className="text-gray-600">Manage student groups, assignments, and capacity</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleAutoAssign}
                disabled={autoAssignLoading}
                className="flex items-center gap-2 px-5 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors shadow-md disabled:opacity-50"
              >
                <RefreshCw className={`w-5 h-5 ${autoAssignLoading ? 'animate-spin' : ''}`} />
                Auto-Assign Students
              </button>
              <button
                onClick={() => setShowCreateModal(true)}
                className="flex items-center gap-2 px-5 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors shadow-md"
              >
                <Plus className="w-5 h-5" /> Create Group
              </button>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex-1 min-w-[300px]">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Search groups by name or semester..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Filter className="w-5 h-5 text-gray-400" />
                <select
                  value={selectedSemester}
                  onChange={(e) => setSelectedSemester(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Semesters</option>
                  {[1,2,3,4,5,6,7,8].map(s => (
                    <option key={s} value={s}>Semester {s}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Data Table */}
          <DataTable
            columns={columns}
            data={filteredGroups}
            actions={actions}
            emptyMessage={searchQuery || selectedSemester !== 'all'
              ? 'No groups found matching your filters'
              : 'No groups created yet. Create your first group to get started.'}
            isLoading={loading}
            onRowClick={(row) => { setSelectedGroup(row); setShowDetailsModal(true); }}
          />
        </div>
      </main>

      {/* Modals */}
      <UserFormModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSubmit={handleCreateGroup}
        title="Create New Group"
        formData={formData}
        setFormData={setFormData}
        fields={formFields}
        submitButtonText="Create Group"
        isLoading={createLoading}
      />

      <UserFormModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        onSubmit={handleUpdateGroup}
        title="Edit Group"
        formData={formData}
        setFormData={setFormData}
        fields={formFields}
        submitButtonText="Update Group"
        isLoading={editLoading}
      />

      <GroupDetailsModal
        isOpen={showDetailsModal}
        onClose={() => setShowDetailsModal(false)}
        group={selectedGroup}
      />

      <ConfirmDialog
        isOpen={showConfirmDialog}
        onClose={() => setShowConfirmDialog(false)}
        onConfirm={confirmDelete}
        title="Delete Group?"
        message={`Are you sure you want to delete <strong>${selectedGroup?.name}</strong>? This action cannot be undone.`}
        type="danger"
      />
    </div>
  );
}
