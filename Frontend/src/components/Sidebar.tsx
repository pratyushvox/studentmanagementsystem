import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Home,
  BookOpen,
  Calendar,
  FileText,
  BarChart3,
  Users,
  Settings,
  Menu,
  X,
} from "lucide-react";

interface SidebarProps {
  userRole?: "student" | "teacher" | "admin";
  activeItem?: string;
  onItemClick?: (itemId: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ 
  userRole = "student",
  activeItem,
  onItemClick 
}) => {
  const [isOpen, setIsOpen] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  // Student Menu with paths
  const studentMenuItems = [
    { id: "dashboard", label: "Dashboard", icon: Home, path: "/student/dashboard" },
    { id: "courses", label: "My Courses", icon: BookOpen, path: "/student/courses" },
    { id: "assignments", label: "Assignments", icon: FileText, path: "/student/Assignment" },
    { id: "attendance", label: "Attendance", icon: Calendar, path: "/student/attendance" },
    { id: "grades", label: "Grades", icon: BarChart3, path: "/student/grades" },
    { id: "settings", label: "Settings", icon: Settings, path: "/student/settings" },
  ];

  // Teacher Menu with paths
  const teacherMenuItems = [
    { id: "dashboard", label: "Dashboard", icon: Home, path: "/teacher/dashboard" },
    { id: "courses", label: "My Courses", icon: BookOpen, path: "/teacher/courses" },
    { id: "students", label: "Students", icon: Users, path: "/teacher/students" },
    { id: "assignments", label: "Assignments", icon: FileText, path: "/teacher/assignments" },
    { id: "attendance", label: "Attendance", icon: Calendar, path: "/teacher/attendance" },
    { id: "grades", label: "Grades", icon: BarChart3, path: "/teacher/grades" },
    { id: "settings", label: "Settings", icon: Settings, path: "/teacher/settings" },
  ];

  // Admin Menu with paths
  const adminMenuItems = [
    { id: "dashboard", label: "Dashboard", icon: Home, path: "/admin/dashboard" },
    { id: "students", label: "Students", icon: Users, path: "/admin/students" },
    { id: "teachers", label: "Teachers", icon: Users, path: "/admin/teachers" },
    { id: "courses", label: "Courses", icon: BookOpen, path: "/admin/courses" },
    { id: "reports", label: "Groups", icon: BarChart3, path: "/admin/groups" },
    { id: "settings", label: "Settings", icon: Settings, path: "/admin/settings" },
  ];

  const menuItems =
    userRole === "teacher"
      ? teacherMenuItems
      : userRole === "admin"
      ? adminMenuItems
      : studentMenuItems;

  // Check if item is active - use prop if provided, otherwise check location
  const isActive = (itemId: string, path: string) => {
    if (activeItem !== undefined) {
      return activeItem === itemId;
    }
    return location.pathname === path;
  };

  const handleNavigation = (itemId: string, path: string) => {
    // Call the callback if provided
    if (onItemClick) {
      onItemClick(itemId);
    }
    
    // Navigate to the path
    navigate(path);
    
    // Close sidebar on mobile
    if (window.innerWidth < 1024) {
      setIsOpen(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="lg:hidden fixed bottom-4 right-4 z-50 p-3 bg-blue-600 text-white rounded-full shadow-lg"
      >
        {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
      </button>

      <aside
        className={`fixed left-0 top-16 h-[calc(100vh-4rem)] bg-white border-r border-gray-200 transition-transform duration-300 z-20 ${
          isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        <div className="w-64 h-full overflow-y-auto py-6">
          <nav className="space-y-1 px-3">
            {menuItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavigation(item.id, item.path)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                    isActive(item.id, item.path)
                      ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-md"
                      : "text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;