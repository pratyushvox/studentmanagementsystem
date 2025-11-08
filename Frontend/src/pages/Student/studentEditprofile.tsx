import React from 'react';
import Navbar from '../../components/Navbar';
import Sidebar from '../../components/Sidebar';
import EditProfile from '../../components/Editprofile';
import { useNavigate } from 'react-router-dom';

const StudentEditProfilePage = () => {
  const navigate = useNavigate();

  const handleSave = (data) => {
    console.log('Profile updated:', data);
    // Navigate back to profile or dashboard after save
    navigate('/student/profile');
  };

  const handleCancel = () => {
    // Navigate back to previous page
    navigate(-1);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <Sidebar userRole="student" activeItem="editprofile" />
      
      <div className="ml-64 mt-16 p-6">
        <EditProfile 
          userRole="student"
          onSave={handleSave}
          onCancel={handleCancel}
        />
      </div>
    </div>
  );
};

export default StudentEditProfilePage;