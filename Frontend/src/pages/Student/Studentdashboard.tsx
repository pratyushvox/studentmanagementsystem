import { useState } from "react";
import { Clock, Calendar, FileText, TrendingUp, Award, BarChart3, BookOpen, Users, Target } from "lucide-react";
import Navbar from "../../components/Navbar";
import Sidebar from "../../components/Sidebar";

export default function StudentDashboardPage() {
  const [activeItem, setActiveItem] = useState("dashboard");

 


  return (
    <div className="min-h-screen bg-gray-50">
         
   
      {/* Navbar */}
      <Navbar />

      {/* Sidebar */}
      <Sidebar activeItem={activeItem} onItemClick={setActiveItem} userRole="student" />
      {/* Dashboard Content */}
      <main className="lg:ml-64 pt-16">
        <div className="p-6 lg:p-8 space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
              <p className="text-gray-600 text-sm mt-1">Welcome back, John Smith</p>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Clock className="w-4 h-4" />
              <span>Last updated: 2 minutes ago</span>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white border border-gray-200 rounded-lg p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 font-medium">Attendance Rate</p>
                  <p className="text-2xl font-semibold text-gray-900 mt-2">92.5%</p>
                  <p className="text-xs text-green-600 mt-1">+2.5% from last month</p>
                </div>
                <div className="w-10 h-10 bg-teal-50 rounded-lg flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-teal-600" />
                </div>
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 font-medium">Pending Tasks</p>
                  <p className="text-2xl font-semibold text-gray-900 mt-2">8</p>
                  <p className="text-xs text-orange-600 mt-1">3 due this week</p>
                </div>
                <div className="w-10 h-10 bg-orange-50 rounded-lg flex items-center justify-center">
                  <FileText className="w-5 h-5 text-orange-600" />
                </div>
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 font-medium">Average GPA</p>
                  <p className="text-2xl font-semibold text-gray-900 mt-2">3.8</p>
                  <p className="text-xs text-gray-500 mt-1">Out of 4.0</p>
                </div>
                <div className="w-10 h-10 bg-emerald-50 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-emerald-600" />
                </div>
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 font-medium">Completed Courses</p>
                  <p className="text-2xl font-semibold text-gray-900 mt-2">12</p>
                  <p className="text-xs text-gray-500 mt-1">2 this semester</p>
                </div>
                <div className="w-10 h-10 bg-amber-50 rounded-lg flex items-center justify-center">
                  <Award className="w-5 h-5 text-amber-600" />
                </div>
              </div>
            </div>
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Enrolled Courses */}
            <div className="lg:col-span-2 bg-white border border-gray-200 rounded-lg">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Enrolled Courses</h2>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  {[
                    { 
                      title: "Advanced Calculus", 
                      instructor: "Dr. Sarah Johnson", 
                      progress: 85, 
                      students: 45,
                      status: "In Progress"
                    },
                    { 
                      title: "Quantum Physics", 
                      instructor: "Prof. Michael Chen", 
                      progress: 72, 
                      students: 38,
                      status: "In Progress"
                    },
                    { 
                      title: "Literature 101", 
                      instructor: "Dr. Emily Brown", 
                      progress: 90, 
                      students: 52,
                      status: "In Progress"
                    },
                    { 
                      title: "Organic Chemistry", 
                      instructor: "Prof. David Lee", 
                      progress: 68, 
                      students: 41,
                      status: "In Progress"
                    },
                  ].map((course, idx) => (
                    <div key={idx} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900 text-sm">{course.title}</h3>
                          <p className="text-xs text-gray-600 mt-1">{course.instructor}</p>
                          <div className="flex items-center gap-3 mt-2">
                            <div className="flex items-center gap-1 text-xs text-gray-500">
                              <Users className="w-3 h-3" />
                              <span>{course.students} students</span>
                            </div>
                            <span className="text-xs px-2 py-0.5 bg-blue-50 text-blue-700 rounded">
                              {course.status}
                            </span>
                          </div>
                        </div>
                        <div className="text-right ml-4">
                          <span className="text-sm font-semibold text-gray-900">{course.progress}%</span>
                        </div>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-1.5">
                        <div
                          className="bg-teal-600 h-1.5 rounded-full"
                          style={{ width: `${course.progress}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Upcoming Assignments */}
              <div className="bg-white border border-gray-200 rounded-lg">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h2 className="text-lg font-semibold text-gray-900">Upcoming Assignments</h2>
                </div>
                <div className="p-6">
                  <div className="space-y-4">
                    {[
                      { title: "Mathematics Quiz 3", course: "Advanced Calculus", due: "2 days" },
                      { title: "Physics Lab Report", course: "Quantum Physics", due: "4 days" },
                      { title: "English Essay", course: "Literature 101", due: "1 week" },
                    ].map((assignment, idx) => (
                      <div key={idx} className="pb-4 border-b border-gray-100 last:border-0 last:pb-0">
                        <h3 className="font-medium text-gray-900 text-sm">{assignment.title}</h3>
                        <p className="text-xs text-gray-600 mt-1">{assignment.course}</p>
                        <p className="text-xs text-gray-500 mt-2">Due in {assignment.due}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Recent Activity */}
              <div className="bg-white border border-gray-200 rounded-lg">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h2 className="text-lg font-semibold text-gray-900">Recent Activity</h2>
                </div>
                <div className="p-6">
                  <div className="space-y-4">
                    {[
                      { action: "Grade Posted", detail: "Mathematics Quiz 2: A+", time: "2h ago" },
                      { action: "New Assignment", detail: "Physics Lab Report", time: "5h ago" },
                      { action: "Attendance Marked", detail: "English Literature", time: "1d ago" },
                    ].map((activity, idx) => (
                      <div key={idx} className="pb-4 border-b border-gray-100 last:border-0 last:pb-0">
                        <p className="font-medium text-gray-900 text-sm">{activity.action}</p>
                        <p className="text-xs text-gray-600 mt-1">{activity.detail}</p>
                        <p className="text-xs text-gray-500 mt-2">{activity.time}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Course Performance */}
          <div className="bg-white border border-gray-200 rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Course Performance</h2>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                  { course: "Advanced Calculus", grade: "A", score: 92 },
                  { course: "Quantum Physics", grade: "B+", score: 87 },
                  { course: "Literature 101", grade: "A", score: 94 },
                  { course: "Organic Chemistry", grade: "B", score: 84 },
                ].map((course, idx) => (
                  <div key={idx} className="text-center border border-gray-200 rounded-lg p-4">
                    <div className="text-3xl font-bold text-gray-900">{course.grade}</div>
                    <p className="text-sm text-gray-600 mt-2">{course.course}</p>
                    <p className="text-xs text-gray-500 mt-1">{course.score}% Average</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}