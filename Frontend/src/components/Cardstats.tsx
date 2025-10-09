
import React from 'react';

interface SubjectsCardProps {
  count: number;
  title?: string;
  subtitle?: string;
  period?: string;
  variant?: 'default' | 'primary' | 'secondary';
  className?: string;
  onClick?: () => void;
}

const SubjectsCard: React.FC<SubjectsCardProps> = ({
  count,
  title = "Total Subjects",
  subtitle = "This semester",
  period,
  variant = 'default',
  className = '',
  onClick
}) => {
  const variantStyles = {
    default: 'bg-white border border-gray-200',
    primary: 'bg-blue-50 border border-blue-200',
    secondary: 'bg-gray-50 border border-gray-200'
  };

  const countColors = {
    default: 'text-gray-900',
    primary: 'text-blue-600',
    secondary: 'text-gray-700'
  };

  return (
    <div 
      className={`
        rounded-xl shadow-sm hover:shadow-md transition-all duration-300 
        p-6 cursor-pointer transform hover:-translate-y-1
        ${variantStyles[variant]} ${className}
      `}
      onClick={onClick}
    >
      {/* Count Display */}
      <div className={`text-5xl font-bold mb-2 ${countColors[variant]}`}>
        {count}
      </div>
      
      {/* Title */}
      <div className="text-lg font-semibold text-gray-800 mb-1">
        {title}
      </div>
      
      {/* Subtitle and Period */}
      <div className="flex justify-between items-center">
        <span className="text-sm text-gray-600">
          {subtitle}
        </span>
        {period && (
          <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
            {period}
          </span>
        )}
      </div>
    </div>
  );
};

export default SubjectsCard;