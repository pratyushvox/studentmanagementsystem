import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

interface ProfileSetupGuardProps {
  children: React.ReactNode;
}

export const ProfileSetupGuard: React.FC<ProfileSetupGuardProps> = ({ children }) => {
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const checkProfile = () => {
      const token = localStorage.getItem("token");
      const userStr = localStorage.getItem("user");

      if (!token || !userStr) {
        navigate("/login");
        return;
      }

      try {
        const user = JSON.parse(userStr);
        if (user.role === "student" && !user.profileCompleted) {
  setTimeout(() => {
    navigate("/student/profile-setup", { replace: true });
  }, 100);
  return;
}

        setLoading(false);
      } catch (error) {
        console.error("Error parsing user data:", error);
        navigate("/login");
      }
    };

    checkProfile();
  }, [navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export const ProfileSetupRedirect: React.FC<ProfileSetupGuardProps> = ({ children }) => {
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const checkProfile = () => {
      const token = localStorage.getItem("token");
      const userStr = localStorage.getItem("user");

      if (!token || !userStr) {
        navigate("/login");
        return;
      }

      try {
        const user = JSON.parse(userStr);
        
       if (user.role === "student" && user.profileCompleted) {
  setTimeout(() => {
    navigate("/student/dashboard", { replace: true });
  }, 100);
  return;
}

        setLoading(false);
      } catch (error) {
        console.error("Error parsing user data:", error);
        navigate("/login");
      }
    };

    checkProfile();
  }, [navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
