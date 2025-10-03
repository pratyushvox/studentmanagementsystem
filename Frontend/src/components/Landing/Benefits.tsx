import { CheckCircle, Clock, DollarSign, Zap } from 'lucide-react';

interface BenefitCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  stats: string;
}

function BenefitCard({ icon, title, description, stats }: BenefitCardProps) {
  return (
    <div className="relative group">
      <div className="absolute inset-0 bg-gradient-to-br from-orange-400 to-teal-600 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-xl"></div>
      <div className="relative bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300">
        <div className="w-16 h-16 bg-orange-100 text-orange-600 rounded-xl flex items-center justify-center mb-6">
          {icon}
        </div>
        <h3 className="text-2xl font-bold text-gray-900 mb-3">
          {title}
        </h3>
        <p className="text-gray-600 mb-4 leading-relaxed">
          {description}
        </p>
        <div className="text-teal-700 font-bold text-lg">
          {stats}
        </div>
      </div>
    </div>
  );
}

export default function Benefits() {
  return (
    <section id="benefits" className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-orange-50 to-teal-50">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <span className="text-teal-700 font-semibold text-sm uppercase tracking-wide">
            Benefits
          </span>
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mt-4 mb-6">
            Transform Your Institution
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Join hundreds of schools and universities already experiencing
            the power of modern student management.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          <BenefitCard
            icon={<Clock className="w-8 h-8" />}
            title="Save Time"
            description="Automate repetitive tasks and reduce administrative workload by up to 60%."
            stats="60% faster"
          />
          <BenefitCard
            icon={<DollarSign className="w-8 h-8" />}
            title="Cut Costs"
            description="Eliminate paper-based processes and reduce operational expenses significantly."
            stats="40% savings"
          />
          <BenefitCard
            icon={<Zap className="w-8 h-8" />}
            title="Boost Efficiency"
            description="Streamlined workflows and real-time data access improve productivity across the board."
            stats="3x productivity"
          />
          <BenefitCard
            icon={<CheckCircle className="w-8 h-8" />}
            title="Improve Outcomes"
            description="Data-driven insights help educators identify and support struggling students early."
            stats="25% improvement"
          />
        </div>

       
      </div>
    </section>
  );
}