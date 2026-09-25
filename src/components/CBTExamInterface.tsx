import React, { useState, useEffect, useRef } from 'react';
import { Question, QuestionStatus, BroadcastNotice } from '../types.ts';
import { AlertTriangle, Clock, CheckCircle2, XCircle, Bell, ShieldAlert, Award } from 'lucide-react';

interface CBTExamInterfaceProps {
  sessionId: string;
  candidateName: string;
  rollNo: string;
  testTitle: string;
  examinerName: string;
  initialQuestions: Question[];
  initialAnswers: Record<number, number>;
  initialStatuses: Record<number, QuestionStatus>;
  serverRemainingSeconds: number;
  examStatus: 'waiting' | 'starting' | 'live' | 'paused' | 'ended';
  broadcastNotice: BroadcastNotice | null;
  onFinalSubmitted: (data: any) => void;
}

export const CBTExamInterface: React.FC<CBTExamInterfaceProps> = ({
  sessionId,
  candidateName,
  rollNo,
  testTitle,
  examinerName,
  initialQuestions,
  initialAnswers,
  initialStatuses,
  serverRemainingSeconds,
  examStatus: initialExamStatus,
  broadcastNotice: initialNotice,
  onFinalSubmitted
}) => {
  const [questions, setQuestions] = useState<Question[]>(initialQuestions);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [answers, setAnswers] = useState<Record<number, number>>(initialAnswers || {});
  const [questionStatuses, setQuestionStatuses] = useState<Record<number, QuestionStatus>>(initialStatuses || {});
  const [remainingSeconds, setRemainingSeconds] = useState<number>(serverRemainingSeconds);
  const [examStatus, setExamStatus] = useState(initialExamStatus);
  const [broadcastNotice, setBroadcastNotice] = useState<BroadcastNotice | null>(initialNotice);
  
  // Modals & Alerts
  const [showSubmitModal, setShowSubmitModal] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [showTabWarning, setShowTabWarning] = useState<boolean>(false);
  const [tabWarningCount, setTabWarningCount] = useState<number>(0);
  const [submissionComplete, setSubmissionComplete] = useState<boolean>(false);
  const [submissionDetails, setSubmissionDetails] = useState<any>(null);
  
  // Mobile palette toggle
  const [showMobilePalette, setShowMobilePalette] = useState<boolean>(false);

  const currentQuestion = questions[currentIndex] || questions[0];
  const currentAnswer = currentQuestion ? answers[currentQuestion.id] : undefined;

  // Initialize status for first question if not visited
  useEffect(() => {
    if (currentQuestion && !questionStatuses[currentQuestion.id]) {
      setQuestionStatuses(prev => ({
        ...prev,
        [currentQuestion.id]: 'not_answered'
      }));
    }
  }, [currentIndex, currentQuestion]);

  // Synchronize with server remaining seconds
  useEffect(() => {
    setRemainingSeconds(serverRemainingSeconds);
  }, [serverRemainingSeconds]);

  // Real-time Countdown Timer (decrements locally, synchronized with server)
  useEffect(() => {
    if (examStatus !== 'live' || remainingSeconds <= 0 || submissionComplete) return;

    const timer = setInterval(() => {
      setRemainingSeconds(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          handleAutoSubmit('timeout');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [examStatus, remainingSeconds, submissionComplete]);

  // Real-Time Server-Sent Events (SSE) Listener for synchronizing host actions
  useEffect(() => {
    const sse = new EventSource(`/api/sessions/${sessionId}/stream?rollNo=${encodeURIComponent(rollNo)}`);

    sse.addEventListener('session_update', (e) => {
      const data = JSON.parse(e.data);
      if (data.status) setExamStatus(data.status);
      if (data.remainingSeconds !== undefined) setRemainingSeconds(data.remainingSeconds);
      if (data.broadcastNotice) setBroadcastNotice(data.broadcastNotice);
    });

    sse.addEventListener('exam_ended', () => {
      setExamStatus('ended');
      handleAutoSubmit('host_close');
    });

    sse.addEventListener('session_closed', () => {
      setExamStatus('ended');
      handleAutoSubmit('host_close');
    });

    sse.addEventListener('time_added', (e) => {
      const data = JSON.parse(e.data);
      if (data.remainingSeconds !== undefined) {
        setRemainingSeconds(data.remainingSeconds);
      }
    });

    sse.addEventListener('broadcast_notice', (e) => {
      const data = JSON.parse(e.data);
      setBroadcastNotice(data);
    });

    return () => {
      sse.close();
    };
  }, [sessionId, rollNo]);

  // Anti-Cheating: Tab switch / Window focus loss detection
  useEffect(() => {
    if (examStatus !== 'live' || submissionComplete) return;

    let debounceTimer: any = null;

    const handleFocusLoss = () => {
      if (document.hidden) {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
          setShowTabWarning(true);
          setTabWarningCount(prev => prev + 1);

          // Report to server
          fetch(`/api/sessions/${sessionId}/warning`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              rollNo,
              reason: 'Student switched tabs or minimized exam window'
            })
          }).catch(console.error);
        }, 300);
      }
    };

    document.addEventListener('visibilitychange', handleFocusLoss);
    window.addEventListener('blur', handleFocusLoss);

    return () => {
      document.removeEventListener('visibilitychange', handleFocusLoss);
      window.removeEventListener('blur', handleFocusLoss);
      clearTimeout(debounceTimer);
    };
  }, [examStatus, submissionComplete, sessionId, rollNo]);

  // Format time as MM:SS or HH:MM:SS
  const formatTime = (totalSeconds: number) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    const pad = (n: number) => String(n).padStart(2, '0');

    if (hours > 0) {
      return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
    }
    return `${pad(minutes)}:${pad(seconds)}`;
  };

  // Save Response to Server in Background
  const persistAnswerToServer = async (qId: number, optIndex: number, newStatus: QuestionStatus) => {
    try {
      await fetch(`/api/sessions/${sessionId}/save-response`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rollNo,
          questionId: qId,
          optionIndex: optIndex,
          status: newStatus
        })
      });
    } catch (err) {
      console.error('Failed to autosave response:', err);
    }
  };

  // Option selection
  const handleSelectOption = (optionIndex: number) => {
    if (!currentQuestion || examStatus === 'paused') return;

    const qId = currentQuestion.id;
    setAnswers(prev => ({ ...prev, [qId]: optionIndex }));
    
    // Status update: if marked for review, become answered_and_review, otherwise answered
    const currentSt = questionStatuses[qId];
    const newStatus: QuestionStatus = (currentSt === 'marked_for_review' || currentSt === 'answered_and_review')
      ? 'answered_and_review'
      : 'answered';

    setQuestionStatuses(prev => ({ ...prev, [qId]: newStatus }));
    persistAnswerToServer(qId, optionIndex, newStatus);
  };

  // Button: Save & Next
  const handleSaveAndNext = () => {
    if (!currentQuestion) return;
    const qId = currentQuestion.id;
    const hasAnswer = answers[qId] !== undefined;

    let newStatus: QuestionStatus;
    if (questionStatuses[qId] === 'marked_for_review' || questionStatuses[qId] === 'answered_and_review') {
      newStatus = hasAnswer ? 'answered_and_review' : 'marked_for_review';
    } else {
      newStatus = hasAnswer ? 'answered' : 'not_answered';
    }

    setQuestionStatuses(prev => ({ ...prev, [qId]: newStatus }));
    persistAnswerToServer(qId, answers[qId] ?? -1, newStatus);

    if (currentIndex < questions.length - 1) {
      const nextIndex = currentIndex + 1;
      setCurrentIndex(nextIndex);
      const nextQId = questions[nextIndex].id;
      if (!questionStatuses[nextQId]) {
        setQuestionStatuses(prev => ({ ...prev, [nextQId]: 'not_answered' }));
      }
    }
  };

  // Button: Previous
  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  // Button: Clear Response
  const handleClearResponse = () => {
    if (!currentQuestion) return;
    const qId = currentQuestion.id;

    setAnswers(prev => {
      const copy = { ...prev };
      delete copy[qId];
      return copy;
    });

    const isReview = questionStatuses[qId] === 'marked_for_review' || questionStatuses[qId] === 'answered_and_review';
    const newStatus: QuestionStatus = isReview ? 'marked_for_review' : 'not_answered';

    setQuestionStatuses(prev => ({ ...prev, [qId]: newStatus }));
    persistAnswerToServer(qId, -1, newStatus);
  };

  // Button: Mark for Review
  const handleMarkForReview = () => {
    if (!currentQuestion) return;
    const qId = currentQuestion.id;
    const hasAnswer = answers[qId] !== undefined;
    const newStatus: QuestionStatus = hasAnswer ? 'answered_and_review' : 'marked_for_review';

    setQuestionStatuses(prev => ({ ...prev, [qId]: newStatus }));
    persistAnswerToServer(qId, answers[qId] ?? -1, newStatus);

    // Also navigate forward if possible
    if (currentIndex < questions.length - 1) {
      const nextIndex = currentIndex + 1;
      setCurrentIndex(nextIndex);
      const nextQId = questions[nextIndex].id;
      if (!questionStatuses[nextQId]) {
        setQuestionStatuses(prev => ({ ...prev, [nextQId]: 'not_answered' }));
      }
    }
  };

  // Direct Jump to Question from Palette
  const handleJumpToQuestion = (index: number) => {
    if (!questions[index]) return;
    
    // Mark current question if not yet marked
    if (currentQuestion && !questionStatuses[currentQuestion.id]) {
      setQuestionStatuses(prev => ({ ...prev, [currentQuestion.id]: 'not_answered' }));
    }

    setCurrentIndex(index);
    const targetQId = questions[index].id;
    if (!questionStatuses[targetQId]) {
      setQuestionStatuses(prev => ({ ...prev, [targetQId]: 'not_answered' }));
    }
    setShowMobilePalette(false);
  };

  // Palette counts summary
  const getStatusCounts = () => {
    let answered = 0;
    let notAnswered = 0;
    let markedForReview = 0;
    let notVisited = 0;

    questions.forEach(q => {
      const status = questionStatuses[q.id];
      if (!status || status === 'not_visited') {
        notVisited++;
      } else if (status === 'answered') {
        answered++;
      } else if (status === 'not_answered') {
        notAnswered++;
      } else if (status === 'marked_for_review' || status === 'answered_and_review') {
        markedForReview++;
        if (status === 'answered_and_review') {
          answered++;
        }
      }
    });

    return { answered, notAnswered, markedForReview, notVisited };
  };

  // Final Submission
  const handleConfirmSubmit = async () => {
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/sessions/${sessionId}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rollNo })
      });
      const data = await res.json();
      setShowSubmitModal(false);
      setSubmissionComplete(true);
      setSubmissionDetails(data.candidate);
      onFinalSubmitted(data);
    } catch (err) {
      console.error('Submission failed:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Auto submission on timeout or host close
  const handleAutoSubmit = async (reason: string) => {
    if (submissionComplete) return;
    try {
      const res = await fetch(`/api/sessions/${sessionId}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rollNo, reason })
      });
      const data = await res.json();
      setSubmissionComplete(true);
      setSubmissionDetails(data.candidate);
      onFinalSubmitted(data);
    } catch (err) {
      console.error('Auto submission error:', err);
    }
  };

  // Colors & badges for question palette buttons
  const getPaletteButtonClass = (index: number) => {
    const q = questions[index];
    const status = questionStatuses[q.id] || 'not_visited';
    const isActive = index === currentIndex;

    let base = "relative flex items-center justify-center h-10 w-full rounded border text-xs font-semibold cursor-pointer transition select-none ";

    if (isActive) {
      base += " ring-2 ring-blue-500 ring-offset-1 ";
    }

    switch (status) {
      case 'answered':
        // Green
        return base + "bg-[#28a745] hover:bg-green-700 text-white border-transparent";
      case 'not_answered':
        // Red
        return base + "bg-[#dc3545] hover:bg-red-700 text-white border-transparent";
      case 'marked_for_review':
        // Purple
        return base + "bg-[#6f42c1] hover:bg-purple-800 text-white border-transparent";
      case 'answered_and_review':
        // Purple with green indicator border
        return base + "bg-[#6f42c1] hover:bg-purple-800 text-white border-2 border-[#28a745]";
      case 'not_visited':
      default:
        // Light Gray
        return base + "bg-[#e9ecef] hover:bg-gray-300 text-gray-800 border-gray-300";
    }
  };

  // If submitted, show exact Confirmation Screen (Section 10)
  if (submissionComplete) {
    return (
      <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-4">
        <div className="max-w-xl w-full bg-white rounded-md shadow-md border border-gray-200 overflow-hidden">
          <div className="bg-[#02529c] text-white py-4 px-6 text-center">
            <h1 className="text-xl font-bold tracking-wide">ACCESS COMPUTER EDUCATION CENTER</h1>
            <p className="text-xs text-blue-100 mt-1 uppercase tracking-wider">Computer Based Test (CBT) Submission</p>
          </div>

          <div className="p-8 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 text-green-600">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <h2 className="text-xl font-bold text-gray-800 mb-2">Examination Completed</h2>

            {/* Exact required message from Section 10 */}
            <div className="my-5 p-4 bg-blue-50 border border-blue-200 rounded text-blue-900 font-medium text-sm leading-relaxed">
              Test submitted successfully. Results will be published by host {examinerName || 'XYZ Name'} in a few days.
            </div>

            <div className="bg-gray-50 border border-gray-200 rounded p-4 text-left text-sm space-y-2 mb-6">
              <div className="flex justify-between border-b border-gray-200 pb-1.5">
                <span className="text-gray-500 font-medium">Candidate Name:</span>
                <span className="font-semibold text-gray-800">{candidateName}</span>
              </div>
              <div className="flex justify-between border-b border-gray-200 pb-1.5">
                <span className="text-gray-500 font-medium">Roll Number:</span>
                <span className="font-semibold text-gray-800">{rollNo}</span>
              </div>
              <div className="flex justify-between border-b border-gray-200 pb-1.5">
                <span className="text-gray-500 font-medium">Test Name:</span>
                <span className="font-semibold text-gray-800">{testTitle}</span>
              </div>
              <div className="flex justify-between border-b border-gray-200 pb-1.5">
                <span className="text-gray-500 font-medium">Examiner / Host:</span>
                <span className="font-semibold text-gray-800">{examinerName}</span>
              </div>
              <div className="flex justify-between border-b border-gray-200 pb-1.5">
                <span className="text-gray-500 font-medium">Submission Time:</span>
                <span className="font-semibold text-gray-800">{new Date().toLocaleTimeString()}</span>
              </div>
              <div className="flex justify-between pt-1">
                <span className="text-gray-500 font-medium">Status:</span>
                <span className="font-bold text-green-700 bg-green-100 px-2 py-0.5 rounded text-xs">Successfully Saved</span>
              </div>
            </div>

            <p className="text-xs text-gray-500">
              You may now safely close this window or return to the home screen.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const counts = getStatusCounts();

  return (
    <div className="min-h-screen bg-[#f4f6f9] flex flex-col select-none">
      {/* 2.1 Blue Examination Header (Full-width deep blue, white title, countdown timer on right) */}
      <header className="bg-[#02529c] text-white px-4 md:px-6 py-2.5 flex items-center justify-between shadow-md shrink-0 border-b border-blue-900 sticky top-0 z-20">
        <div className="flex items-center space-x-3 overflow-hidden">
          <div className="font-bold text-sm md:text-base tracking-wide truncate">
            {testTitle || 'Access Computer Education Center — Online Test'}
          </div>
        </div>

        {/* Autoritative Countdown Timer */}
        <div className="flex items-center space-x-2 shrink-0">
          <div className="bg-white text-[#d63031] font-mono font-bold text-base md:text-lg px-3 py-1 rounded shadow-sm flex items-center space-x-1.5 border border-red-200">
            <Clock className="w-4 h-4 text-red-600 hidden sm:inline" />
            <span>{formatTime(remainingSeconds)}</span>
          </div>

          {/* Mobile Palette Toggle Button */}
          <button
            onClick={() => setShowMobilePalette(!showMobilePalette)}
            className="md:hidden bg-blue-800 hover:bg-blue-900 text-white text-xs font-semibold px-2.5 py-1.5 rounded"
          >
            {showMobilePalette ? 'Close' : 'Palette'}
          </button>
        </div>
      </header>

      {/* Broadcast Notice Bar if Examiner sent an announcement */}
      {broadcastNotice && (
        <div className="bg-amber-100 border-b border-amber-300 px-4 py-2 text-amber-900 text-sm flex items-center justify-between shrink-0 animate-pulse">
          <div className="flex items-center space-x-2">
            <Bell className="w-4 h-4 text-amber-700 shrink-0" />
            <span><strong>Notice from Host ({broadcastNotice.examiner}):</strong> {broadcastNotice.message}</span>
          </div>
          <button
            onClick={() => setBroadcastNotice(null)}
            className="text-xs bg-amber-200 hover:bg-amber-300 text-amber-900 font-semibold px-2 py-0.5 rounded"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Paused Overlay */}
      {examStatus === 'paused' && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-lg p-6 max-w-md w-full text-center shadow-xl border border-gray-200">
            <div className="w-12 h-12 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-3">
              <Clock className="w-7 h-7" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-1">Examination Paused by Host</h3>
            <p className="text-sm text-gray-600 mb-4">
              The examiner has temporarily paused the examination. Your timer and answers are safely frozen. Please wait for the host to resume.
            </p>
            <div className="text-xs font-mono text-gray-500 bg-gray-100 py-1.5 rounded">
              Current Remaining Time: {formatTime(remainingSeconds)}
            </div>
          </div>
        </div>
      )}

      {/* Tab Switch Warning Modal */}
      {showTabWarning && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full shadow-2xl border-2 border-red-500 text-center animate-bounce-short">
            <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-3">
              <ShieldAlert className="w-7 h-7" />
            </div>
            <h3 className="text-lg font-bold text-red-700 mb-2">Anti-Cheating Warning</h3>
            <p className="text-sm font-semibold text-gray-800 mb-2">
              Do not switch tabs while the test is active.
            </p>
            <p className="text-xs text-gray-600 mb-4">
              This event has been logged and reported to the examiner in real time (Warning #{tabWarningCount}). Continued focus loss may result in disqualification.
            </p>
            <button
              onClick={() => setShowTabWarning(false)}
              className="bg-red-600 hover:bg-red-700 text-white font-bold text-sm px-6 py-2 rounded shadow"
            >
              I Understand & Return to Exam
            </button>
          </div>
        </div>
      )}

      {/* 2.2 Main Examination Layout: Left Question Panel, Right Question Palette */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden p-3 md:p-4 gap-3 md:gap-4 max-w-[1920px] mx-auto w-full">
        {/* Left Column: Question Panel */}
        <main className="flex-1 flex flex-col bg-white rounded border border-gray-300 shadow-xs overflow-hidden">
          {currentQuestion ? (
            <>
              {/* 2.3 Question Header Strip */}
              <div className="bg-[#f4f6f9] border-b border-gray-300 px-4 py-2 flex items-center justify-between text-xs md:text-sm font-bold text-gray-800 shrink-0">
                <span>Question No. {currentIndex + 1}</span>
                <span>Marks: {currentQuestion.marks || 1}</span>
              </div>

              {/* Question Text & Options */}
              <div className="flex-1 p-4 md:p-6 overflow-y-auto">
                <div className="text-sm md:text-base font-medium text-gray-900 mb-6 leading-relaxed">
                  {currentQuestion.text}
                </div>

                {/* 2.4 Answer Options */}
                <div className="space-y-3">
                  {currentQuestion.options.map((optionText, optIndex) => {
                    const isSelected = currentAnswer === optIndex;
                    return (
                      <div
                        key={optIndex}
                        onClick={() => handleSelectOption(optIndex)}
                        className={`w-full p-3 md:py-3.5 md:px-4 rounded border text-xs md:text-sm flex items-center cursor-pointer transition-all ${
                          isSelected
                            ? 'bg-[#eaf4fc] border-[#4ba0e3] text-gray-900 font-semibold shadow-xs ring-1 ring-blue-300'
                            : 'bg-white border-gray-300 hover:bg-gray-50 text-gray-800'
                        }`}
                      >
                        <input
                          type="radio"
                          name={`q-${currentQuestion.id}`}
                          checked={isSelected}
                          onChange={() => handleSelectOption(optIndex)}
                          className="w-4 h-4 mr-3 text-blue-600 border-gray-400 focus:ring-blue-500 cursor-pointer"
                        />
                        <span className="leading-snug">{optionText}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 2.5 Bottom Action Buttons Row - Responsive Grid on Mobile, Flex on Desktop */}
              <div className="border-t border-gray-200 bg-gray-50 p-2.5 sm:p-3 md:px-4 grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={handlePrevious}
                  disabled={currentIndex === 0}
                  className={`min-h-[42px] px-3 md:px-5 py-2 text-xs md:text-sm font-semibold rounded text-white transition flex items-center justify-center ${
                    currentIndex === 0
                      ? 'bg-gray-400 cursor-not-allowed opacity-60'
                      : 'bg-[#6c757d] hover:bg-[#5a6268] active:scale-98'
                  }`}
                >
                  Previous
                </button>

                <button
                  type="button"
                  onClick={handleClearResponse}
                  className="min-h-[42px] px-3 md:px-5 py-2 text-xs md:text-sm font-semibold rounded text-white bg-[#dc3545] hover:bg-[#bd2130] active:scale-98 transition flex items-center justify-center"
                >
                  Clear Response
                </button>

                <button
                  type="button"
                  onClick={handleMarkForReview}
                  className="min-h-[42px] px-3 md:px-5 py-2 text-xs md:text-sm font-semibold rounded text-white bg-[#6f42c1] hover:bg-[#5a32a3] active:scale-98 transition flex items-center justify-center"
                >
                  Mark for Review
                </button>

                <button
                  type="button"
                  onClick={handleSaveAndNext}
                  className="min-h-[42px] px-4 md:px-6 py-2 text-xs md:text-sm font-bold rounded text-white bg-[#198754] hover:bg-[#157347] active:scale-98 transition sm:ml-auto flex items-center justify-center shadow-xs"
                >
                  Save & Next
                </button>
              </div>
            </>
          ) : (
            <div className="p-8 text-center text-gray-500">
              Loading questions...
            </div>
          )}
        </main>

        {/* Mobile Palette Backdrop */}
        {showMobilePalette && (
          <div 
            className="fixed inset-0 bg-black/50 z-35 md:hidden backdrop-blur-xs"
            onClick={() => setShowMobilePalette(false)}
          />
        )}

        {/* Right Column: Question Palette Sidebar */}
        <aside
          className={`w-full md:w-80 lg:w-96 bg-white rounded border border-gray-300 shadow-lg md:shadow-xs flex flex-col shrink-0 overflow-hidden ${
            showMobilePalette 
              ? 'fixed inset-x-3 bottom-3 top-14 z-40 md:static rounded-xl' 
              : 'hidden md:flex'
          }`}
        >
          {/* Mobile Close Bar */}
          <div className="md:hidden bg-[#02529c] text-white px-3 py-2 flex items-center justify-between text-xs font-bold shrink-0">
            <span>QUESTION PALETTE</span>
            <button
              onClick={() => setShowMobilePalette(false)}
              className="bg-white/20 hover:bg-white/30 text-white px-2 py-0.5 rounded text-xs"
            >
              ✕ Close
            </button>
          </div>

          {/* 2.6 Candidate Information */}
          <div className="p-3 bg-gray-50 border-b border-gray-200 text-xs text-gray-800 space-y-1">
            <div className="flex">
              <span className="font-semibold text-gray-600 w-24">Candidate:</span>
              <span className="font-bold text-gray-900 truncate">{candidateName}</span>
            </div>
            <div className="flex">
              <span className="font-semibold text-gray-600 w-24">Roll No:</span>
              <span className="font-bold text-gray-900">{rollNo}</span>
            </div>
          </div>

          {/* Palette Header */}
          <div className="px-3 pt-2.5 pb-1">
            <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wide">Question Palette</h3>
          </div>

          {/* 2.7 Question Numbers Grid (5 columns on desktop) */}
          <div className="flex-1 p-3 overflow-y-auto max-h-[460px]">
            <div className="grid grid-cols-5 gap-1.5">
              {questions.map((q, idx) => (
                <button
                  key={q.id}
                  type="button"
                  onClick={() => handleJumpToQuestion(idx)}
                  className={getPaletteButtonClass(idx)}
                  title={`Question ${idx + 1}`}
                >
                  {idx + 1}
                  {questionStatuses[q.id] === 'answered_and_review' && (
                    <span className="absolute top-0.5 right-0.5 w-2 h-2 bg-[#28a745] rounded-full" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Palette Color Legend */}
          <div className="p-3 border-t border-gray-200 bg-gray-50 text-[11px] text-gray-700 space-y-1.5 shrink-0">
            <div className="flex items-center space-x-2">
              <span className="w-3.5 h-3.5 bg-[#e9ecef] border border-gray-300 inline-block rounded-xs" />
              <span>Not Visited</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="w-3.5 h-3.5 bg-[#28a745] inline-block rounded-xs" />
              <span>Answered</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="w-3.5 h-3.5 bg-[#dc3545] inline-block rounded-xs" />
              <span>Not Answered</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="w-3.5 h-3.5 bg-[#6f42c1] inline-block rounded-xs" />
              <span>Marked for Review</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="w-3.5 h-3.5 bg-[#6f42c1] border border-[#28a745] inline-block rounded-xs relative">
                <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-[#28a745] rounded-full" />
              </span>
              <span>Answered & Review</span>
            </div>
          </div>

          {/* 2.8 Submit Test Button */}
          <div className="p-3 border-t border-gray-200 bg-white shrink-0">
            <button
              type="button"
              onClick={() => setShowSubmitModal(true)}
              className="w-full bg-[#b02a37] hover:bg-[#8f212d] text-white font-bold py-2.5 px-4 rounded text-xs md:text-sm uppercase tracking-wider transition shadow-sm"
            >
              SUBMIT TEST
            </button>
          </div>
        </aside>
      </div>

      {/* Submit Confirmation Modal */}
      {showSubmitModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-md w-full shadow-2xl border border-gray-200 overflow-hidden">
            <div className="bg-[#b02a37] text-white px-5 py-3 font-bold text-sm">
              Confirm Test Submission
            </div>

            <div className="p-5 text-xs md:text-sm text-gray-700">
              <p className="mb-4 font-medium text-gray-900">
                Are you sure you want to submit the examination? You will not be able to change your answers once submitted.
              </p>

              {/* Statistics Breakdown */}
              <div className="bg-gray-50 border border-gray-200 rounded p-3 mb-5 space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Questions:</span>
                  <span className="font-bold text-gray-800">{questions.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-green-700 font-medium">Answered:</span>
                  <span className="font-bold text-green-700">{counts.answered}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-red-600 font-medium">Not Answered:</span>
                  <span className="font-bold text-red-600">{counts.notAnswered}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-purple-700 font-medium">Marked for Review:</span>
                  <span className="font-bold text-purple-700">{counts.markedForReview}</span>
                </div>
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowSubmitModal(false)}
                  disabled={isSubmitting}
                  className="px-4 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-100 font-medium transition"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmSubmit}
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-[#b02a37] hover:bg-[#8f212d] text-white font-bold rounded transition flex items-center space-x-1.5"
                >
                  {isSubmitting ? 'Submitting...' : 'Yes, Submit Test'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
