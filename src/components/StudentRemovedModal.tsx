import React from 'react';
import { UserX, LogOut } from 'lucide-react';

interface StudentRemovedModalProps {
  isOpen: boolean;
  studentName?: string;
  rollNo?: string;
  message?: string;
  onAcknowledge: () => void;
}

export const StudentRemovedModal: React.FC<StudentRemovedModalProps> = ({
  isOpen,
  studentName,
  rollNo,
  message = "You have been removed from this examination session by the host. Your access to this session has been terminated.",
  onAcknowledge
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/75 z-50 flex items-center justify-center p-4 backdrop-blur-xs animate-fade-in">
      <div 
        className="bg-white rounded-xl max-w-md w-full p-6 shadow-2xl border-2 border-red-600 transform transition-all text-center"
        role="dialog"
        aria-modal="true"
        aria-labelledby="removal-modal-title"
      >
        <div className="w-16 h-16 bg-red-100 text-red-600 rounded-xl flex items-center justify-center mx-auto mb-4 border border-red-200 shadow-xs">
          <UserX className="w-9 h-9" />
        </div>

        <h2 id="removal-modal-title" className="text-xl font-extrabold text-gray-900 mb-2">
          You Have Been Removed
        </h2>

        <p className="text-sm text-gray-700 leading-relaxed mb-6 font-medium bg-red-50 p-3.5 rounded-lg border border-red-100 text-red-900">
          {message}
        </p>

        {(studentName || rollNo) && (
          <div className="p-3 bg-gray-50 rounded-lg border border-gray-200 text-xs text-gray-600 mb-6 font-mono flex items-center justify-around">
            <div>Candidate: <strong className="text-gray-900">{studentName || 'Student'}</strong></div>
            <div>Roll No: <strong className="text-blue-900">{rollNo}</strong></div>
          </div>
        )}

        <button
          type="button"
          onClick={onAcknowledge}
          className="w-full py-3 px-5 bg-[#02529c] hover:bg-blue-800 text-white font-bold text-sm rounded-lg transition shadow-md flex items-center justify-center space-x-2 cursor-pointer"
        >
          <LogOut className="w-4 h-4" />
          <span>Return to Join Test Page</span>
        </button>
      </div>
    </div>
  );
};
