import { Mail, Lock, Eye, EyeOff, GraduationCap, User } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import 'react-toastify/dist/ReactToastify.css';


export default function Register() {
  
  const navigate = useNavigate();

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [grade, setGrade] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    // Validation
    if (!fullName || !email || !password || !confirmPassword || !grade) {
      toast.error("Please fill in all fields");
      return;
    }

    if (password !== confirmPassword) {
      toast.error("Passwords do not match!");
      return;
    }

    if (password.length < 6) {
      toast.error("Password must be at least 6 characters long");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("http://localhost:5000/api/auth/register/student", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fullName,
          email,
          password,
          grade, 
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Registration failed");
      }

      // Success
      toast.success(data.message || "Registration successful! Please wait for admin approval.");
      
     
      setTimeout(() => {
        navigate("/login");
      }, 2000);
    } catch (err) {
      toast.error(err.message || "An error occurred during registration");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-teal-50 flex items-center justify-center px-4 sm:px-6 lg:px-8 py-12">
      {/* Decorative shapes */}
      <div className="absolute top-20 right-10 w-32 h-32 border-4 border-orange-300 rounded-full opacity-20"></div>
      <div className="absolute bottom-20 left-10 w-24 h-24 bg-teal-200 rounded-lg opacity-20 rotate-45"></div>

      <div className="max-w-md w-full space-y-10">
        {/* Logo and Header */}
        <div className="text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="w-12 h-12 bg-gray-200 rounded-xl flex items-center justify-center">
              <GraduationCap className="w-7 h-7 text-orange-600" />
            </div>
            <span className="text-3xl font-bold">PadhaiHub</span>
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2 ml-5">
            Create your Account
          </h2>
          <p className="text-gray-600 ml-5">Sign up to get started</p>
        </div>

        {/* Register Form */}
        <div className="bg-white rounded-2xl shadow-xl p-8 space-y-6 ml-10">
          <div className="space-y-5">
            {/* Full Name */}
            <div>
              <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-2">
                Full Name 
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  id="fullName"
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-700 focus:border-transparent"
                  placeholder="Full name"
                  disabled={loading}
                />
              </div>
            </div>

            {/* Grade Dropdown */}
            <div>
              <label htmlFor="grade" className="block text-sm font-medium text-gray-700 mb-2">
                Select Grade
              </label>
              <select
                id="grade"
                value={grade}
                onChange={(e) => setGrade(e.target.value)}
                className="block w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-700 focus:border-transparent bg-white"
                disabled={loading}
              >
                <option value="">-- Choose Grade --</option>
                <option value="Grade 11">Grade 11</option>
                <option value="Grade 12">Grade 12</option>
                <option value="Bachelor 1st Year">Bachelor 1st Year</option>
                <option value="Bachelor 2nd Year">Bachelor 2nd Year</option>
                <option value="Bachelor 3rd Year">Bachelor 3rd Year</option>
                <option value="Bachelor 4th Year">Bachelor 4th Year</option>

              </select>
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-700 focus:border-transparent"
                  placeholder="You@gmail.com"
                  disabled={loading}
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-700 focus:border-transparent"
                  placeholder="Create a password"
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  disabled={loading}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  )}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                Confirm Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="block w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-700 focus:border-transparent"
                  placeholder="Confirm your password"
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  disabled={loading}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  )}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="w-full py-3 px-4 bg-teal-700 text-white font-semibold rounded-lg hover:bg-teal-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-700 transition-colors shadow-lg disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {loading ? "Creating Account..." : "Create Account"}
            </button>
          </div>
        </div>

        {/* Sign In Link */}
        <p className="text-center text-sm text-gray-600">
          Already have an account?{" "}
          <button
            onClick={() => navigate("/login")}
            className="font-medium text-teal-700 hover:text-teal-800 cursor-pointer"
          >
            Sign in
          </button>
        </p>
      </div>
    </div>
  );
}