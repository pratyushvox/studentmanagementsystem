import React, { useState } from 'react';
import { Clock, Users, Video, Download, CheckCircle, PlayCircle, MessageSquare, Star, Filter, Search, BookOpen, FileText, Award, TrendingUp } from 'lucide-react';

import Navbar from '../../components/Navbar';
import Sidebar from '../../components/Sidebar';


interface Course {
  id: number;
  title: string;
  instructor: string;
  progress: number;
  totalLectures: number;
  completedLectures: number;
  students: number;
  rating: number;
  thumbnail: string;
  category: string;
  duration: string;
  nextClass?: string;
}

interface Material {
  id: number;
  title: string;
  type: 'pdf' | 'video' | 'doc';
  size: string;
  uploadDate: string;
}

export default function StudentCoursesPage() {
  const [activeItem, setActiveItem] = useState('courses');
  const [selectedCourse, setSelectedCourse] = useState<number | null>(null);
  const [filterCategory, setFilterCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const handleLogout = () => {
    alert('Logging out...');
  };

  const handleProfileClick = () => {
    alert('Edit Profile clicked');
  };

  const courses: Course[] = [
    {
      id: 1,
      title: 'Advanced Calculus',
      instructor: 'Dr. Sarah Johnson',
      progress: 85,
      totalLectures: 24,
      completedLectures: 20,
      students: 45,
      rating: 4.8,
      thumbnail: 'bg-gradient-to-br from-blue-500 to-blue-600',
      category: 'Mathematics',
      duration: '12 weeks',
      nextClass: 'Today at 2:00 PM'
    },
    {
      id: 2,
      title: 'Quantum Physics',
      instructor: 'Prof. Michael Chen',
      progress: 72,
      totalLectures: 30,
      completedLectures: 22,
      students: 38,
      rating: 4.9,
      thumbnail: 'bg-gradient-to-br from-purple-500 to-purple-600',
      category: 'Physics',
      duration: '14 weeks',
      nextClass: 'Tomorrow at 10:00 AM'
    },
    {
      id: 3,
      title: 'Literature 101',
      instructor: 'Dr. Emily Brown',
      progress: 90,
      totalLectures: 20,
      completedLectures: 18,
      students: 52,
      rating: 4.7,
      thumbnail: 'bg-gradient-to-br from-green-500 to-green-600',
      category: 'Literature',
      duration: '10 weeks',
      nextClass: 'Monday at 3:00 PM'
    },
    {
      id: 4,
      title: 'Organic Chemistry',
      instructor: 'Prof. David Lee',
      progress: 68,
      totalLectures: 28,
      completedLectures: 19,
      students: 41,
      rating: 4.6,
      thumbnail: 'bg-gradient-to-br from-orange-500 to-orange-600',
      category: 'Chemistry',
      duration: '13 weeks'
    },
    {
      id: 5,
      title: 'Data Structures',
      instructor: 'Dr. Alex Kumar',
      progress: 55,
      totalLectures: 32,
      completedLectures: 18,
      students: 67,
      rating: 4.9,
      thumbnail: 'bg-gradient-to-br from-red-500 to-red-600',
      category: 'Computer Science',
      duration: '15 weeks',
      nextClass: 'Wednesday at 11:00 AM'
    },
    {
      id: 6,
      title: 'World History',
      instructor: 'Prof. Maria Garcia',
      progress: 78,
      totalLectures: 18,
      completedLectures: 14,
      students: 35,
      rating: 4.5,
      thumbnail: 'bg-gradient-to-br from-teal-500 to-teal-600',
      category: 'History',
      duration: '9 weeks'
    }
  ];

  const courseMaterials: Material[] = [
    { id: 1, title: 'Lecture Notes - Chapter 5', type: 'pdf', size: '2.4 MB', uploadDate: '2 days ago' },
    { id: 2, title: 'Video Tutorial - Integration', type: 'video', size: '145 MB', uploadDate: '5 days ago' },
    { id: 3, title: 'Assignment Guidelines', type: 'doc', size: '1.2 MB', uploadDate: '1 week ago' },
    { id: 4, title: 'Practice Problems Set', type: 'pdf', size: '890 KB', uploadDate: '1 week ago' }
  ];

  const categories = ['all', 'Mathematics', 'Physics', 'Literature', 'Chemistry', 'Computer Science', 'History'];

  const filteredCourses = courses.filter(course => {
    const matchesCategory = filterCategory === 'all' || course.category === filterCategory;
    const matchesSearch = course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          course.instructor.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar onProfileClick={handleProfileClick} onLogout={handleLogout} />
      <Sidebar activeItem={activeItem} onItemClick={setActiveItem} userRole="student" />

      <main className="lg:ml-64 pt-16">
        <div className="p-6 lg:p-8 space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">My Courses</h1>
              <p className="text-gray-600 text-sm mt-1">
                Track your learning progress and access course materials
              </p>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Clock className="w-4 h-4" />
              <span>{courses.length} Active Courses</span>
            </div>
          </div>

          {/* Stats Overview */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white border border-gray-200 rounded-lg p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 font-medium">Total Courses</p>
                  <p className="text-2xl font-semibold text-gray-900 mt-2">{courses.length}</p>
                  <p className="text-xs text-gray-500 mt-1">This semester</p>
                </div>
                <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                  <BookOpen className="w-5 h-5 text-blue-600" />
                </div>
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 font-medium">Completed</p>
                  <p className="text-2xl font-semibold text-gray-900 mt-2">
                    {courses.reduce((acc, c) => acc + c.completedLectures, 0)}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">Total lectures</p>
                </div>
                <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                </div>
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 font-medium">Avg Progress</p>
                  <p className="text-2xl font-semibold text-gray-900 mt-2">
                    {Math.round(courses.reduce((acc, c) => acc + c.progress, 0) / courses.length)}%
                  </p>
                  <p className="text-xs text-green-600 mt-1">+12% this month</p>
                </div>
                <div className="w-10 h-10 bg-purple-50 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-purple-600" />
                </div>
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 font-medium">Certificates</p>
                  <p className="text-2xl font-semibold text-gray-900 mt-2">3</p>
                  <p className="text-xs text-gray-500 mt-1">Earned this year</p>
                </div>
                <div className="w-10 h-10 bg-amber-50 rounded-lg flex items-center justify-center">
                  <Award className="w-5 h-5 text-amber-600" />
                </div>
              </div>
            </div>
          </div>

          {/* Filters and Search */}
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search courses..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex items-center gap-2">
                <Filter className="w-5 h-5 text-gray-400" />
                <select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {categories.map(cat => (
                    <option key={cat} value={cat}>
                      {cat === 'all' ? 'All Categories' : cat}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Courses Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCourses.map((course) => (
              <div
                key={course.id}
                className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => setSelectedCourse(course.id)}
              >
                {/* Course Thumbnail */}
                <div className={`h-40 ${course.thumbnail} flex items-center justify-center`}>
                  <PlayCircle className="w-16 h-16 text-white opacity-80" />
                </div>

                {/* Course Details */}
                <div className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 text-base mb-1">
                        {course.title}
                      </h3>
                      <p className="text-sm text-gray-600">{course.instructor}</p>
                    </div>
                    <div className="flex items-center gap-1 text-sm">
                      <Star className="w-4 h-4 text-yellow-500 fill-current" />
                      <span className="font-semibold text-gray-900">{course.rating}</span>
                    </div>
                  </div>

                  {/* Course Info */}
                  <div className="flex items-center gap-4 mb-3 text-xs text-gray-600">
                    <div className="flex items-center gap-1">
                      <Video className="w-4 h-4" />
                      <span>{course.totalLectures} lectures</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Users className="w-4 h-4" />
                      <span>{course.students}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      <span>{course.duration}</span>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="mb-3">
                    <div className="flex items-center justify-between text-sm mb-2">
                      <span className="text-gray-600">Progress</span>
                      <span className="font-semibold text-gray-900">{course.progress}%</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2">
                      <div
                        className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all"
                        style={{ width: `${course.progress}%` }}
                      ></div>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      {course.completedLectures} of {course.totalLectures} completed
                    </p>
                  </div>

                  {/* Next Class */}
                  {course.nextClass && (
                    <div className="bg-blue-50 border border-blue-100 rounded-lg px-3 py-2 text-xs text-blue-700">
                      <span className="font-medium">Next class:</span> {course.nextClass}
                    </div>
                  )}

                  {/* Action Button */}
                  <button className="w-full mt-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white py-2 rounded-lg font-medium hover:shadow-lg transition-shadow">
                    Continue Learning
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Course Materials Section */}
          <div className="bg-white border border-gray-200 rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Recent Course Materials</h2>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {courseMaterials.map((material) => (
                  <div
                    key={material.id}
                    className="flex items-center gap-4 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                      material.type === 'pdf' ? 'bg-red-50' :
                      material.type === 'video' ? 'bg-blue-50' : 'bg-green-50'
                    }`}>
                      {material.type === 'pdf' ? (
                        <FileText className={`w-6 h-6 ${material.type === 'pdf' ? 'text-red-600' : ''}`} />
                      ) : material.type === 'video' ? (
                        <Video className="w-6 h-6 text-blue-600" />
                      ) : (
                        <FileText className="w-6 h-6 text-green-600" />
                      )}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900 text-sm">{material.title}</h3>
                      <p className="text-xs text-gray-600 mt-1">
                        {material.size} • {material.uploadDate}
                      </p>
                    </div>
                    <button className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                      <Download className="w-5 h-5" />
                    </button>
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