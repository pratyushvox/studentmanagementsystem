import { useState } from "react";
import { Upload, X, CheckCircle } from "lucide-react";

export default function SubmitAssignmentModal({ assignment, isOpen, onClose, onSubmit }) {
  const [selectedFile, setSelectedFile] = useState(null);

  if (!isOpen || !assignment) return null;

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleSubmit = () => {
    if (selectedFile) {
      onSubmit(assignment, selectedFile);
      setSelectedFile(null);
      onClose();
    }
  };

  const handleClose = () => {
    setSelectedFile(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Submit Assignment</h3>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mb-4">
          <p className="text-sm font-medium text-gray-900">{assignment.title}</p>
          <p className="text-xs text-gray-600 mt-1">{assignment.course}</p>
        </div>

        <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center mb-4 hover:border-teal-400 transition-colors">
          <input
            type="file"
            id="file-upload"
            className="hidden"
            onChange={handleFileSelect}
            accept=".pdf,.doc,.docx,.txt"
          />
          <label
            htmlFor="file-upload"
            className="cursor-pointer flex flex-col items-center"
          >
            <Upload className="w-10 h-10 text-gray-400 mb-3" />
            <span className="text-sm text-gray-700 font-medium">
              {selectedFile ? selectedFile.name : "Click to upload or drag and drop"}
            </span>
            <span className="text-xs text-gray-500 mt-2">PDF, DOC, DOCX, TXT (max 10MB)</span>
          </label>
        </div>

        {selectedFile && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
            <span className="text-sm text-green-700 truncate">File selected: {selectedFile.name}</span>
          </div>
        )}

        <div className="flex gap-3">
          <button
            onClick={handleClose}
            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!selectedFile}
            className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              selectedFile
                ? "bg-teal-600 text-white hover:bg-teal-700"
                : "bg-gray-300 text-gray-500 cursor-not-allowed"
            }`}
          >
            Submit Assignment
          </button>
        </div>
      </div>
    </div>
  );
}