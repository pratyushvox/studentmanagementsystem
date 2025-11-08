// src/components/Navbar.tsx
import { useState, useEffect } from "react";
import { GraduationCap, LogOut, User, Bell } from "lucide-react";
import { useNavigate } from "react-router-dom";
import ProfileCard from "./ProfileCard";
import { useApiGet } from "../hooks/useApi";

interface NavbarProps {
  onProfileClick?: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ onProfileClick }) => {
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showProfileCard, setShowProfileCard] = useState(false);
  const [userData, setUserData] = useState<any>(null);
  const [profileData, setProfileData] = useState<any>(null);
  const navigate = useNavigate();

  // Fetch user profile data
  const { data: studentProfile, refetch: fetchStudentProfile } = useApiGet(
    "/student/profile",
    { autoFetch: true }
  );

  const { data: teacherProfile, refetch: fetchTeacherProfile } = useApiGet(
    "/teacher/profile",
    { autoFetch: true }
  );

  useEffect(() => {
    // Parse user info safely
    const storedUser = (() => {
      try {
        const stored = localStorage.getItem("user");
        return stored ? JSON.parse(stored) : null;
      } catch {
        return null;
      }
    })();

    setUserData(storedUser);
  }, []);

  const handleProfileClick = async () => {
    if (onProfileClick) {
      onProfileClick();
    } else {
      try {
        if (userData?.role === 'student') {
          await fetchStudentProfile();
        } else if (userData?.role === 'teacher') {
          await fetchTeacherProfile();
        }
        setShowProfileCard(true);
      } catch (error) {
        console.error('Error fetching profile:', error);
      }
    }
    setShowProfileMenu(false);
  };

  useEffect(() => {
    if (userData?.role === 'student' && studentProfile) {
      setProfileData(studentProfile.student);
    } else if (userData?.role === 'teacher' && teacherProfile) {
      setProfileData(teacherProfile.teacher);
    }
  }, [studentProfile, teacherProfile, userData]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    localStorage.removeItem("fullName");
    localStorage.removeItem("user");
    navigate("/login");
  };

  const handleContact = (userId: string) => {
    console.log('Contact user:', userId);
    // Implement contact logic here
    setShowProfileCard(false);
  };

  const handleViewAssignments = (userId: string) => {
    console.log('View assignments for user:', userId);
    if (userData?.role === 'student') {
      navigate('/assignments');
    }
    setShowProfileCard(false);
  };

  const handleViewProfile = (userId: string) => {
    console.log('View full profile for user:', userId);
    navigate('/profile');
    setShowProfileCard(false);
  };

  const fullName = userData?.fullName || "User";
  const role = userData?.role || "Guest";

  // Prepare profile data for ProfileCard
  const getProfileCardData = () => {
    if (!profileData) return null;

    if (role === 'student') {
      return {
        _id: profileData._id,
        studentId: profileData.studentId,
        fullName: profileData.fullName || userData?.fullName,
        email: userData?.email,
        phoneNumber: profileData.phoneNumber,
        dateOfBirth: profileData.dateOfBirth,
        bio: profileData.bio,
        profilePhoto: profileData.profilePhoto,
        currentSemester: profileData.currentSemester,
        enrollmentYear: profileData.enrollmentYear,
        status: profileData.status,
        address: profileData.address,
        guardian: profileData.guardian,
        group: profileData.groupId, // This might need to be populated
        academicHistory: profileData.academicHistory
      };
    } else if (role === 'teacher') {
      return {
        _id: profileData._id,
        teacherId: profileData.teacherId,
        fullName: profileData.fullName || userData?.fullName,
        email: profileData.email || userData?.email,
        phoneNumber: profileData.phoneNumber,
        dateOfBirth: profileData.dateOfBirth,
        bio: profileData.bio,
        profilePhoto: profileData.profilePhoto,
        department: profileData.department,
        specialization: profileData.specialization,
        isModuleLeader: profileData.isModuleLeader,
        moduleLeaderSubjects: profileData.moduleLeaderSubjects,
        assignedSubjects: profileData.assignedSubjects
      };
    }
    return null;
  };

  return (
    <>
      <nav className="bg-white border-b border-gray-200 fixed w-full z-40 top-0">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center">
              <div className="flex-shrink-0 flex items-center gap-5">
                <GraduationCap className="w-9 h-9 text-[#ea7d17]" />
                <span className="text-2xl font-bold text-gray-900">पढाइhub</span>
              </div>
            </div>

            {/* Right section */}
            <div className="flex items-center gap-4">
              {/* Notifications */}
              <button className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors relative">
                <Bell className="w-5 h-5" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              </button>

              {/* Profile Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setShowProfileMenu(!showProfileMenu)}
                  className="flex items-center gap-3 p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <div className="w-8 h-8 rounded-full overflow-hidden bg-gray-200 flex items-center justify-center">
  {profileData?.profilePhoto ? (
    <img
      src={profileData.profilePhoto}
      alt="Profile"
      className="w-full h-full object-cover"
    />
  ) : (
    <span className="text-white font-semibold bg-gradient-to-br from-blue-500 to-purple-500 w-full h-full flex items-center justify-center">
      {fullName.charAt(0).toUpperCase()}
    </span>
  )}
</div>

                  <div className="hidden sm:block text-left">
                    <p className="text-sm font-semibold text-gray-700">{fullName}</p>
                    <p className="text-xs text-gray-500 capitalize">{role}</p>
                  </div>
                </button>

                {showProfileMenu && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                    <button
                      onClick={handleProfileClick}
                      className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                    >
                      <User className="w-4 h-4" />
                      Profile
                    </button>
                    <button
                      onClick={() => {
                        handleLogout();
                        setShowProfileMenu(false);
                      }}
                      className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                    >
                      <LogOut className="w-4 h-4" />
                      Logout
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Profile Card Modal */}
      {showProfileCard && profileData && (
        <ProfileCard
          user={getProfileCardData()}
          role={role as 'student' | 'teacher'}
          isOpen={showProfileCard}
          onClose={() => setShowProfileCard(false)}
          showActions={true}
          onContact={handleContact}
          onViewAssignments={role === 'student' ? handleViewAssignments : undefined}
          onViewProfile={handleViewProfile}
        />
      )}
    </>
  );
};

export default Navbar;