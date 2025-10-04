// components/routes/ProtectedRoute.tsx
import type { JSX } from "react";
import { Navigate } from "react-router-dom";

interface ProtectedRouteProps {
  children: JSX.Element;
  role?: "student" | "teacher" | "admin";
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, role }) => {
  const token = localStorage.getItem("token");
  const userRole = localStorage.getItem("role");

  if (!token) {
    // not logged in → go to login
    return <Navigate to="/login" replace />;
  }

  if (role && userRole !== role) {
    // logged in but wrong role → redirect
    return <Navigate to="/" replace />;
  }

  return children;
};

export default ProtectedRoute;
