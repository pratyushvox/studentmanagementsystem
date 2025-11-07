// components/ProfileCard.tsx
import React from 'react';
import { 
  User, 
  Mail, 
  Phone, 
  Calendar,
  MapPin,
  BookOpen,
  Award,
  BarChart3,
  Users,
  GraduationCap,
  BookMarked,
  Building,
  X,
  Shield,
  BookText
} from 'lucide-react';

interface ProfileCardProps {
  user: {
    _id: string;
    userId?: string;
    studentId?: string;
    teacherId?: string;
    fullName: string;
    email?: string;
    phoneNumber?: string;
    dateOfBirth?: string;
    bio?: string;
    profilePhoto?: string;
    
    // Student specific fields
    currentSemester?: number;
    enrollmentYear?: number;
    status?: "active" | "failed" | "promoted" | "graduated";
    address?: {
      city?: string;
      province?: string;
    };
    guardian?: {
      name: string;
      relationship: string;
      phoneNumber: string;
      email?: string;
    };
    group?: {
      _id: string;
      name: string;
      semester: number;
    };
    academicHistory?: Array<{
      semester: number;
      semesterPassed: boolean;
      promotedAt?: string;
    }>;
    
    // Teacher specific fields
    department?: string;
    specialization?: string;
    isModuleLeader?: boolean;
    moduleLeaderSubjects?: Array<{
      _id: string;
      name: string;
      code: string;
    }>;
    assignedSubjects?: Array<{
      subjectId: {
        _id: string;
        name: string;
        code: string;
      };
      semester: number;
      groups: Array<{
        _id: string;
        name: string;
        semester?: number;
      }>;
    }>;
  };
  role: 'student' | 'teacher';
  isOpen: boolean;
  onClose: () => void;
  showActions?: boolean;
  onContact?: (userId: string) => void;
  onViewAssignments?: (userId: string) => void;
  onViewProfile?: (userId: string) => void;
}

const ProfileCard: React.FC<ProfileCardProps> = ({
  user,
  role,
  isOpen,
  onClose,
  showActions = true,
  onContact,
  onViewAssignments,
  onViewProfile
}) => {
  if (!isOpen) return null;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'promoted':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'graduated':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'failed':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active':
        return 'Active';
      case 'promoted':
        return 'Promoted';
      case 'graduated':
        return 'Graduated';
      case 'failed':
        return 'Failed';
      default:
        return status;
    }
  };

  const calculateAge = (dateOfBirth: string) => {
    const birthDate = new Date(dateOfBirth);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  };

  const getPassedSemesters = () => {
    if (!user.academicHistory) return 0;
    return user.academicHistory.filter(sem => sem.semesterPassed).length;
  };

  const getTotalSubjects = () => {
    if (role === 'teacher' && user.assignedSubjects) {
      return user.assignedSubjects.length;
    }
    return 0;
  };

  const getTotalGroups = () => {
    if (role === 'teacher' && user.assignedSubjects) {
      return user.assignedSubjects.reduce((total, subject) => total + subject.groups.length, 0);
    }
    return 0;
  };

  // Group assigned subjects by semester for better organization
  const getSubjectsBySemester = () => {
    if (!user.assignedSubjects) return {};
    
    return user.assignedSubjects.reduce((acc: any, subject) => {
      const semester = subject.semester;
      if (!acc[semester]) {
        acc[semester] = [];
      }
      acc[semester].push(subject);
      return acc;
    }, {});
  };

  const subjectsBySemester = getSubjectsBySemester();

  return (
    <div className="fixed inset-0 backdrop-blur-sm bg-white/30 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-xl border border-gray-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 border-b border-gray-200 relative">
          <button
            onClick={onClose}
            className="absolute right-4 top-4 text-gray-400 hover:text-gray-600 transition-colors p-1 hover:bg-white rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
          
          <div className="flex items-start space-x-4">
            <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center border-4 border-white shadow-sm">
              {user.profilePhoto ? (
                <img 
                  src={user.profilePhoto} 
                  alt={user.fullName}
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                <User className="w-10 h-10 text-blue-600" />
              )}
            </div>
            <div className="flex-1">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">{user.fullName}</h2>
                  <p className="text-gray-600 flex items-center gap-2 mt-1">
                    {role === 'student' ? (
                      <>
                        <BookOpen className="w-4 h-4" />
                        {user.studentId}
                      </>
                    ) : (
                      <>
                        <Shield className="w-4 h-4" />
                        {user.teacherId}
                      </>
                    )}
                  </p>
                </div>
                <div className="text-right">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium border ${
                    role === 'student' 
                      ? getStatusColor(user.status || 'active')
                      : 'bg-blue-100 text-blue-800 border-blue-200'
                  }`}>
                    {role === 'student' 
                      ? getStatusText(user.status || 'active')
                      : user.isModuleLeader ? 'Module Leader' : 'Teacher'
                    }
                  </span>
                </div>
              </div>
              
              {user.bio && (
                <p className="text-gray-600 mt-3 text-sm">{user.bio}</p>
              )}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(90vh-200px)]">
          <div className="p-6">
            {/* Stats Overview */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              {role === 'student' ? (
                <>
                  <div className="text-center p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <GraduationCap className="w-6 h-6 text-blue-600 mx-auto mb-1" />
                    <div className="text-lg font-bold text-gray-900">{user.currentSemester || 1}</div>
                    <div className="text-xs text-gray-500">Current Sem</div>
                  </div>
                  <div className="text-center p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <Award className="w-6 h-6 text-green-600 mx-auto mb-1" />
                    <div className="text-lg font-bold text-gray-900">{getPassedSemesters()}</div>
                    <div className="text-xs text-gray-500">Passed Sems</div>
                  </div>
                  <div className="text-center p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <Calendar className="w-6 h-6 text-purple-600 mx-auto mb-1" />
                    <div className="text-lg font-bold text-gray-900">{user.enrollmentYear}</div>
                    <div className="text-xs text-gray-500">Enrollment</div>
                  </div>
                  <div className="text-center p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <Users className="w-6 h-6 text-orange-600 mx-auto mb-1" />
                    <div className="text-lg font-bold text-gray-900">{user.group?.name || 'N/A'}</div>
                    <div className="text-xs text-gray-500">Group</div>
                  </div>
                </>
              ) : (
                <>
                  <div className="text-center p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <BookMarked className="w-6 h-6 text-blue-600 mx-auto mb-1" />
                    <div className="text-lg font-bold text-gray-900">{getTotalSubjects()}</div>
                    <div className="text-xs text-gray-500">Subjects</div>
                  </div>
                  <div className="text-center p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <Users className="w-6 h-6 text-green-600 mx-auto mb-1" />
                    <div className="text-lg font-bold text-gray-900">{getTotalGroups()}</div>
                    <div className="text-xs text-gray-500">Groups</div>
                  </div>
                  <div className="text-center p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <Building className="w-6 h-6 text-purple-600 mx-auto mb-1" />
                    <div className="text-lg font-bold text-gray-900">{user.department || 'N/A'}</div>
                    <div className="text-xs text-gray-500">Department</div>
                  </div>
                  <div className="text-center p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <Award className="w-6 h-6 text-orange-600 mx-auto mb-1" />
                    <div className="text-lg font-bold text-gray-900">
                      {user.isModuleLeader ? 'Yes' : 'No'}
                    </div>
                    <div className="text-xs text-gray-500">Module Leader</div>
                  </div>
                </>
              )}
            </div>

            {/* Contact Information */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Contact Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {user.email && (
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <Mail className="w-4 h-4 text-gray-500" />
                    <div>
                      <div className="text-sm text-gray-500">Email</div>
                      <div className="font-medium">{user.email}</div>
                    </div>
                  </div>
                )}
                
                {user.phoneNumber && (
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <Phone className="w-4 h-4 text-gray-500" />
                    <div>
                      <div className="text-sm text-gray-500">Phone</div>
                      <div className="font-medium">{user.phoneNumber}</div>
                    </div>
                  </div>
                )}
                
                {user.dateOfBirth && (
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <Calendar className="w-4 h-4 text-gray-500" />
                    <div>
                      <div className="text-sm text-gray-500">Date of Birth</div>
                      <div className="font-medium">
                        {new Date(user.dateOfBirth).toLocaleDateString()} 
                        {calculateAge(user.dateOfBirth) && (
                          <span className="text-gray-500 ml-1">
                            ({calculateAge(user.dateOfBirth)} years)
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                )}
                
                {user.address && (user.address.city || user.address.province) && (
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <MapPin className="w-4 h-4 text-gray-500" />
                    <div>
                      <div className="text-sm text-gray-500">Address</div>
                      <div className="font-medium">
                        {[user.address.city, user.address.province].filter(Boolean).join(', ')}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Teacher Specific Sections */}
            {role === 'teacher' && (
              <>
                {/* Assigned Subjects */}
                {user.assignedSubjects && user.assignedSubjects.length > 0 && (
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      <BookText className="w-5 h-5 text-blue-600" />
                      Assigned Subjects
                    </h3>
                    <div className="space-y-4">
                      {Object.entries(subjectsBySemester).map(([semester, subjects]: [string, any]) => (
                        <div key={semester} className="border border-gray-200 rounded-lg overflow-hidden">
                          <div className="bg-blue-50 px-4 py-2 border-b border-blue-200">
                            <h4 className="font-semibold text-blue-800">Semester {semester}</h4>
                          </div>
                          <div className="divide-y divide-gray-200">
                            {subjects.map((subject: any, index: number) => (
                              <div key={subject.subjectId._id} className="p-4">
                                <div className="flex items-start justify-between mb-2">
                                  <div>
                                    <div className="font-semibold text-gray-900">
                                      {subject.subjectId.name}
                                    </div>
                                    <div className="text-sm text-gray-600">
                                      Code: {subject.subjectId.code}
                                    </div>
                                  </div>
                                  <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-medium">
                                    {subject.groups.length} group(s)
                                  </span>
                                </div>
                                {subject.groups.length > 0 && (
                                  <div className="mt-2">
                                    <div className="text-sm text-gray-500 mb-1">Assigned Groups:</div>
                                    <div className="flex flex-wrap gap-1">
                                      {subject.groups.map((group: any) => (
                                        <span
                                          key={group._id}
                                          className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs border"
                                        >
                                          {group.name}
                                        </span>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Specialization */}
                {user.specialization && (
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Specialization</h3>
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <div className="font-medium">{user.specialization}</div>
                    </div>
                  </div>
                )}

                {/* Module Leader Subjects */}
                {user.isModuleLeader && user.moduleLeaderSubjects && user.moduleLeaderSubjects.length > 0 && (
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Module Leader For</h3>
                    <div className="space-y-2">
                      {user.moduleLeaderSubjects.map((subject, index) => (
                        <div key={subject._id} className="flex items-center justify-between p-3 bg-purple-50 border border-purple-200 rounded-lg">
                          <div>
                            <div className="font-medium">{subject.name}</div>
                            <div className="text-sm text-gray-600">{subject.code}</div>
                          </div>
                          <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded text-xs font-medium">
                            Module Leader
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}

            {/* Student Specific Sections */}
            {role === 'student' && user.guardian && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Guardian Information</h3>
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <div className="text-sm text-gray-500">Name</div>
                      <div className="font-medium">{user.guardian.name}</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-500">Relationship</div>
                      <div className="font-medium">{user.guardian.relationship}</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-500">Phone</div>
                      <div className="font-medium">{user.guardian.phoneNumber}</div>
                    </div>
                    {user.guardian.email && (
                      <div>
                        <div className="text-sm text-gray-500">Email</div>
                        <div className="font-medium">{user.guardian.email}</div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        
      </div>
    </div>
  );
};

export default ProfileCard;