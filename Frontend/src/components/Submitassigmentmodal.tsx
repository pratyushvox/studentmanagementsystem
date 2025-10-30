import { useState } from "react";
import { Upload, X, CheckCircle, RefreshCw, AlertCircle } from "lucide-react";

interface SubmitAssignmentModalProps {
  assignment: any;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (assignment: any, file: File) => void;
  isSubmitting?: boolean;
  isResubmit?: boolean;
}

export default function SubmitAssignmentModal({ 
  assignment, 
  isOpen, 
  onClose, 
  onSubmit,
  isSubmitting = false,
  isResubmit = false
}: SubmitAssignmentModalProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);

  if (!isOpen || !assignment) return null;

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file size (10MB)
      if (file.size > 10 * 1024 * 1024) {
        alert("File size must be less than 10MB");
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const file = e.dataTransfer.files?.[0];
    if (file) {
      // Validate file size
      if (file.size > 10 * 1024 * 1024) {
        alert("File size must be less than 10MB");
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleSubmit = () => {
    if (selectedFile && !isSubmitting) {
      onSubmit(assignment, selectedFile);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setSelectedFile(null);
      onClose();
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            {isResubmit ? (
              <>
                <RefreshCw className="w-5 h-5 text-blue-600" />
                <h3 className="text-lg font-semibold text-gray-900">Resubmit Assignment</h3>
              </>
            ) : (
              <>
                <Upload className="w-5 h-5 text-teal-600" />
                <h3 className="text-lg font-semibold text-gray-900">Submit Assignment</h3>
              </>
            )}
          </div>
          <button
            onClick={handleClose}
            disabled={isSubmitting}
            className="text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {isResubmit && (
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-800">
              <p className="font-medium">Resubmission Notice</p>
              <p className="text-xs mt-1">This will replace your previous submission. Your grades and feedback will be reset.</p>
            </div>
          </div>
        )}

        <div className="mb-4">
          <p className="text-sm font-medium text-gray-900">{assignment.title}</p>
          <p className="text-xs text-gray-600 mt-1">
            {assignment.subject} • Due: {new Date(assignment.deadline).toLocaleDateString()}
          </p>
        </div>

        <div 
          className={`border-2 border-dashed rounded-lg p-8 text-center mb-4 transition-all ${
            dragActive 
              ? 'border-teal-500 bg-teal-50' 
              : selectedFile
              ? 'border-green-300 bg-green-50'
              : 'border-gray-300 hover:border-teal-400 hover:bg-gray-50'
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <input
            type="file"
            id="file-upload"
            className="hidden"
            onChange={handleFileSelect}
            accept=".pdf,.doc,.docx,.txt,.ppt,.pptx,.zip"
            disabled={isSubmitting}
          />
          <label
            htmlFor="file-upload"
            className={`cursor-pointer flex flex-col items-center ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {selectedFile ? (
              <CheckCircle className="w-10 h-10 text-green-600 mb-3" />
            ) : (
              <Upload className="w-10 h-10 text-gray-400 mb-3" />
            )}
            <span className="text-sm text-gray-700 font-medium">
              {selectedFile ? selectedFile.name : dragActive ? "Drop file here" : "Click to upload or drag and drop"}
            </span>
            {selectedFile && (
              <span className="text-xs text-gray-500 mt-1">
                {formatFileSize(selectedFile.size)}
              </span>
            )}
            {!selectedFile && (
              <span className="text-xs text-gray-500 mt-2">
                PDF, DOC, DOCX, PPT, PPTX, TXT, ZIP (max 10MB)
              </span>
            )}
          </label>
        </div>

        {selectedFile && !isSubmitting && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center justify-between">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-green-700 font-medium truncate">{selectedFile.name}</p>
                <p className="text-xs text-green-600">{formatFileSize(selectedFile.size)}</p>
              </div>
            </div>
            <button
              onClick={() => setSelectedFile(null)}
              className="text-green-600 hover:text-green-700 ml-2"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        <div className="flex gap-3">
          <button
            onClick={handleClose}
            disabled={isSubmitting}
            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!selectedFile || isSubmitting}
            className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
              selectedFile && !isSubmitting
                ? isResubmit
                  ? "bg-blue-600 text-white hover:bg-blue-700"
                  : "bg-teal-600 text-white hover:bg-teal-700"
                : "bg-gray-300 text-gray-500 cursor-not-allowed"
            }`}
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>{isResubmit ? 'Resubmitting...' : 'Submitting...'}</span>
              </>
            ) : (
              <>
                {isResubmit ? <RefreshCw className="w-4 h-4" /> : <Upload className="w-4 h-4" />}
                <span>{isResubmit ? 'Resubmit' : 'Submit'} Assignment</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}