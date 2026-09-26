import React, { useState, useEffect } from 'react';
import type { SessionPublicInfo, BroadcastNotice } from '../types.ts';
import { Users, Clock, AlertCircle, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { StudentRemovedModal } from './StudentRemovedModal.tsx';
import { Logo } from './Logo.tsx';

interface StudentInstructionsProps {
  session: SessionPublicInfo;
  defaultRollNo?: string;
  defaultName?: string;
  onStartExam: (candidateName: string, rollNo: string) => void;
  onExitToJoin?: () => void;
}

export const StudentInstructions: React.FC<StudentInstructionsProps> = ({
  session,
  defaultRollNo = '',
  defaultName = '',
  onStartExam,
  onExitToJoin
}) => {
  const [candidateName, setCandidateName] = useState(defaultName);
  const [rollNo, setRollNo] = useState(defaultRollNo);
  const [isJoined, setIsJoined] = useState(false);
  const [sessionStatus, setSessionStatus] = useState(session.status);
  const [startingCountdown, setStartingCountdown] = useState(session.startingCountdown || 30);
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmittingJoin, setIsSubmittingJoin] = useState(false);
  const [isRemovedByHost, setIsRemovedByHost] = useState(false);
  const [removalMessage, setRemovalMessage] = useState('');

  // SSE subscription to listen for host actions & removal
  useEffect(() => {
    const sse = new EventSource(`/api/sessions/${session.id}/stream?rollNo=${encodeURIComponent(rollNo)}`);

    sse.addEventListener('session_update', (e) => {
      const data = JSON.parse(e.data);
      if (data.status) setSessionStatus(data.status);
      if (data.startingCountdown !== undefined) setStartingCountdown(data.startingCountdown);
    });

    sse.addEventListener('countdown_tick', (e) => {
      const data = JSON.parse(e.data);
      setStartingCountdown(data.startingCountdown);
      setSessionStatus('starting');
    });

    sse.addEventListener('exam_started', () => {
      setSessionStatus('live');
      if (isJoined && candidateName && rollNo && !isRemovedByHost) {
        onStartExam(candidateName, rollNo);
      }
    });

    sse.addEventListener('candidate_removed', (e) => {
      const data = JSON.parse(e.data);
      if (rollNo && data.rollNo && data.rollNo.trim().toUpperCase() === rollNo.trim().toUpperCase()) {
        setIsRemovedByHost(true);
        setRemovalMessage(data.message || 'You have been removed from this examination session by the host. Your access to this session has been terminated.');
      }
    });

    return () => {
      sse.close();
    };
  }, [session.id, isJoined, candidateName, rollNo, onStartExam, isRemovedByHost]);

  // If already live and candidate joins, enter immediately
  useEffect(() => {
    if (isJoined && sessionStatus === 'live') {
      onStartExam(candidateName, rollNo);
    }
  }, [isJoined, sessionStatus, candidateName, rollNo, onStartExam]);

  const handleJoinClick = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!candidateName.trim()) {
      setErrorMsg('कृपया अपना नाम दर्ज करें (Please enter candidate name)');
      return;
    }
    if (!rollNo.trim()) {
      setErrorMsg('कृपया रोल नंबर दर्ज करें (Please enter roll number)');
      return;
    }
    setErrorMsg('');
    setIsSubmittingJoin(true);

    try {
      const res = await fetch(`/api/sessions/${session.id}/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: candidateName.trim(),
          rollNo: rollNo.trim().toUpperCase()
        })
      });

      const data = await res.json();
      if (!res.ok) {
        if (data.isRemoved || res.status === 403) {
          setIsRemovedByHost(true);
          setRemovalMessage(data.error || 'You have been removed from this examination session by the host. Your access to this session has been terminated.');
        } else {
          setErrorMsg(data.error || 'Failed to join test session');
        }
        setIsSubmittingJoin(false);
        return;
      }

      setIsJoined(true);
      setIsSubmittingJoin(false);

      // If exam is already live, go straight in
      if (data.session.status === 'live') {
        onStartExam(candidateName.trim(), rollNo.trim().toUpperCase());
      }
    } catch (err: any) {
      setErrorMsg('Network error. Unable to connect to examination server.');
      setIsSubmittingJoin(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f4f6f9] py-8 px-4 flex items-center justify-center">
      {/* Container card matching Screenshot 3 exact structure */}
      <div className="max-w-2xl w-full bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden">
        
        {/* Blue Header Banner matching Screenshot 3 */}
        <div className="bg-[#02529c] text-white py-5 px-6 text-center flex flex-col items-center">
          <Logo size="md" className="mb-2" />
          <h1 className="text-xl md:text-2xl font-bold tracking-wide">
            {session.testName || 'Access Computer Education Center: Online Practice Test'}
          </h1>
          <p className="text-xs md:text-sm text-blue-100 mt-1 font-medium tracking-wider">
            Computer Based Test (CBT)
          </p>
        </div>

        <div className="p-6 md:p-8">
          {/* General Instructions Section matching Screenshot 3 */}
          <div className="mb-6">
            <h2 className="text-base md:text-lg font-bold text-[#02529c] mb-3">
              General Instructions
            </h2>

            <ol className="list-decimal list-inside space-y-2 text-xs md:text-sm text-gray-800 leading-relaxed font-sans">
              <li>इस परीक्षा में कुल {session.totalQuestions || 25} प्रश्न हैं।</li>
              <li>प्रत्येक प्रश्न {session.marksPerQuestion || 1} अंक का है।</li>
              <li>कुल परीक्षा समय {session.durationMinutes || 60} मिनट है।</li>
              <li>प्रत्येक प्रश्न में केवल एक सही उत्तर है।</li>
              <li>उत्तर चुनने के बाद <strong className="font-semibold text-gray-900">Save & Next</strong> दबाएँ।</li>
              <li><strong className="font-semibold text-gray-900">Mark for Review</strong> से प्रश्न को बाद में देखने के लिए mark कर सकते हैं।</li>
              <li>Question Palette से किसी भी प्रश्न पर सीधे जा सकते हैं।</li>
              <li>समय समाप्त होने पर परीक्षा automatically submit हो जाएगी।</li>
              <li>Submit करने के बाद result Admin द्वारा publish किया जाएगा।</li>
            </ol>
          </div>

          {/* If Candidate has already submitted details and is waiting for Host */}
          {isJoined ? (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
              <div className="w-12 h-12 bg-blue-100 text-[#02529c] rounded-xl flex items-center justify-center mx-auto mb-3">
                <ShieldCheck className="w-7 h-7" />
              </div>

              <h3 className="text-base font-bold text-gray-900 mb-1">
                Candidate Registered Successfully!
              </h3>
              <p className="text-xs text-gray-600 mb-4">
                Candidate: <strong className="text-gray-900">{candidateName}</strong> | Roll No: <strong className="text-gray-900">{rollNo}</strong>
              </p>

              {sessionStatus === 'waiting' && (
                <div className="bg-white border border-blue-200 rounded p-4 inline-block text-center max-w-md w-full shadow-xs">
                  <div className="animate-spin inline-block w-6 h-6 border-3 border-blue-600 border-t-transparent rounded-full mb-2"></div>
                  <p className="text-sm font-semibold text-blue-900">Waiting for Examiner to Start Examination...</p>
                  <p className="text-xs text-gray-500 mt-1">
                    Your test will start automatically as soon as the host begins the session. Please do not close this window.
                  </p>
                </div>
              )}

              {sessionStatus === 'starting' && (
                <div className="bg-amber-50 border-2 border-amber-400 rounded-lg p-5 inline-block text-center max-w-md w-full shadow-md animate-pulse">
                  <div className="text-xs uppercase font-bold text-amber-800 tracking-wider mb-1">
                    Examination is Starting
                  </div>
                  <div className="text-4xl font-extrabold text-amber-600 font-mono my-2">
                    {startingCountdown}s
                  </div>
                  <p className="text-xs text-amber-900 font-medium">
                    Synchronized 30-Second Countdown in progress. Get ready!
                  </p>
                </div>
              )}

              {sessionStatus === 'live' && (
                <div className="mt-3">
                  <button
                    onClick={() => onStartExam(candidateName, rollNo)}
                    className="bg-[#198754] hover:bg-[#157347] text-white font-bold py-2.5 px-8 rounded text-sm transition"
                  >
                    Enter Examination Now
                  </button>
                </div>
              )}
            </div>
          ) : (
            /* Candidate Entry Form matching Screenshot 3 */
            <form onSubmit={handleJoinClick} className="bg-gray-50 border border-gray-200 rounded-lg p-5 md:p-6">
              {errorMsg && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-xs flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="block text-xs md:text-sm font-bold text-gray-800 mb-1.5">
                    Candidate Name
                  </label>
                  <input
                    type="text"
                    required
                    value={candidateName}
                    onChange={(e) => setCandidateName(e.target.value)}
                    placeholder="अपना नाम लिखें"
                    className="w-full px-3.5 py-2.5 bg-white border border-gray-300 rounded text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs md:text-sm font-bold text-gray-800 mb-1.5">
                    Roll Number
                  </label>
                  <input
                    type="text"
                    required
                    value={rollNo}
                    onChange={(e) => setRollNo(e.target.value)}
                    placeholder="Roll Number"
                    className="w-full px-3.5 py-2.5 bg-white border border-gray-300 rounded text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Start Exam Button matching Screenshot 3 exact green color */}
              <div className="mt-6 text-center">
                <button
                  type="submit"
                  disabled={isSubmittingJoin}
                  className="bg-[#198754] hover:bg-[#157347] text-white font-bold py-2.5 px-10 rounded text-sm transition shadow-sm disabled:opacity-50 tracking-wide"
                >
                  {isSubmittingJoin ? 'Registering...' : 'START EXAM'}
                </button>
              </div>
            </form>
          )}

          {/* Session Details Footer */}
          <div className="mt-6 pt-4 border-t border-gray-200 flex flex-wrap items-center justify-between text-xs text-gray-500 gap-2">
            <div>
              <span>Session ID: </span>
              <span className="font-mono font-bold text-gray-700">{session.id}</span>
            </div>
            <div>
              <span>Examiner: </span>
              <span className="font-semibold text-gray-700">{session.examinerName}</span>
            </div>
            <div>
              <span>Subject: </span>
              <span className="font-semibold text-gray-700">{session.topic}</span>
            </div>
          </div>
        </div>

      </div>

      {/* Real-Time Student Removed Modal */}
      <StudentRemovedModal
        isOpen={isRemovedByHost}
        studentName={candidateName}
        rollNo={rollNo}
        message={removalMessage}
        onAcknowledge={() => {
          if (onExitToJoin) {
            onExitToJoin();
          } else {
            window.location.reload();
          }
        }}
      />
    </div>
  );
};
