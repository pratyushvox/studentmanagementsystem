import {
  Users,
  Calendar,
  BarChart3,
  MessageSquare,
  FileText,
  Shield,
  Bell,
  CreditCard
} from 'lucide-react';

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  color: string;
}

const FeatureCard: React.FC<FeatureCardProps> = ({ icon, title, description, color }) => {
  return (
    <div className="group p-6 rounded-xl border border-gray-200 hover:border-[#03bcaa] hover:shadow-xl transition-all duration-300 bg-white">
      <div className={`w-12 h-12 rounded-lg ${color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}
      >
        {icon}
      </div>
      <h3 className="text-xl font-semibold text-gray-900 mb-3">{title}</h3>
      <p className="text-gray-600 leading-relaxed">{description}</p>
    </div>
  );
};

export default function Features() {
  return (
    <section id="features" className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-18 mt-10">
          <span className="text-blue-600 font-semibold text-sm uppercase tracking-wide">
            Features
          </span>
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mt-4 mb-6">
            Everything You Need in One Place
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Powerful tools designed to simplify administration, enhance learning,
            and keep everyone connected.
          </p>
        </div>

        
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          <FeatureCard
            icon={<Users className="w-6 h-6" />}
            title="Student Profiles"
            description="Comprehensive student records with demographics, enrollment history, and academic progress tracking."
            color="bg-blue-100 text-blue-600"
          />
          <FeatureCard
            icon={<Calendar className="w-6 h-6" />}
            title="Attendance Tracking"
            description="Real-time attendance monitoring with automated reports and parent notifications."
            color="bg-cyan-100 text-cyan-600"
          />
          <FeatureCard
            icon={<BarChart3 className="w-6 h-6" />}
            title="Grade Management"
            description="Streamlined grading system with analytics, report cards, and performance insights."
            color="bg-green-100 text-green-600"
          />
          <FeatureCard
            icon={<MessageSquare className="w-6 h-6" />}
            title="Communication Hub"
            description="Unified platform for teacher-parent-student communication with messaging and announcements."
            color="bg-purple-100 text-purple-600"
          />
          <FeatureCard
            icon={<FileText className="w-6 h-6" />}
            title="Assignment Portal"
            description="Digital assignment submission, feedback, and tracking for seamless workflow."
            color="bg-orange-100 text-orange-600"
          />
          <FeatureCard
            icon={<Shield className="w-6 h-6" />}
            title="Secure & Compliant"
            description="Enterprise-grade security with role-based access and FERPA compliance."
            color="bg-red-100 text-red-600"
          />
          <FeatureCard
            icon={<Bell className="w-6 h-6" />}
            title="Smart Notifications"
            description="Automated alerts for attendance, grades, deadlines, and important updates."
            color="bg-yellow-100 text-yellow-600"
          />
          <FeatureCard
            icon={<CreditCard className="w-6 h-6" />}
            title="Fee Management"
            description="Integrated billing, payment tracking, and financial reporting for tuition and fees."
            color="bg-teal-100 text-teal-600"
          />
        </div>
      </div>
    </section>
  );
}
