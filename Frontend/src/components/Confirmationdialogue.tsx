import { AlertTriangle, X } from "lucide-react";

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: "danger" | "warning" | "info";
  icon?: React.ReactNode;
}

export default function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  type = "danger",
  icon
}: ConfirmDialogProps) {
  if (!isOpen) return null;

  const colors = {
    danger: {
      bg: "bg-red-100",
      text: "text-red-600",
      button: "bg-red-600 hover:bg-red-700"
    },
    warning: {
      bg: "bg-orange-100",
      text: "text-orange-600",
      button: "bg-orange-600 hover:bg-orange-700"
    },
    info: {
      bg: "bg-blue-100",
      text: "text-blue-600",
      button: "bg-blue-600 hover:bg-blue-700"
    }
  };

  const colorScheme = colors[type];

  return (
    <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full animate-in fade-in zoom-in duration-200">
        <div className="p-6">
          <div className={`w-12 h-12 ${colorScheme.bg} rounded-full flex items-center justify-center mx-auto mb-4`}>
            {icon || <AlertTriangle className={`w-6 h-6 ${colorScheme.text}`} />}
          </div>
          <h2 className="text-xl font-semibold text-gray-900 text-center mb-2">
            {title}
          </h2>
          <p className="text-gray-600 text-center mb-6" dangerouslySetInnerHTML={{ __html: message }} />
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              {cancelText}
            </button>
            <button
              onClick={() => {
                onConfirm();
                onClose();
              }}
              className={`flex-1 px-4 py-2 text-white rounded-lg transition-colors ${colorScheme.button}`}
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}