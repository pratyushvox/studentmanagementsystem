import React from "react";
import { Users } from "lucide-react";

interface Subject {
  subjectId: {
    _id: string;
    name: string;
    code: string;
  };
  groups: Array<{
    _id: string;
    name: string;
    semester: number;
  }>;
}

const SubjectCardSimple: React.FC<{ subject: Subject }> = ({ subject }) => {
  return (
    <div className="group relative bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-100 hover:border-indigo-200 rounded-lg p-5 transition-all hover:shadow-md">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h3 className="text-lg font-bold text-gray-900 mb-1">{subject.subjectId.name}</h3>
          <p className="text-indigo-600 text-sm font-semibold">{subject.subjectId.code}</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 bg-white rounded-full shadow-sm border border-indigo-100">
          <Users className="w-4 h-4 text-indigo-600" />
          <span className="text-sm font-semibold text-gray-700">
            {subject.groups.length} Group{subject.groups.length > 1 ? 's' : ''}
          </span>
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        {subject.groups.map((group) => (
          <span
            key={group._id}
            className="inline-flex items-center gap-2 px-3 py-1.5 bg-white border border-indigo-100 rounded-lg text-sm text-gray-700 shadow-sm"
          >
            <div className="w-2 h-2 bg-indigo-500 rounded-full"></div>
            {group.name}
            <span className="text-gray-400">•</span>
            <span className="text-indigo-600">Semester {group.semester}</span>
          </span>
        ))}
      </div>
    </div>
  );
};

export default SubjectCardSimple;