import React, { useState, useEffect } from 'react';
import { SessionPublicInfo } from '../types.ts';
import { Search, AlertCircle, ArrowRight, ShieldCheck, CheckCircle } from 'lucide-react';

interface JoinTestLookupProps {
  initialSessionId?: string;
  onSessionLoaded: (session: SessionPublicInfo, rollNo?: string, name?: string) => void;
}

export const JoinTestLookup: React.FC<JoinTestLookupProps> = ({
  initialSessionId = '',
  onSessionLoaded
}) => {
  const [sessionId, setSessionId] = useState(initialSessionId);
  const [studentName, setStudentName] = useState('');
  const [rollNo, setRollNo] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // If initialSessionId is provided via URL parameter, check it automatically
  useEffect(() => {
    if (initialSessionId) {
      setSessionId(initialSessionId);
    }
  }, [initialSessionId]);

  const handleLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanId = sessionId.trim().toUpperCase();
    if (!cleanId) {
      setErrorMsg('Please enter a valid Session ID');
      return;
    }

    setErrorMsg('');
    setLoading(true);

    try {
      const res = await fetch(`/api/sessions/${cleanId}`);
      const data = await res.json();

      if (!res.ok) {
        setErrorMsg(data.error || 'Session ID not found. Please check with your examiner.');
        setLoading(false);
        return;
      }

      onSessionLoaded(data, rollNo.trim().toUpperCase(), studentName.trim());
    } catch {
      setErrorMsg('Network error. Unable to connect to examination server.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f4f6f9] py-10 px-4 flex flex-col items-center justify-center font-sans">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden">
        {/* Blue Header Banner */}
        <div className="bg-[#02529c] text-white py-5 px-6 text-center">
          <h1 className="text-lg md:text-xl font-bold tracking-wide">
            ACCESS COMPUTER EDUCATION CENTER
          </h1>
          <p className="text-xs text-blue-100 uppercase tracking-wider mt-1">
            Online Computer Based Test (CBT) Portal
          </p>
        </div>

        <div className="p-6 md:p-8">
          <div className="text-center mb-6">
            <h2 className="text-base font-bold text-gray-800">Join Examination Session</h2>
            <p className="text-xs text-gray-600 mt-1">
              Enter the Session ID provided by your examiner to begin.
            </p>
          </div>

          {errorMsg && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-xs flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleLookup} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-800 mb-1.5">
                Session ID
              </label>
              <input
                type="text"
                required
                placeholder="e.g. ACE-2026"
                value={sessionId}
                onChange={(e) => setSessionId(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white border border-gray-300 rounded text-sm text-gray-900 font-mono font-bold uppercase focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
              <p className="text-[11px] text-gray-500 mt-1">
                Default ready session: <span className="font-mono font-bold text-blue-800 cursor-pointer" onClick={() => setSessionId('ACE-2026')}>ACE-2026</span>
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-800 mb-1.5">
                Candidate Name (Optional now, can enter on next screen)
              </label>
              <input
                type="text"
                placeholder="अपना नाम लिखें"
                value={studentName}
                onChange={(e) => setStudentName(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white border border-gray-300 rounded text-sm text-gray-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-800 mb-1.5">
                Roll Number (Optional now)
              </label>
              <input
                type="text"
                placeholder="Roll Number"
                value={rollNo}
                onChange={(e) => setRollNo(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white border border-gray-300 rounded text-sm text-gray-900 font-mono focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#198754] hover:bg-[#157347] text-white font-bold py-2.5 px-4 rounded text-sm transition shadow-sm flex items-center justify-center space-x-1.5 tracking-wide disabled:opacity-50"
              >
                <span>{loading ? 'Verifying Session...' : 'Continue to Instructions'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </form>

          {/* Quick Help Card */}
          <div className="mt-6 pt-4 border-t border-gray-200 text-[11px] text-gray-500 space-y-1">
            <div className="font-semibold text-gray-700">Instructions:</div>
            <p>1. Keep your Roll Number and Candidate Name ready.</p>
            <p>2. Do not switch tabs or minimize the window during examination.</p>
            <p>3. Answers are saved automatically on every click.</p>
          </div>
        </div>
      </div>
    </div>
  );
};
