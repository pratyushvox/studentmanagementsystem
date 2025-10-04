import { Mail, Lock, Eye, EyeOff, GraduationCap } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

export default function Login() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast.error('Please fill in all fields');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 403) {
          toast.warning('Your account is pending admin approval. Please wait.');
        } else if (response.status === 404) {
          toast.error('User not found. Please check your email.');
        } else if (response.status === 401) {
          toast.error('Invalid credentials. Please try again.');
        } else {
          toast.error(data.message || 'Login failed. Please try again.');
        }
        setIsLoading(false);
        return;
      }

      // Store token and user info
      localStorage.setItem('token', data.token);
      localStorage.setItem('role', data.role);
      localStorage.setItem('fullName', data.fullName);

      toast.success('Login successful!');

      // Navigate based on role
      setTimeout(() => {
        if (data.role === 'student') {
          navigate('/Student/dashboard');
        } else if (data.role === 'teacher') {
          navigate('/teacher-dashboard');
        }
      }, 1000);

    } catch (error) {
      console.error('Login error:', error);
      toast.error('Network error. Please check your connection and try again.');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-teal-50 flex items-center justify-center px-4 sm:px-6 lg:px-8">
     
      <div className="absolute top-20 right-10 w-32 h-32 border-4 border-orange-300 rounded-full opacity-20"></div>
      <div className="absolute bottom-20 left-10 w-24 h-24 bg-teal-200 rounded-lg opacity-20 rotate-45"></div>
      
      <div className="max-w-md w-full space-y-10">
        {/* Logo and Header */}
        <div className="text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="w-12 h-12 bg-gray-200 rounded-xl flex items-center justify-center">
              <GraduationCap className="w-7 h-7 text-orange-500" />
            </div>
            <span className="text-3xl font-bold">PadhaiHub</span>
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome Back
          </h2>
          <p className="text-gray-600">
            Sign in to access your account
          </p>
        </div>

        {/* Login Form */}
        <div className="bg-white rounded-2xl shadow-xl p-8 space-y-6 ml-10 relative">
          <div className="absolute bottom-20 left-8 w-24 h-32 bg-pink-300 rounded-lg shadow-lg transform -rotate-12"></div>
        
          <form onSubmit={handleSubmit} className="space-y-5 relative z-10">
            {/* Email Input */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-700 focus:border-transparent"
                  placeholder="you@gmail.com"
                  disabled={isLoading}
                />
              </div>
            </div>

            {/* Password Input */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-700 focus:border-transparent"
                  placeholder="Enter your password"
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  disabled={isLoading}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  )}
                </button>
              </div>
            </div>

            {/* Forgot Password */}
            <div className="flex items-center justify-end">
              <div className="text-sm">
                <a href="#" className="font-medium text-teal-700 hover:text-teal-800">
                  Forgot password?
                </a>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 bg-teal-700 text-white font-semibold rounded-lg hover:bg-teal-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-700 transition-colors shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Signing In...' : 'Sign In'}
            </button>
          </form>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
          </div>
        </div>

        {/* Sign Up Link */}
        <p className="text-center text-sm text-gray-600">
          Don't have an account?{" "}
          <button
            onClick={() => navigate("/register")}
            className="font-medium text-teal-700 hover:text-teal-800 cursor-pointer"
          >
            Create an account
          </button>
        </p>
      </div>
    </div>
  );
}