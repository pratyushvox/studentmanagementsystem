import { 
  
  CheckCircle, 
  Clock, 
  AlertCircle,

  Activity
} from 'lucide-react';


interface Activity {
  id: string;
  type: 'submission' | 'assignment' | 'grading' | 'post';
  title: string;
  description: string;
  time: string;
  status?: 'pending' | 'completed' | 'overdue';
}



export const ActivityCard: React.FC<{ activity: Activity }> = ({ activity }) => {
  const getStatusColor = () => {
    switch (activity.status) {
      case 'completed':
        return 'text-green-600';
      case 'overdue':
        return 'text-red-600';
      default:
        return 'text-yellow-600';
    }
  };

  const getStatusIcon = () => {
    switch (activity.status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'overdue':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Clock className="w-4 h-4 text-yellow-500" />;
    }
  };

  return (
    <div className="border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow bg-white">
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 mt-0.5">
          {getStatusIcon()}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <h3 className="font-semibold text-gray-800 text-sm">{activity.title}</h3>
            <span className={`text-xs font-semibold ${getStatusColor()}`}>
              {activity.status?.toUpperCase()}
            </span>
          </div>
          <p className="text-sm text-gray-600 mb-2">{activity.description}</p>
          <p className="text-xs text-gray-400">{activity.time}</p>
        </div>
      </div>
    </div>
  );
};
