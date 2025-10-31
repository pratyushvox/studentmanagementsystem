import React, { useState, useEffect } from 'react';
import { Upload, X, FileText, Video, Image, Link2, File } from 'lucide-react';
import { toast } from 'react-toastify';
import { useApiUpload } from '../hooks/useApi';

interface Subject {
  _id: string;
  name: string;
  code: string;
}

interface Group {
  _id: string;
  name: string;
  semester: number;
}

interface AssignedSubject {
  _id: string;
  subjectId: Subject;
  semester: number;
  groups: Group[];
}

interface DashboardData {
  teacher: {
    name: string;
    teacherId: string;
    department: string;
    isModuleLeader: boolean;
    moduleLeaderSubjects: Subject[];
    assignedSubjects: AssignedSubject[];
  };
}

interface UploadMaterialModalProps {
  isOpen: boolean;
  onClose: () => void;
  dashboardData: DashboardData;
  onSuccess: () => void;
}

const UploadMaterialModal: React.FC<UploadMaterialModalProps> = ({ 
  isOpen, 
  onClose, 
  dashboardData,
  onSuccess 
}) => {
  const [formData, setFormData] = useState({
    title: '',
    contentType: '',
    subjectId: '',
    groups: [] as string[],
    description: '',
    tags: ''
  });
  
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [availableGroups, setAvailableGroups] = useState<Group[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [dragActive, setDragActive] = useState(false);

  const { loading: uploading, upload, reset: resetUpload } = useApiUpload({
    onSuccess: () => {
      toast.success('Material uploaded successfully!');
      handleClear();
      onSuccess();
      onClose();
    },
    onError: (error) => {
      toast.error(error || 'Failed to upload material');
    }
  });

  useEffect(() => {
    if (formData.subjectId) {
      const assignedSubject = dashboardData.teacher.assignedSubjects.find(
        as => as.subjectId._id === formData.subjectId
      );
      setAvailableGroups(assignedSubject?.groups || []);
      setFormData(prev => ({ ...prev, groups: [] }));
    } else {
      setAvailableGroups([]);
      setFormData(prev => ({ ...prev, groups: [] }));
    }
  }, [formData.subjectId, dashboardData]);

  const contentTypes = [
    { value: 'pdf', label: 'PDF', icon: FileText, accept: '.pdf' },
    { value: 'video', label: 'Video', icon: Video, accept: '.mp4,.avi,.mov,.mkv' },
    { value: 'document', label: 'Document', icon: File, accept: '.doc,.docx,.txt' },
    { value: 'image', label: 'Image', icon: Image, accept: '.jpg,.jpeg,.png,.gif' },
    { value: 'link', label: 'Link', icon: Link2, accept: '' }
  ];

  const validateAndSetFile = (selectedFile: File) => {
    const maxSize = 100 * 1024 * 1024;
    if (selectedFile.size > maxSize) {
      setErrors(prev => ({ ...prev, file: 'File size must be less than 100MB' }));
      return;
    }
    setFile(selectedFile);
    setErrors(prev => ({ ...prev, file: '' }));
    
    if (selectedFile.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => setPreview(reader.result as string);
      reader.readAsDataURL(selectedFile);
    } else {
      setPreview(null);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(e.type === 'dragenter' || e.type === 'dragover');
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files?.[0]) validateAndSetFile(e.dataTransfer.files[0]);
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.title.trim()) newErrors.title = 'Title is required';
    if (!formData.contentType) newErrors.contentType = 'Content type is required';
    if (!formData.subjectId) newErrors.subjectId = 'Subject is required';
    if (formData.groups.length === 0) newErrors.groups = 'Select at least one group';
    if (formData.contentType !== 'link' && !file) newErrors.file = 'File is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      toast.error('Please fill all required fields');
      return;
    }
    
    const submitData = new FormData();
    submitData.append('title', formData.title);
    submitData.append('contentType', formData.contentType);
    submitData.append('subjectId', formData.subjectId);
    submitData.append('groups', JSON.stringify(formData.groups));
    submitData.append('description', formData.description);
    
    const tagsArray = formData.tags.split(',').map(t => t.trim()).filter(Boolean);
    submitData.append('tags', JSON.stringify(tagsArray));
    
    if (file) submitData.append('file', file);

    await upload('/teacher/posts', submitData);
  };

  const handleClear = () => {
    setFormData({ 
      title: '', 
      contentType: '', 
      subjectId: '', 
      groups: [], 
      description: '', 
      tags: '' 
    });
    setFile(null);
    setPreview(null);
    setErrors({});
    resetUpload();
  };

  if (!isOpen) return null;

  const selectedSubject = dashboardData.teacher.assignedSubjects.find(
    as => as.subjectId._id === formData.subjectId
  );

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between rounded-t-2xl">
          <h2 className="text-2xl font-bold text-gray-800">Upload Course Material</h2>
          <button 
            onClick={onClose} 
            className="p-2 hover:bg-gray-100 rounded-lg transition"
            type="button"
          >
            <X size={24} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Title */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => {
                setFormData(prev => ({ ...prev, title: e.target.value }));
                setErrors(prev => ({ ...prev, title: '' }));
              }}
              placeholder="e.g., Linear Algebra - Week 5 Notes"
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition ${
                errors.title ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.title && <p className="mt-1 text-sm text-red-600">{errors.title}</p>}
          </div>

          {/* Content Type */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              Content Type <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-5 gap-3">
              {contentTypes.map(type => {
                const Icon = type.icon;
                return (
                  <button
                    key={type.value}
                    type="button"
                    onClick={() => {
                      setFormData(prev => ({ ...prev, contentType: type.value }));
                      setErrors(prev => ({ ...prev, contentType: '' }));
                      setFile(null);
                      setPreview(null);
                    }}
                    className={`p-4 border-2 rounded-lg transition-all ${
                      formData.contentType === type.value
                        ? 'border-blue-500 bg-blue-50 shadow-md'
                        : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                    }`}
                  >
                    <Icon className={`mx-auto mb-2 ${
                      formData.contentType === type.value ? 'text-blue-600' : 'text-gray-600'
                    }`} size={24} />
                    <span className="text-xs font-medium text-gray-700">{type.label}</span>
                  </button>
                );
              })}
            </div>
            {errors.contentType && <p className="mt-1 text-sm text-red-600">{errors.contentType}</p>}
          </div>

          {/* Subject & Groups */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Subject */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Subject <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.subjectId}
                onChange={(e) => {
                  setFormData(prev => ({ ...prev, subjectId: e.target.value }));
                  setErrors(prev => ({ ...prev, subjectId: '' }));
                }}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition ${
                  errors.subjectId ? 'border-red-500' : 'border-gray-300'
                }`}
              >
                <option value="">Select subject</option>
                {dashboardData.teacher.assignedSubjects.map(as => (
                  <option key={as._id} value={as.subjectId._id}>
                    {as.subjectId.name} ({as.subjectId.code}) - Sem {as.semester}
                  </option>
                ))}
              </select>
              {errors.subjectId && <p className="mt-1 text-sm text-red-600">{errors.subjectId}</p>}
            </div>

            {/* Groups */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Groups <span className="text-red-500">*</span>
              </label>
              {availableGroups.length > 0 ? (
                <div className="flex flex-wrap gap-2 p-3 border border-gray-300 rounded-lg min-h-[48px]">
                  {availableGroups.map(group => (
                    <button
                      key={group._id}
                      type="button"
                      onClick={() => {
                        setFormData(prev => ({
                          ...prev,
                          groups: prev.groups.includes(group._id)
                            ? prev.groups.filter(g => g !== group._id)
                            : [...prev.groups, group._id]
                        }));
                        setErrors(prev => ({ ...prev, groups: '' }));
                      }}
                      className={`px-3 py-1.5 text-sm border-2 rounded-lg transition-all ${
                        formData.groups.includes(group._id)
                          ? 'border-blue-500 bg-blue-50 text-blue-700 font-medium'
                          : 'border-gray-200 hover:border-blue-300 text-gray-700'
                      }`}
                    >
                      {group.name}
                    </button>
                  ))}
                </div>
              ) : (
                <div className="p-3 border border-gray-300 rounded-lg bg-gray-50 text-sm text-gray-500">
                  {formData.subjectId ? 'No groups available' : 'Select a subject first'}
                </div>
              )}
              {errors.groups && <p className="mt-1 text-sm text-red-600">{errors.groups}</p>}
            </div>
          </div>

          {/* File Upload */}
          {formData.contentType && formData.contentType !== 'link' && (
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Upload File <span className="text-red-500">*</span>
              </label>
              <div
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-lg p-6 text-center transition-all ${
                  dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
                } ${errors.file ? 'border-red-500' : ''}`}
              >
                {file ? (
                  <div className="flex items-center gap-3">
                    {preview && (
                      <img src={preview} alt="" className="h-16 w-16 object-cover rounded" />
                    )}
                    <div className="flex-1 text-left">
                      <p className="font-medium text-gray-800">{file.name}</p>
                      <p className="text-sm text-gray-500">
                        {(file.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                    <button 
                      type="button"
                      onClick={() => { 
                        setFile(null); 
                        setPreview(null); 
                        setErrors(prev => ({ ...prev, file: '' }));
                      }} 
                      className="p-2 hover:bg-red-50 rounded-lg transition"
                    >
                      <X className="text-red-600" size={20} />
                    </button>
                  </div>
                ) : (
                  <>
                    <Upload className="mx-auto mb-3 text-gray-400" size={40} />
                    <p className="text-gray-600 mb-2">Drag and drop your file here, or</p>
                    <label className="inline-block px-6 py-2 bg-blue-600 text-white rounded-lg cursor-pointer hover:bg-blue-700 transition">
                      Browse Files
                      <input
                        type="file"
                        onChange={(e) => e.target.files?.[0] && validateAndSetFile(e.target.files[0])}
                        accept={contentTypes.find(t => t.value === formData.contentType)?.accept}
                        className="hidden"
                      />
                    </label>
                    <p className="text-xs text-gray-500 mt-2">Max file size: 100MB</p>
                  </>
                )}
              </div>
              {errors.file && <p className="mt-1 text-sm text-red-600">{errors.file}</p>}
            </div>
          )}

          {/* Description */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              rows={3}
              placeholder="Add description..."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition resize-none"
            />
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Tags
            </label>
            <input
              type="text"
              value={formData.tags}
              onChange={(e) => setFormData(prev => ({ ...prev, tags: e.target.value }))}
              placeholder="e.g., algebra, matrices, week5"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
            />
            <p className="text-xs text-gray-500 mt-1">Separate tags with commas</p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition"
              disabled={uploading}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={uploading}
              className="flex-1 px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {uploading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload size={20} />
                  Upload Material
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UploadMaterialModal;