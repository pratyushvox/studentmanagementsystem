// App.tsx
import './App.css';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ToastContainer, Bounce } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import ProtectedRoute from './components/routes/ProtectedRoute';
import Landingpage from './pages/Landingpage';
import { ProfileSetupGuard, ProfileSetupRedirect } from "./components/routes/ProfileSetupGuard";

//auth
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import AdminLogin from './pages/auth/AdminLogin';

//student
import StudentDashboardPage from "./pages/Student/Studentdashboard";
import StudentCoursesPage from './pages/Student/Studentcourse';
import StudentAssignmentsPage from './pages/Student/Studentassingment';
import ProfileSetup from './pages/Student/Studentprofilepage';


// teacher 

import TeacherDashboard from './pages/Teacher/Teacherdashboard'; 
import TeacherAssignments from './pages/Teacher/Teacherassignement';
import TeacherGradingDashboard from './pages/Teacher/Teachersubmission';
import TeacherPostUpload from './pages/Teacher/TeacherLearningresources';

//admin
import AdminDashboardPage from './pages/Admin/Admindashboard';
import AdminStudents from './pages/Admin/Student';
import AdminTeachers from './pages/Admin/Teacher';
import AdminCourses from './pages/Admin/Course';
import GroupManagement from './pages/Admin/Group';

function App() {
  return (
    <>
      <ToastContainer
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick={false}
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
        transition={Bounce}
      />

      <Router>
        <Routes>
          {/* public routes */}
          <Route path="/" element={<Landingpage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/register" element={<Register />} />


          <Route 
          path="/student/profile-setup" 
          element={
            <ProfileSetupRedirect>
              <ProfileSetup />
            </ProfileSetupRedirect>
          } 
        />

          {/* protected routes */}
          <Route
            path="/student/dashboard"
            element={
              <ProtectedRoute role="student">
                <StudentDashboardPage />
              </ProtectedRoute>
            }
          />
          <Route 
          path="/student/courses" element={
             <ProtectedRoute role="student">
              <StudentCoursesPage />
              </ProtectedRoute>
          } 
          />

           <Route 
          path="/student/Assignment" element={
             <ProtectedRoute role="student">
              <StudentAssignmentsPage />
              </ProtectedRoute>
          } 
          />


          <Route
            path="/admin/dashboard"
            element={
              <ProtectedRoute role="admin">
                <AdminDashboardPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/students"
            element={
              <ProtectedRoute role="admin">
                <AdminStudents />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/teachers"
            element={
              <ProtectedRoute role="admin">
                <AdminTeachers/>
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/courses"
            element={
              <ProtectedRoute role="admin">
                <AdminCourses />
              </ProtectedRoute>
            }
          />

           <Route
            path="/admin/groups"
            element={
              <ProtectedRoute role="admin">
                <GroupManagement />
              </ProtectedRoute>
            }
          />


           <Route
            path="/teacher/dashboard"
            element={
              <ProtectedRoute role="teacher">
                <TeacherDashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/teacher/assignments"
            element={
              <ProtectedRoute role="teacher">
                <TeacherAssignments />
              </ProtectedRoute>
            }
          />

          <Route
            path="/teacher/submission"
            element={
              <ProtectedRoute role="teacher">
                <TeacherGradingDashboard />
              </ProtectedRoute>
            }
          />

           <Route
            path="/teacher/learningresource"
            element={
              <ProtectedRoute role="teacher">
                <TeacherPostUpload />
              </ProtectedRoute>
            }
          />



        </Routes>
      </Router>
    </>
  );
}

export default App;

