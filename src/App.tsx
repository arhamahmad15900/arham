import React, { useState, useEffect } from 'react';
import { Homepage } from './components/Homepage.tsx';
import { CreateExamView } from './components/CreateExamView.tsx';
import { HostDashboard } from './components/HostDashboard.tsx';
import { JoinTestLookup } from './components/JoinTestLookup.tsx';
import { StudentInstructions } from './components/StudentInstructions.tsx';
import { CBTExamInterface } from './components/CBTExamInterface.tsx';
import { StudentResultView } from './components/StudentResultView.tsx';
import { HostExitConfirmModal } from './components/HostExitConfirmModal.tsx';
import type { SessionPublicInfo, Question, QuestionStatus, ExamStatus } from './types.ts';
import { MonitorCheck, GraduationCap, Award, ArrowLeft, Home, PlusCircle } from 'lucide-react';

export default function App() {
  const [currentMode, setCurrentMode] = useState<'home' | 'create-exam' | 'manage-session' | 'join' | 'results'>('home');
  const [targetSessionId, setTargetSessionId] = useState<string>('ACE-2026');
  
  // Host Session Management & Exit Guard States
  const [hostSessionStatus, setHostSessionStatus] = useState<ExamStatus | null>(null);
  const [showExitModal, setShowExitModal] = useState<boolean>(false);
  const [pendingNavigationMode, setPendingNavigationMode] = useState<'home' | 'create-exam' | 'manage-session' | 'join' | 'results' | null>(null);
  const [isExitingSession, setIsExitingSession] = useState<boolean>(false);
  const [exitModalError, setExitModalError] = useState<string>('');

  // Student Flow States
  const [activeSessionInfo, setActiveSessionInfo] = useState<SessionPublicInfo | null>(null);
  const [candidateName, setCandidateName] = useState<string>('');
  const [candidateRollNo, setCandidateRollNo] = useState<string>('');
  
  // Active CBT Exam State
  const [isExamLive, setIsExamLive] = useState<boolean>(false);
  const [examQuestions, setExamQuestions] = useState<Question[]>([]);
  const [examSavedAnswers, setExamSavedAnswers] = useState<Record<number, number>>({});
  const [examSavedStatuses, setExamSavedStatuses] = useState<Record<number, QuestionStatus>>({});
  const [examRemainingSeconds, setExamRemainingSeconds] = useState<number>(3600);
  const [examServerStatus, setExamServerStatus] = useState<any>('waiting');
  const [examBroadcastNotice, setExamBroadcastNotice] = useState<any>(null);
  const [loadingExam, setLoadingExam] = useState<boolean>(false);

  // Browser BeforeUnload Warning Guard for Active Host Sessions
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (currentMode === 'manage-session' && hostSessionStatus && hostSessionStatus !== 'ended') {
        e.preventDefault();
        e.returnValue = '';
        return '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [currentMode, hostSessionStatus]);

  // Intercept Navigation to Display Exit Warning if Host Session is Active
  const handleAttemptNavigation = (targetMode: 'home' | 'create-exam' | 'manage-session' | 'join' | 'results') => {
    if (currentMode === 'manage-session' && hostSessionStatus && hostSessionStatus !== 'ended') {
      if (targetMode === 'manage-session') return; // already on host dashboard
      setPendingNavigationMode(targetMode);
      setExitModalError('');
      setShowExitModal(true);
      return;
    }
    setCurrentMode(targetMode);
  };

  // Host Confirmed: Explicitly Close Server/Session on Backend and then Navigate Away
  const handleConfirmExitAndClose = async () => {
    if (isExitingSession) return; // Prevent duplicate clicks
    setIsExitingSession(true);
    setExitModalError('');

    try {
      const res = await fetch(`/api/sessions/${targetSessionId}/host-action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'close' })
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to close session on server');
      }

      setHostSessionStatus('ended');
      setShowExitModal(false);
      setIsExitingSession(false);
      const nextMode = pendingNavigationMode || 'home';
      setPendingNavigationMode(null);
      setCurrentMode(nextMode);
    } catch (err: any) {
      setExitModalError(err.message || 'Network error closing session. Please try again.');
      setIsExitingSession(false);
    }
  };

  // Host Cancelled: Stay on Page and Preserve Session
  const handleCancelExit = () => {
    setShowExitModal(false);
    setPendingNavigationMode(null);
    setExitModalError('');
  };

  // Check URL parameters on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const sessionParam = params.get('sessionId') || params.get('joinSession');
      const modeParam = params.get('mode');

      if (sessionParam) {
        setTargetSessionId(sessionParam);
        setCurrentMode('join');
        // Auto-fetch session metadata
        fetch(`/api/sessions/${sessionParam}`)
          .then(res => res.ok ? res.json() : null)
          .then(data => {
            if (data) {
              setActiveSessionInfo(data);
            }
          })
          .catch(console.error);
      } else if (modeParam === 'host' || modeParam === 'create') {
        setCurrentMode('create-exam');
      } else if (modeParam === 'manage') {
        setCurrentMode('manage-session');
      } else if (modeParam === 'join') {
        setCurrentMode('join');
      } else if (modeParam === 'results') {
        setCurrentMode('results');
      } else {
        // Default to Homepage at root URL "/"
        setCurrentMode('home');
      }
    }
  }, []);

  // When candidate successfully joins on JoinTestLookup, advance to instructions
  const handleSessionLoaded = (session: SessionPublicInfo, defaultRoll?: string, defaultName?: string) => {
    setActiveSessionInfo(session);
    setTargetSessionId(session.id);
    if (defaultRoll) setCandidateRollNo(defaultRoll);
    if (defaultName) setCandidateName(defaultName);
  };

  // Launch the CBT Interface (called from StudentInstructions when test is starting/live)
  const handleLaunchExam = async (name: string, roll: string) => {
    if (!activeSessionInfo) return;
    setLoadingExam(true);
    setCandidateName(name);
    setCandidateRollNo(roll);

    try {
      const res = await fetch(`/api/sessions/${activeSessionInfo.id}/student-exam?rollNo=${encodeURIComponent(roll)}`);
      const data = await res.json();

      if (res.ok) {
        setExamQuestions(data.questions || []);
        setExamSavedAnswers(data.savedAnswers || {});
        setExamSavedStatuses(data.questionStatuses || {});
        setExamRemainingSeconds(data.remainingSeconds || activeSessionInfo.durationMinutes * 60);
        setExamServerStatus(data.status || 'live');
        setExamBroadcastNotice(data.broadcastNotice || null);
        setIsExamLive(true);
      } else {
        alert(data.error || 'Failed to load examination paper');
      }
    } catch {
      alert('Network error loading examination');
    } finally {
      setLoadingExam(false);
    }
  };

  // If exam is live, render pure CBTExamInterface without extraneous nav headers to match screenshot exactly
  if (isExamLive && activeSessionInfo) {
    return (
      <CBTExamInterface
        sessionId={activeSessionInfo.id}
        candidateName={candidateName}
        rollNo={candidateRollNo}
        testTitle={activeSessionInfo.testName}
        examinerName={activeSessionInfo.examinerName}
        initialQuestions={examQuestions}
        initialAnswers={examSavedAnswers}
        initialStatuses={examSavedStatuses}
        serverRemainingSeconds={examRemainingSeconds}
        examStatus={examServerStatus}
        broadcastNotice={examBroadcastNotice}
        onFinalSubmitted={() => {
          // Completed state handled inside CBTExamInterface
        }}
      />
    );
  }

  // 1. New Homepage as the default page for root "/"
  if (currentMode === 'home') {
    return (
      <>
        <Homepage
          onNavigateToHost={() => handleAttemptNavigation('create-exam')}
          onNavigateToJoin={() => { setActiveSessionInfo(null); handleAttemptNavigation('join'); }}
          onNavigateToResults={() => handleAttemptNavigation('results')}
        />
        <HostExitConfirmModal
          isOpen={showExitModal}
          sessionId={targetSessionId}
          sessionStatus={hostSessionStatus || 'waiting'}
          isClosing={isExitingSession}
          errorMessage={exitModalError}
          onCancel={handleCancelExit}
          onConfirmClose={handleConfirmExitAndClose}
        />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-[#f4f7fb] flex flex-col font-sans select-none">
      {/* Top Global Portal Navbar (when outside of Homepage & Live Exam) */}
      <header className="bg-white border-b border-gray-200 px-3 sm:px-4 md:px-8 py-2.5 flex items-center justify-between sticky top-0 z-30 shadow-xs gap-2">
        <div className="flex items-center space-x-2.5 sm:space-x-3 cursor-pointer overflow-hidden shrink" onClick={() => handleAttemptNavigation('home')}>
          <div className="w-8 h-8 rounded bg-[#02529c] text-white font-black flex items-center justify-center text-sm shadow-xs shrink-0">
            ACE
          </div>
          <div className="truncate">
            <div className="font-bold text-gray-900 text-xs sm:text-sm md:text-base leading-tight truncate">
              Access Computer Education Center
            </div>
            <div className="text-[10px] sm:text-[11px] text-gray-500 truncate">CBT Examination System</div>
          </div>
        </div>

        {/* Simplified Navigation */}
        <nav className="flex items-center space-x-1 sm:space-x-2 shrink-0">
          <button
            onClick={() => handleAttemptNavigation('home')}
            className="px-2.5 py-1.5 rounded text-xs font-bold text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition flex items-center space-x-1"
          >
            <Home className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Home</span>
          </button>

          <button
            onClick={() => handleAttemptNavigation('create-exam')}
            className={`px-3 py-1.5 rounded text-xs font-bold transition flex items-center space-x-1 ${
              currentMode === 'create-exam' || currentMode === 'manage-session'
                ? 'bg-[#02529c] text-white shadow-xs'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            <MonitorCheck className="w-3.5 h-3.5" />
            <span>Host Test</span>
          </button>

          <button
            onClick={() => { setActiveSessionInfo(null); handleAttemptNavigation('join'); }}
            className={`px-3 py-1.5 rounded text-xs font-bold transition flex items-center space-x-1 ${
              currentMode === 'join'
                ? 'bg-[#16A34A] text-white shadow-xs'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            <GraduationCap className="w-3.5 h-3.5" />
            <span>Join Test</span>
          </button>
        </nav>
      </header>

      {/* Main Body */}
      <main className="flex-1">
        {/* Host Test: Opens Create Examination page directly */}
        {currentMode === 'create-exam' && (
          <CreateExamView
            onSessionCreated={(newSessionId) => {
              setTargetSessionId(newSessionId);
              setHostSessionStatus('waiting');
              setCurrentMode('manage-session');
            }}
            onBackToHome={() => handleAttemptNavigation('home')}
          />
        )}

        {/* Host Test: Session Control & Monitoring once session is created */}
        {currentMode === 'manage-session' && (
          <HostDashboard 
            initialSessionId={targetSessionId}
            onStatusUpdate={(status) => setHostSessionStatus(status)}
            onRequestNavigation={(target) => handleAttemptNavigation(target)}
            onNavigateToJoin={(sId) => {
              setTargetSessionId(sId);
              setActiveSessionInfo(null);
              handleAttemptNavigation('join');
            }}
            onNavigateToCreate={() => handleAttemptNavigation('create-exam')}
            onNavigateToHome={() => handleAttemptNavigation('home')}
          />
        )}

        {/* Join Test Student Flow */}
        {currentMode === 'join' && (
          <>
            {activeSessionInfo ? (
              <div className="relative">
                <button
                  onClick={() => setActiveSessionInfo(null)}
                  className="absolute top-4 left-4 z-10 bg-white/90 hover:bg-white text-gray-700 text-xs font-semibold px-3 py-1.5 rounded border border-gray-300 shadow-xs flex items-center space-x-1"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Change Session</span>
                </button>
                <StudentInstructions
                  session={activeSessionInfo}
                  defaultRollNo={candidateRollNo}
                  defaultName={candidateName}
                  onStartExam={handleLaunchExam}
                />
              </div>
            ) : (
              <JoinTestLookup
                initialSessionId={targetSessionId}
                onSessionLoaded={handleSessionLoaded}
              />
            )}
          </>
        )}

        {/* Results Lookup */}
        {currentMode === 'results' && (
          <StudentResultView initialSessionId={targetSessionId} />
        )}
      </main>

      {/* Host Session Exit Confirmation Modal */}
      <HostExitConfirmModal
        isOpen={showExitModal}
        sessionId={targetSessionId}
        sessionStatus={hostSessionStatus || 'waiting'}
        isClosing={isExitingSession}
        errorMessage={exitModalError}
        onCancel={handleCancelExit}
        onConfirmClose={handleConfirmExitAndClose}
      />

      {/* Loading Overlay */}
      {loadingExam && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full text-center shadow-2xl">
            <div className="animate-spin inline-block w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mb-3"></div>
            <h3 className="text-base font-bold text-gray-900">Loading Examination Paper</h3>
            <p className="text-xs text-gray-500 mt-1">Synchronizing with server. Please wait...</p>
          </div>
        </div>
      )}
    </div>
  );
}
