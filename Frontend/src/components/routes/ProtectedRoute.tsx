// components/routes/ProtectedRoute.tsx
import { JSX } from "react";
import { Navigate } from "react-router-dom";

interface ProtectedRouteProps {
  children: JSX.Element;
  role?: "student" | "teacher" | "admin";
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, role }) => {
  const token = localStorage.getItem("token");
  const user = localStorage.getItem("user");

  if (!token || !user) {
    // not logged in → go to login
    return <Navigate to="/login" replace />;
  }

  let parsedUser;
  try {
    parsedUser = JSON.parse(user);
  } catch {
    return <Navigate to="/login" replace />;
  }

  const userRole = parsedUser.role;

  if (role && userRole !== role) {
    // logged in but wrong role → send to their own dashboard
    switch (userRole) {
      case "student":
        return <Navigate to="/student/dashboard" replace />;
      case "teacher":
        return <Navigate to="/teacher/dashboard" replace />;
      case "admin":
        return <Navigate to="/admin/dashboard" replace />;
      default:
        return <Navigate to="/login" replace />;
    }
  }

  return children;
};

export default ProtectedRoute;
