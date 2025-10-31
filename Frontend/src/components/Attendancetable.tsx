// components/AttendanceTable.tsx
import React from 'react';
import { CheckCircle, XCircle, Clock, Download } from 'lucide-react';
import { LoadingSpinner } from './Loadingerror';
import { formatDate } from '../utils/dateHelpers';

interface Student {
  _id: string;
  studentId: string;
  fullName: string;
  email: string;
  currentSemester: number;
  enrollmentYear: number;
  status: string;
  phoneNumber?: string;
  dateOfBirth?: string;
}

interface AttendanceRecord {
  studentId: string;
  status: 'present' | 'absent' | 'late' | 'excused';
  remarks?: string;
}

interface AttendanceTableProps {
  students: Student[];
  attendanceRecords: Record<string, AttendanceRecord>;
  onStatusChange: (studentId: string, status: AttendanceRecord['status']) => void;
  onRemarksChange: (studentId: string, remarks: string) => void;
  loading?: boolean;
  groupName?: string;
  subjectName?: string;
  selectedDate?: string;
  showExport?: boolean;
  readOnly?: boolean; // For student view
}

const AttendanceTable: React.FC<AttendanceTableProps> = ({
  students,
  attendanceRecords,
  onStatusChange,
  onRemarksChange,
  loading = false,
  groupName = '',
  subjectName = '',
  selectedDate = '',
  showExport = true,
  readOnly = false
}) => {
  const getStatusColor = (status: string) => {
    const colors = {
      present: 'bg-green-100 text-green-800 border-green-200',
      absent: 'bg-red-100 text-red-800 border-red-200',
      late: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      excused: 'bg-blue-100 text-blue-800 border-blue-200'
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const getStatusIcon = (status: string) => {
    const icons = {
      present: CheckCircle,
      absent: XCircle,
      late: Clock,
      excused: CheckCircle
    };
    return icons[status as keyof typeof icons] || CheckCircle;
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <LoadingSpinner message="Loading students..." />
      </div>
    );
  }

  if (students.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No students found in this group
      </div>
    );
  }

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      {/* Header */}
      {(groupName || subjectName || selectedDate) && (
        <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              {groupName && subjectName && (
                <h3 className="font-semibold text-gray-800">
                  {groupName} - {subjectName}
                </h3>
              )}
              {selectedDate && (
                <p className="text-sm text-gray-600">
                  {students.length} students • {formatDate(selectedDate)}
                </p>
              )}
            </div>
            {showExport && (
              <div className="flex gap-2">
                <button className="px-3 py-1.5 text-sm bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all flex items-center gap-2">
                  <Download size={16} />
                  Export
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Student
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Student ID
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Remarks
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {students.map((student) => {
              const record = attendanceRecords[student._id];
              const StatusIcon = getStatusIcon(record?.status || 'present');
              
              return (
                <tr key={student._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {student.fullName}
                    </div>
                    {student.email && (
                      <div className="text-xs text-gray-500">{student.email}</div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-600">
                      {student.studentId}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {readOnly ? (
                      <span
                        className={`px-3 py-1.5 text-sm font-medium rounded-full border ${getStatusColor(record?.status || 'present')} flex items-center gap-2 w-fit`}
                      >
                        <StatusIcon size={14} />
                        {record?.status || 'present'}
                      </span>
                    ) : (
                      <select
                        value={record?.status || 'present'}
                        onChange={(e) => onStatusChange(student._id, e.target.value as any)}
                        className={`px-3 py-1.5 text-sm font-medium rounded-full border ${getStatusColor(record?.status || 'present')} focus:outline-none focus:ring-2 focus:ring-blue-500`}
                      >
                        <option value="present">Present</option>
                        <option value="absent">Absent</option>
                        <option value="late">Late</option>
                        <option value="excused">Excused</option>
                      </select>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {readOnly ? (
                      <div className="text-sm text-gray-600">
                        {record?.remarks || 'No remarks'}
                      </div>
                    ) : (
                      <input
                        type="text"
                        value={record?.remarks || ''}
                        onChange={(e) => onRemarksChange(student._id, e.target.value)}
                        placeholder="Add remarks..."
                        className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                      />
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AttendanceTable;