import { AlertCircle } from "lucide-react";

// Loading Component
export const LoadingSpinner = ({ message = "Loading..." }) => {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">{message}</p>
      </div>
    </div>
  );
};


export const ErrorDisplay = ({ 
  error, 
  onRetry, 
  title = "Error Loading Data",
  showRetry = true 
}) => {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white border border-red-200 rounded-lg p-6 max-w-md w-full">
        <div className="flex items-center gap-3 text-red-600 mb-4">
          <AlertCircle className="w-6 h-6" />
          <h2 className="text-lg font-semibold">{title}</h2>
        </div>
        <p className="text-gray-600 mb-4">{error}</p>
        {showRetry && onRetry && (
          <button
            onClick={onRetry}
            className="w-full bg-teal-600 text-white py-2 px-4 rounded-lg hover:bg-teal-700 transition-colors"
          >
            Retry
          </button>
        )}
      </div>
    </div>
  );
};

// Mini Loading Spinner (for inline use)
export const MiniLoader = ({ size = "small", color = "teal" }) => {
  const sizeClasses = {
    small: "h-4 w-4 border",
    medium: "h-8 w-8 border-2",
    large: "h-12 w-12 border-2"
  };

  const colorClasses = {
    teal: "border-teal-600",
    blue: "border-blue-600",
    gray: "border-gray-600",
    green: "border-green-600"
  };

  return (
    <div
      className={`animate-spin rounded-full ${sizeClasses[size]} ${colorClasses[color]} border-t-transparent`}
    ></div>
  );
};

// Empty State Component
export const EmptyState = ({ 
  icon: Icon, 
  message = "No data available",
  description 
}) => {
  return (
    <div className="text-center py-8 text-gray-500">
      {Icon && <Icon className="w-12 h-12 mx-auto mb-3 text-gray-300" />}
      <p className="font-medium">{message}</p>
      {description && <p className="text-sm text-gray-400 mt-1">{description}</p>}
    </div>
  );
};

// Card Loading Skeleton
export const CardSkeleton = ({ count = 1 }) => {
  return (
    <>
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="bg-white border border-gray-200 rounded-lg p-5 animate-pulse">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="h-4 bg-gray-200 rounded w-24 mb-3"></div>
              <div className="h-8 bg-gray-200 rounded w-16 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-32"></div>
            </div>
            <div className="w-10 h-10 bg-gray-200 rounded-lg"></div>
          </div>
        </div>
      ))}
    </>
  );
};

// Table Loading Skeleton
export const TableSkeleton = ({ rows = 5, columns = 4 }) => {
  return (
    <div className="animate-pulse">
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={rowIndex} className="flex gap-4 py-4 border-b border-gray-100">
          {Array.from({ length: columns }).map((_, colIndex) => (
            <div key={colIndex} className="flex-1">
              <div className="h-4 bg-gray-200 rounded"></div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
};