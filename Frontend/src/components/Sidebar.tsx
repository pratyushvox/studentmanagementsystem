import React, { useState } from "react";
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
  activeItem: string;
  onItemClick: (id: string) => void;
  userRole?: "student" | "teacher" | "admin";
}

const Sidebar: React.FC<SidebarProps> = ({
  activeItem,
  onItemClick,
  userRole = "student",
}) => {
  const [isOpen, setIsOpen] = useState(true);

  // Student Menu
  const studentMenuItems = [
    { id: "dashboard", label: "Dashboard", icon: Home },
    { id: "courses", label: "My Courses", icon: BookOpen },
    { id: "assignments", label: "Assignments", icon: FileText },
    { id: "attendance", label: "Attendance", icon: Calendar },
    { id: "grades", label: "Grades", icon: BarChart3 },
    { id: "settings", label: "Settings", icon: Settings },
  ];

  // Teacher Menu
  const teacherMenuItems = [
    { id: "dashboard", label: "Dashboard", icon: Home },
    { id: "courses", label: "My Courses", icon: BookOpen },
    { id: "students", label: "Students", icon: Users },
    { id: "assignments", label: "Assignments", icon: FileText },
    { id: "attendance", label: "Attendance", icon: Calendar },
    { id: "grades", label: "Grades", icon: BarChart3 },
    { id: "settings", label: "Settings", icon: Settings },
  ];

  // Admin Menu
  const adminMenuItems = [
    { id: "dashboard", label: "Dashboard", icon: Home },
    { id: "students", label: "Students", icon: Users },
    { id: "teachers", label: "Teachers", icon: Users },
    { id: "courses", label: "Courses", icon: BookOpen },
    { id: "reports", label: "Reports", icon: BarChart3 },
    { id: "settings", label: "Settings", icon: Settings },
  ];

  // Choose menu based on role
  const menuItems =
    userRole === "teacher"
      ? teacherMenuItems
      : userRole === "admin"
      ? adminMenuItems
      : studentMenuItems;

  return (
    <>
      {/* Mobile toggle button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="lg:hidden fixed bottom-4 right-4 z-50 p-3 bg-blue-600 text-white rounded-full shadow-lg"
      >
        {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
      </button>

      {/* Sidebar */}
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
                  onClick={() => onItemClick(item.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                    activeItem === item.id
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
