import React from 'react';
import { AlertTriangle, StopCircle, ArrowLeft, Loader2 } from 'lucide-react';
import type { ExamStatus } from '../types.ts';

interface HostExitConfirmModalProps {
  isOpen: boolean;
  sessionId: string;
  sessionStatus?: ExamStatus | string;
  isClosing: boolean;
  errorMessage?: string;
  onCancel: () => void;
  onConfirmClose: () => void;
}

export const HostExitConfirmModal: React.FC<HostExitConfirmModalProps> = ({
  isOpen,
  sessionId,
  sessionStatus = 'waiting',
  isClosing,
  errorMessage,
  onCancel,
  onConfirmClose
}) => {
  if (!isOpen) return null;

  const isLive = sessionStatus === 'live' || sessionStatus === 'starting';
  const isPaused = sessionStatus === 'paused';

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs animate-fade-in">
      <div 
        className="bg-white rounded-xl max-w-lg w-full p-6 shadow-2xl border-2 border-amber-400 transform transition-all"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        {/* Header with Warning Icon */}
        <div className="flex items-start space-x-3 mb-4">
          <div className={`p-2.5 rounded-full shrink-0 ${isLive ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-600'}`}>
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <h2 id="modal-title" className="text-lg font-extrabold text-gray-900 leading-tight">
              Leave Examination Session?
            </h2>
            <p className="text-xs text-gray-500 font-mono mt-0.5">
              Active Session: <strong className="text-blue-900">{sessionId}</strong> • Status: <strong className="capitalize text-gray-800">{sessionStatus}</strong>
            </p>
          </div>
        </div>

        {/* Dynamic Warning Body based on Session State */}
        <div className="space-y-3 mb-6 text-xs md:text-sm text-gray-700 leading-relaxed">
          <p className="font-semibold text-gray-900">
            You have an active server or examination session. If you leave this page, the session may be closed and the examination may be terminated. Do you want to close the session and continue?
          </p>

          {isLive && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-800 text-xs flex items-start space-x-2">
              <StopCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <span>
                <strong>Live Examination in Progress:</strong> Leaving now will end the test immediately for all connected candidates. Their saved answers will be automatically submitted and locked.
              </span>
            </div>
          )}

          {isPaused && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 text-xs">
              <strong>Examination is Paused:</strong> Leaving now will permanently terminate the session and finalize all candidate scores.
            </div>
          )}

          {!isLive && !isPaused && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-blue-900 text-xs">
              <strong>Server Created:</strong> Leaving will close this session ({sessionId}), preventing new students from registering or starting this test.
            </div>
          )}

          {errorMessage && (
            <div className="p-3 bg-red-100 border border-red-300 rounded-lg text-red-900 text-xs font-semibold">
              ⚠️ {errorMessage}
            </div>
          )}
        </div>

        {/* Action Buttons: Clear distinction between safe 'Stay' and dangerous 'Close & Leave' */}
        <div className="flex flex-col-reverse sm:flex-row items-center justify-end gap-2.5 pt-4 border-t border-gray-200">
          <button
            type="button"
            disabled={isClosing}
            onClick={onCancel}
            className="w-full sm:w-auto px-5 py-2.5 bg-[#02529c] hover:bg-blue-800 text-white font-bold text-xs md:text-sm rounded-lg transition shadow-xs flex items-center justify-center space-x-1.5 cursor-pointer disabled:opacity-50"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>No — Stay on Page</span>
          </button>

          <button
            type="button"
            disabled={isClosing}
            onClick={onConfirmClose}
            className="w-full sm:w-auto px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold text-xs md:text-sm rounded-lg transition shadow-xs flex items-center justify-center space-x-1.5 cursor-pointer disabled:opacity-50"
          >
            {isClosing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Closing Session...</span>
              </>
            ) : (
              <>
                <StopCircle className="w-4 h-4" />
                <span>Yes — Close Session & Leave</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
