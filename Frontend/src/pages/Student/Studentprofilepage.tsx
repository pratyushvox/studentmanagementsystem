import { useState } from "react";
import { User, Calendar, GraduationCap, Phone, MapPin, BookOpen, CheckCircle, ArrowRight, ArrowLeft, Users } from "lucide-react";
import { toast } from 'react-toastify';
import Navbar from "../../components/Navbar";
import { LoadingSpinner } from "../../components/Loadingerror";
import { FormInput, FormSelect, FormTextarea, InfoCard, StepIndicator } from "../../components/FormInput";
import { useNavigate } from "react-router-dom";

const API_BASE_URL = "http://localhost:5000/api";

export default function ProfileSetup() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    currentSemester: "",
    enrollmentYear: new Date().getFullYear().toString(),
    phoneNumber: "",
    dateOfBirth: "",
    address: {
      city: "",
      state: "" // Province
    },
    bio: "",
    guardian: {
      name: "",
      relation: "",
      phone: ""
    }
  });

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 10 }, (_, i) => currentYear - i);
  const semesters = [1, 2, 3, 4, 5, 6, 7, 8];

  const handleChange = (e: any) => {
    const { name, value } = e.target;

    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...(prev[parent as keyof typeof prev] as any),
          [child]: value
        }
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async () => {
    if (!formData.currentSemester || !formData.enrollmentYear) {
      toast.error("Please fill all required fields", {
        position: "top-right",
        autoClose: 3000,
      });
      return;
    }

    setLoading(true);

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE_URL}/student/complete-profile`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      const data = await res.json();

      if (res.ok) {
        toast.success("Profile completed successfully!", {
          position: "top-right",
          autoClose: 2000,
        });

        const userStr = localStorage.getItem("user");
        if (userStr) {
          const user = JSON.parse(userStr);
          user.profileCompleted = true;
          localStorage.setItem("user", JSON.stringify(user));
        }

        setTimeout(() => {
          navigate("/student/dashboard", { replace: true });
        }, 1000);
      } else {
        toast.error(data.message || 'Failed to update profile', {
          position: "top-right",
          autoClose: 3000,
        });
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile. Please try again.', {
        position: "top-right",
        autoClose: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  const isStep1Valid = formData.currentSemester && formData.enrollmentYear;
  const isStep2Valid = formData.phoneNumber && formData.dateOfBirth;

  const semesterOptions = semesters.map(sem => ({
    value: sem,
    label: `Semester ${sem}`
  }));

  const yearOptions = years.map(year => ({
    value: year,
    label: year.toString()
  }));

  if (loading) {
    return <LoadingSpinner message="Setting up your profile..." />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4 pt-20">
        <div className="w-full max-w-3xl">
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
              <GraduationCap className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome to PadhaiHub! 🎓</h1>
            <p className="text-gray-600">Let's complete your profile to get started</p>
          </div>

          <div className="mb-8">
            <StepIndicator 
              currentStep={step} 
              totalSteps={3} 
              completedIcon={CheckCircle}
            />
          </div>

          <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
            {/* Step 1: Academic Info */}
            {step === 1 && (
              <div className="space-y-6">
                <div className="flex items-center gap-2 text-blue-600 mb-6">
                  <BookOpen className="w-6 h-6" />
                  <h2 className="text-xl font-bold">Academic Information</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormSelect
                    label="Current Semester"
                    name="currentSemester"
                    value={formData.currentSemester}
                    onChange={handleChange}
                    options={semesterOptions}
                    placeholder="Select Semester"
                    required
                  />

                  <FormSelect
                    label="Enrollment Year"
                    name="enrollmentYear"
                    value={formData.enrollmentYear}
                    onChange={handleChange}
                    options={yearOptions}
                    required
                  />
                </div>

                <InfoCard
                  type="info"
                  message="📚 Quick Tip: Select the semester you're currently enrolled in."
                />
              </div>
            )}

            {/* Step 2: Personal Info */}
            {step === 2 && (
              <div className="space-y-6">
                <div className="flex items-center gap-2 text-blue-600 mb-6">
                  <User className="w-6 h-6" />
                  <h2 className="text-xl font-bold">Personal Information</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormInput
                    label="Phone Number"
                    name="phoneNumber"
                    type="tel"
                    value={formData.phoneNumber}
                    onChange={handleChange}
                    placeholder="+977 98XXXXXXXX"
                    icon={Phone}
                    required
                  />

                  <FormInput
                    label="Date of Birth"
                    name="dateOfBirth"
                    type="date"
                    value={formData.dateOfBirth}
                    onChange={handleChange}
                    icon={Calendar}
                    required
                  />
                </div>

                <FormTextarea
                  label="Bio"
                  name="bio"
                  value={formData.bio}
                  onChange={handleChange}
                  placeholder="Tell us a little about yourself..."
                  rows={3}
                  helpText="This will appear on your profile"
                />
              </div>
            )}

            {/* Step 3: Address + Guardian */}
            {step === 3 && (
              <div className="space-y-8">
                {/* Address Section */}
                <div>
                  <div className="flex items-center gap-2 text-blue-600 mb-6">
                    <MapPin className="w-6 h-6" />
                    <h2 className="text-xl font-bold">Address Information</h2>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormInput
                      label="City"
                      name="address.city"
                      value={formData.address.city}
                      onChange={handleChange}
                      placeholder="City"
                    />
                    <FormInput
                      label="Province"
                      name="address.state"
                      value={formData.address.state}
                      onChange={handleChange}
                      placeholder="Province"
                    />
                  </div>
                </div>

                {/* Guardian Section */}
                <div>
                  <div className="flex items-center gap-2 text-blue-600 mb-6">
                    <Users className="w-6 h-6" />
                    <h2 className="text-xl font-bold">Guardian Information</h2>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <FormInput
                      label="Guardian Name"
                      name="guardian.name"
                      value={formData.guardian.name}
                      onChange={handleChange}
                      placeholder="Full name"
                      required
                    />

                    <FormInput
                      label="Relation"
                      name="guardian.relation"
                      value={formData.guardian.relation}
                      onChange={handleChange}
                      placeholder="Father, Mother, etc."
                      required
                    />

                    <FormInput
                      label="Guardian Phone"
                      name="guardian.phone"
                      value={formData.guardian.phone}
                      onChange={handleChange}
                      placeholder="+977 98XXXXXXXX"
                      required
                    />
                  </div>
                </div>

                <InfoCard
                  type="success"
                  icon={CheckCircle}
                  message="Almost done! Click 'Complete Setup' to finish your profile."
                />
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex justify-between mt-8 pt-6 border-t border-gray-200">
              {step > 1 && (
                <button
                  onClick={() => setStep(step - 1)}
                  className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium flex items-center gap-2"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Previous
                </button>
              )}

              {step < 3 ? (
                <button
                  onClick={() => setStep(step + 1)}
                  disabled={step === 1 ? !isStep1Valid : !isStep2Valid}
                  className={`ml-auto px-6 py-3 rounded-lg font-medium transition-all flex items-center gap-2 ${
                    (step === 1 ? isStep1Valid : isStep2Valid)
                      ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg'
                      : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  Next Step
                  <ArrowRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="ml-auto px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-lg"
                >
                  {loading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-5 h-5" />
                      Complete Setup
                    </>
                  )}
                </button>
              )}
            </div>
          </div>

          <p className="text-center text-sm text-gray-500 mt-6">
            Fields marked with <span className="text-red-500">*</span> are required
          </p>
        </div>
      </div>
    </div>
  );
}
