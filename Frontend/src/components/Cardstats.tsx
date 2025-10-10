import React from 'react';
import type { LucideIcon } from 'lucide-react';

interface StatsCardProps {
  title?: string;
  count?: number;
  subtitle?: string;
  icon?: LucideIcon;
  iconColor?: string;
  iconBg?: string;
}

const StatsCard: React.FC<StatsCardProps> = ({ 
  title = "Pending Tasks", 
  count = 0, 
  subtitle = "total assignments",
  icon: Icon,
  iconColor = "text-orange-500",
  iconBg = "bg-orange-50"
}) => {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <h3 className="text-gray-600 text-sm font-medium">{title}</h3>
        {Icon && (
          <div className={`${iconBg} p-2 rounded-lg`}>
            <Icon className={`w-5 h-5 ${iconColor}`} />
          </div>
        )}
      </div>
      <div className="space-y-1">
        <p className="text-4xl font-bold text-gray-900">{count}</p>
        <p className="text-sm text-gray-500">
          {count} {subtitle}
        </p>
      </div>
    </div>
  );
};

export default StatsCard;