// App.tsx
import './App.css';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ToastContainer, Bounce } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import ProtectedRoute from './components/routes/ProtectedRoute';
import Landingpage from './pages/Landingpage';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import AdminLogin from './pages/auth/AdminLogin';
import StudentDashboardPage from "./pages/Student/Studentdashboard";
import StudentCoursesPage from './pages/Student/Studentcourse';

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

        </Routes>
      </Router>
    </>
  );
}

export default App;

