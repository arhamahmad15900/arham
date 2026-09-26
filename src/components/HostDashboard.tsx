import React, { useState, useEffect, useRef } from 'react';
import type { ExamSession, Question, CandidateState, AuditLogEntry, BroadcastNotice, ExamStatus } from '../types.ts';
import { generateQuestionSet, NIELIT_SAMPLE_QUESTIONS } from '../data/sampleQuestions.ts';
import { generateExamReportPDF } from '../utils/pdfGenerator.ts';
import { HostExitConfirmModal } from './HostExitConfirmModal.tsx';
import { Logo } from './Logo.tsx';
import { 
  Play, 
  Pause, 
  Clock, 
  PlusCircle, 
  Send, 
  StopCircle, 
  Download, 
  CheckCircle, 
  AlertTriangle, 
  Copy, 
  Check, 
  Users, 
  FileText, 
  ShieldAlert, 
  Upload, 
  RefreshCw,
  Share2,
  Volume2,
  VolumeX,
  ExternalLink,
  ChevronRight,
  UserX
} from 'lucide-react';

interface HostDashboardProps {
  initialSessionId?: string;
  onStatusUpdate?: (status: ExamStatus) => void;
  onRequestNavigation?: (targetMode: 'home' | 'create-exam' | 'join' | 'results') => void;
  onNavigateToJoin?: (sessionId: string) => void;
  onNavigateToCreate?: () => void;
  onNavigateToHome?: () => void;
}

export const HostDashboard: React.FC<HostDashboardProps> = ({ 
  initialSessionId = 'ACE-2026',
  onStatusUpdate,
  onRequestNavigation,
  onNavigateToJoin,
  onNavigateToCreate,
  onNavigateToHome
}) => {
  const [activeTab, setActiveTab] = useState<'live' | 'results'>('live');
  const [sessionId, setSessionId] = useState<string>(initialSessionId);
  const [session, setSession] = useState<ExamSession | null>(null);
  const [candidates, setCandidates] = useState<CandidateState[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);
  const [copiedId, setCopiedId] = useState<boolean>(false);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);

  // Action states & Modals
  const [showBroadcastModal, setShowBroadcastModal] = useState<boolean>(false);
  const [broadcastMessage, setBroadcastMessage] = useState<string>('');
  const [showCloseConfirmModal, setShowCloseConfirmModal] = useState<boolean>(false);
  const [candidateToRemove, setCandidateToRemove] = useState<{ rollNo: string; name: string } | null>(null);
  const [actionLoading, setActionLoading] = useState<boolean>(false);

  // New Exam Form State
  const [newTestName, setNewTestName] = useState<string>('');
  const [newTopic, setNewTopic] = useState<string>('');
  const [newExaminerName, setNewExaminerName] = useState<string>('');
  const [newDuration, setNewDuration] = useState<number>(60);
  const [newQuestionCount, setNewQuestionCount] = useState<number>(25);
  const [newMarksPerQ, setNewMarksPerQ] = useState<number>(1);
  const [rawTextImport, setRawTextImport] = useState<string>('');
  const [parsedQuestionsPreview, setParsedQuestionsPreview] = useState<Question[]>([]);
  const [isExtracting, setIsExtracting] = useState<boolean>(false);

  const audioContextRef = useRef<AudioContext | null>(null);

  const playBeep = () => {
    if (!soundEnabled) return;
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const ctx = audioContextRef.current;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.3);
    } catch {
      // Audio autoplay policy
    }
  };

  // Fetch full host session data
  const fetchSessionData = async (sId: string = sessionId) => {
    try {
      const res = await fetch(`/api/sessions/${sId}/host-status`);
      const contentType = res.headers.get('content-type');
      if (!res.ok || !contentType || !contentType.includes('application/json')) {
        setLoading(false);
        return;
      }
      const data = await res.json();
      setSession(data.session);
      if (data.session?.status && onStatusUpdate) {
        onStatusUpdate(data.session.status);
      }
      setCandidates(data.candidates || []);
      setAuditLogs(data.auditLogs || []);
      setQuestions(data.questions || []);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching host session data:', err);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSessionData(sessionId);
    const interval = setInterval(() => fetchSessionData(sessionId), 3000);
    return () => clearInterval(interval);
  }, [sessionId]);

  // Real-time Server-Sent Events (SSE) for Host
  useEffect(() => {
    if (!sessionId) return;
    const sse = new EventSource(`/api/sessions/${sessionId}/stream?isHost=true`);

    sse.addEventListener('session_update', (e) => {
      const data = JSON.parse(e.data);
      setSession(prev => {
        const updated = prev ? { ...prev, ...data } : null;
        if (updated?.status && onStatusUpdate) {
          onStatusUpdate(updated.status);
        }
        return updated;
      });
    });

    sse.addEventListener('candidate_joined', (e) => {
      const data = JSON.parse(e.data);
      fetchSessionData(sessionId);
    });

    sse.addEventListener('candidate_left', () => {
      fetchSessionData(sessionId);
    });

    sse.addEventListener('candidate_removed', () => {
      fetchSessionData(sessionId);
    });

    sse.addEventListener('candidate_progress', () => {
      fetchSessionData(sessionId);
    });

    sse.addEventListener('anti_cheat_alert', (e) => {
      const data = JSON.parse(e.data);
      playBeep();
      fetchSessionData(sessionId);
    });

    sse.addEventListener('candidate_submitted', () => {
      fetchSessionData(sessionId);
    });

    sse.addEventListener('countdown_tick', (e) => {
      const data = JSON.parse(e.data);
      setSession(prev => prev ? { ...prev, startingCountdown: data.startingCountdown, status: 'starting' } : null);
    });

    sse.addEventListener('exam_started', (e) => {
      const data = JSON.parse(e.data);
      setSession(prev => prev ? { ...prev, status: 'live', ...data } : null);
    });

    return () => sse.close();
  }, [sessionId, soundEnabled]);

  // Host Action Handler
  const handleHostAction = async (action: string, payload?: any) => {
    setActionLoading(true);
    try {
      if (action === 'close') {
        try {
          const resResults = await fetch(`/api/sessions/${sessionId}/results`);
          const resultsData = await resResults.json();
          if (resultsData && resultsData.results && resultsData.results.length > 0) {
            generateExamReportPDF(resultsData);
          }
        } catch (pdfErr) {
          console.error('Auto-download PDF error:', pdfErr);
        }
      }

      const res = await fetch(`/api/sessions/${sessionId}/host-action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, payload })
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || 'Host action failed');
      } else {
        await fetchSessionData(sessionId);
      }
    } catch (err: any) {
      alert('Network error executing host action');
    } finally {
      setActionLoading(false);
    }
  };

  // Broadcast Handler
  const handleSendBroadcast = async () => {
    if (!broadcastMessage.trim()) return;
    await handleHostAction('broadcast', { message: broadcastMessage.trim() });
    setBroadcastMessage('');
    setShowBroadcastModal(false);
  };

  // Download PDF Report
  const handleDownloadPDF = async () => {
    try {
      const res = await fetch(`/api/sessions/${sessionId}/results`);
      const data = await res.json();
      if (!data.results || data.results.length === 0) {
        alert('No submitted candidates available for the report yet.');
        return;
      }
      generateExamReportPDF(data);
    } catch (err) {
      alert('Failed to generate PDF report');
    }
  };

  // Create Session Handler
  const handleCreateSessionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);

    try {
      const questionsToUse = parsedQuestionsPreview.length > 0 
        ? parsedQuestionsPreview 
        : generateQuestionSet(newQuestionCount);

      const res = await fetch('/api/sessions/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          testName: newTestName,
          topic: newTopic,
          examinerName: newExaminerName,
          durationMinutes: newDuration,
          totalQuestions: questionsToUse.length,
          marksPerQuestion: newMarksPerQ,
          questions: questionsToUse
        })
      });

      const data = await res.json();
      if (res.ok) {
        setSessionId(data.sessionId);
        setActiveTab('live');
        await fetchSessionData(data.sessionId);
      } else {
        alert(data.error || 'Failed to create session');
      }
    } catch (err) {
      alert('Error creating session');
    } finally {
      setActionLoading(false);
    }
  };

  // AI / Text Question Parser
  const handleExtractQuestions = async () => {
    if (!rawTextImport.trim()) {
      alert('Please paste questions text or sample paper text');
      return;
    }
    setIsExtracting(true);
    try {
      const res = await fetch('/api/extract-questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rawText: rawTextImport })
      });
      const json = await res.json();
      if (json.success && json.data?.questions) {
        setParsedQuestionsPreview(json.data.questions);
        if (json.data.testName) setNewTestName(json.data.testName);
        if (json.data.topic) setNewTopic(json.data.topic);
        setNewQuestionCount(json.data.questions.length);
      } else {
        alert('Could not parse questions. Defaulting to standard set.');
      }
    } catch {
      alert('Extraction failed');
    } finally {
      setIsExtracting(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async () => {
      const text = reader.result as string;
      setRawTextImport(text);
      // Auto extract
      setIsExtracting(true);
      try {
        const res = await fetch('/api/extract-questions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ rawText: text })
        });
        const json = await res.json();
        if (json.success && json.data?.questions) {
          setParsedQuestionsPreview(json.data.questions);
          if (json.data.testName) setNewTestName(json.data.testName);
          if (json.data.topic) setNewTopic(json.data.topic);
          setNewQuestionCount(json.data.questions.length);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setIsExtracting(false);
      }
    };
    reader.readAsText(file);
  };

  const shareUrl = typeof window !== 'undefined' ? `${window.location.origin}?joinSession=${sessionId}` : '';

  const copyShareLink = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const copySessionId = () => {
    navigator.clipboard.writeText(sessionId);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  const formatTimer = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const totalCandidates = candidates.filter(c => c.connected && c.connectionStatus !== 'left' && c.connectionStatus !== 'removed').length;
  const submittedCandidates = candidates.filter(c => c.submitted).length;
  const activeCandidates = candidates.filter(c => !c.submitted && c.connected).length;
  const totalWarnings = candidates.reduce((acc, c) => acc + (c.warningCount || 0), 0);

  const handleRemoveCandidate = (rollNo: string, name: string) => {
    setCandidateToRemove({ rollNo, name });
  };

  return (
    <div className="min-h-screen bg-[#f4f6f9] flex flex-col font-sans">
      {/* Top Navigation Bar */}
      <header className="bg-[#02529c] text-white px-3 sm:px-4 md:px-8 py-2 sm:py-2.5 flex flex-wrap sm:flex-nowrap items-center justify-between shadow-md border-b border-blue-900 sticky top-0 z-20 gap-2">
        <div className="flex items-center space-x-2.5 sm:space-x-3 min-w-0">
          <Logo size="sm" className="shrink-0" />
          <div className="min-w-0">
            <h1 className="font-bold text-xs sm:text-sm md:text-base tracking-wide leading-tight truncate max-w-[200px] sm:max-w-none">
              Access Computer Education Center
            </h1>
            <p className="text-[10px] sm:text-[11px] text-blue-200">Examiner Control Center</p>
          </div>
        </div>

        {/* Tab Switcher & Sound Control */}
        <div className="flex items-center space-x-1.5 sm:space-x-2 shrink-0">
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="p-1.5 rounded hover:bg-blue-800 text-blue-100 hover:text-white transition"
            title={soundEnabled ? 'Mute Alerts' : 'Unmute Alerts'}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-400" /> : <VolumeX className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />}
          </button>

          <nav className="flex items-center space-x-1 bg-blue-900/60 p-0.5 sm:p-1 rounded-md text-[11px] sm:text-xs">
            {onNavigateToHome && (
              <button
                onClick={() => {
                  if (session?.status && session.status !== 'ended' && onRequestNavigation) {
                    onRequestNavigation('home');
                  } else if (session?.status && session.status !== 'ended') {
                    setShowCloseConfirmModal(true);
                  } else {
                    onNavigateToHome();
                  }
                }}
                className="px-2 py-1 rounded text-blue-100 hover:text-white transition font-medium cursor-pointer"
              >
                Home
              </button>
            )}
            {onNavigateToCreate && (
              <button
                onClick={() => {
                  if (session?.status && session.status !== 'ended' && onRequestNavigation) {
                    onRequestNavigation('create-exam');
                  } else if (session?.status && session.status !== 'ended') {
                    setShowCloseConfirmModal(true);
                  } else {
                    onNavigateToCreate();
                  }
                }}
                className="px-2 py-1 rounded bg-blue-800 hover:bg-blue-700 text-white transition font-bold cursor-pointer"
              >
                + New
              </button>
            )}
            <button
              onClick={() => setActiveTab('live')}
              className={`px-2.5 sm:px-3 py-1 sm:py-1.5 rounded font-medium transition ${
                activeTab === 'live' ? 'bg-white text-[#02529c] shadow-xs' : 'text-blue-100 hover:text-white'
              }`}
            >
              <span>Controls</span>
              <span className="hidden md:inline"> & Live Monitoring</span>
            </button>
            <button
              onClick={() => setActiveTab('results')}
              className={`px-2.5 sm:px-3 py-1 sm:py-1.5 rounded font-medium transition ${
                activeTab === 'results' ? 'bg-white text-[#02529c] shadow-xs' : 'text-blue-100 hover:text-white'
              }`}
            >
              <span>Results</span>
              <span className="hidden md:inline"> & PDF</span>
            </button>
          </nav>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 max-w-7xl mx-auto w-full p-4 md:p-6 space-y-6">
        {/* TAB 1: LIVE EXAMINATION CONTROL & DASHBOARD */}
        {activeTab === 'live' && (
          <>
            {/* Session Top Bar */}
            <div className="bg-white rounded-lg p-4 md:p-5 border border-gray-300 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center space-x-2 mb-1">
                  <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">Current Session:</span>
                  <span className="font-mono font-bold text-lg text-blue-900 bg-blue-50 px-2.5 py-0.5 rounded border border-blue-200">
                    {sessionId}
                  </span>
                  <button
                    onClick={copySessionId}
                    className="p-1 hover:bg-gray-100 rounded text-gray-500 hover:text-gray-800"
                    title="Copy Session ID"
                  >
                    {copiedId ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
                <h2 className="text-base md:text-lg font-bold text-gray-900">
                  {session?.testName || 'Access Computer Education Center: Online Test'}
                </h2>
                <p className="text-xs text-gray-600">
                  Topic: <strong>{session?.topic}</strong> | Examiner: <strong>{session?.examinerName}</strong> | Total Qs: <strong>{session?.totalQuestions}</strong>
                </p>
              </div>

              {/* Status Badge & Share Button */}
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center space-x-2">
                  <span className="text-xs text-gray-500 font-semibold">Status:</span>
                  <span className={`px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wider ${
                    session?.status === 'live'
                      ? 'bg-green-100 text-green-800 border border-green-300'
                      : session?.status === 'starting'
                      ? 'bg-amber-100 text-amber-800 border border-amber-300'
                      : session?.status === 'paused'
                      ? 'bg-yellow-100 text-yellow-800 border border-yellow-300'
                      : session?.status === 'ended'
                      ? 'bg-red-100 text-red-800 border border-red-300'
                      : 'bg-blue-100 text-blue-800 border border-blue-300'
                  }`}>
                    {session?.status === 'starting' ? `Starting (${session.startingCountdown}s)` : session?.status}
                  </span>
                </div>

                <button
                  onClick={copyShareLink}
                  className="bg-gray-100 hover:bg-gray-200 border border-gray-300 text-gray-800 text-xs font-bold px-3 py-2 rounded flex items-center space-x-1.5 transition"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span>{copiedLink ? 'Link Copied!' : 'Copy Student Link'}</span>
                </button>

              </div>
            </div>

            {/* 6. Host Controls Action Bar */}
            <div className="bg-white rounded-lg p-4 border border-gray-300 shadow-xs">
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Host Controls</h3>

              <div className="flex flex-wrap items-center gap-2.5">
                {/* 6.1 Start Test (30-Sec Countdown) */}
                {session?.status === 'waiting' && (
                  <button
                    onClick={() => handleHostAction('start')}
                    disabled={actionLoading}
                    className="bg-[#198754] hover:bg-[#157347] text-white text-xs font-bold px-4 py-2.5 rounded shadow-xs flex items-center space-x-1.5 transition"
                  >
                    <Play className="w-4 h-4" />
                    <span>Start Test (30s Countdown)</span>
                  </button>
                )}

                {/* Cancel Starting Countdown */}
                {session?.status === 'starting' && (
                  <button
                    onClick={() => handleHostAction('cancel_start')}
                    disabled={actionLoading}
                    className="bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold px-4 py-2.5 rounded shadow-xs flex items-center space-x-1.5 transition"
                  >
                    <Clock className="w-4 h-4 animate-spin" />
                    <span>Cancel Countdown ({session.startingCountdown}s remaining)</span>
                  </button>
                )}

                {/* 6.2 Pause & Resume */}
                {session?.status === 'live' && (
                  <button
                    onClick={() => handleHostAction('pause')}
                    disabled={actionLoading}
                    className="bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold px-4 py-2.5 rounded shadow-xs flex items-center space-x-1.5 transition"
                  >
                    <Pause className="w-4 h-4" />
                    <span>Pause Exam</span>
                  </button>
                )}

                {session?.status === 'paused' && (
                  <button
                    onClick={() => handleHostAction('resume')}
                    disabled={actionLoading}
                    className="bg-[#198754] hover:bg-[#157347] text-white text-xs font-bold px-4 py-2.5 rounded shadow-xs flex items-center space-x-1.5 transition"
                  >
                    <Play className="w-4 h-4" />
                    <span>Resume Exam</span>
                  </button>
                )}

                {/* 6.3 Add Time (+10 Mins, +15 Mins) */}
                {(session?.status === 'live' || session?.status === 'paused') && (
                  <>
                    <button
                      onClick={() => handleHostAction('add_time', { minutes: 10 })}
                      disabled={actionLoading}
                      className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-3.5 py-2.5 rounded shadow-xs flex items-center space-x-1 transition"
                    >
                      <PlusCircle className="w-4 h-4" />
                      <span>+10 Mins</span>
                    </button>
                    <button
                      onClick={() => handleHostAction('add_time', { minutes: 15 })}
                      disabled={actionLoading}
                      className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-3.5 py-2.5 rounded shadow-xs flex items-center space-x-1 transition"
                    >
                      <PlusCircle className="w-4 h-4" />
                      <span>+15 Mins</span>
                    </button>
                  </>
                )}

                {/* 6.4 Broadcast Notice */}
                <button
                  onClick={() => setShowBroadcastModal(true)}
                  className="bg-[#02529c] hover:bg-blue-800 text-white text-xs font-bold px-4 py-2.5 rounded shadow-xs flex items-center space-x-1.5 transition cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                  <span>Broadcast Notice</span>
                </button>

                {/* 6.5 Close Session */}
                {session?.status !== 'ended' && (
                  <button
                    onClick={() => setShowCloseConfirmModal(true)}
                    disabled={actionLoading}
                    className="bg-red-700 hover:bg-red-800 text-white text-xs font-bold px-4 py-2.5 rounded shadow-xs flex items-center space-x-1.5 transition ml-auto"
                  >
                    <StopCircle className="w-4 h-4" />
                    <span>Close Session</span>
                  </button>
                )}


              </div>
            </div>

            {/* 7. Real-Time Host KPIs */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              <div className="bg-white p-4 rounded-lg border border-gray-300 shadow-xs">
                <span className="text-[11px] font-bold text-gray-500 uppercase">Total Candidates</span>
                <div className="text-2xl font-black text-gray-900 mt-1">{totalCandidates}</div>
              </div>

              <div className="bg-white p-4 rounded-lg border border-gray-300 shadow-xs">
                <span className="text-[11px] font-bold text-emerald-600 uppercase">Active Testing</span>
                <div className="text-2xl font-black text-emerald-700 mt-1">{activeCandidates}</div>
              </div>

              <div className="bg-white p-4 rounded-lg border border-gray-300 shadow-xs">
                <span className="text-[11px] font-bold text-blue-600 uppercase">Submitted</span>
                <div className="text-2xl font-black text-blue-800 mt-1">{submittedCandidates}</div>
              </div>

              <div className="bg-white p-4 rounded-lg border border-gray-300 shadow-xs">
                <span className="text-[11px] font-bold text-red-600 uppercase">Anti-Cheat Warnings</span>
                <div className="text-2xl font-black text-red-700 mt-1">{totalWarnings}</div>
              </div>

              <div className="bg-white p-4 rounded-lg border border-gray-300 shadow-xs col-span-2 md:col-span-1">
                <span className="text-[11px] font-bold text-gray-500 uppercase">Remaining Time</span>
                <div className="text-2xl font-black font-mono text-red-600 mt-1">
                  {formatTimer(session?.remainingSeconds || 0)}
                </div>
              </div>
            </div>

            {/* Live Monitoring Table & Live Alerts Panel */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Candidate Monitoring Table */}
              <div className="lg:col-span-2 bg-white rounded-lg border border-gray-300 shadow-xs overflow-hidden flex flex-col">
                <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 flex items-center justify-between">
                  <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wide">
                    Live Candidates Monitoring ({candidates.length})
                  </h3>
                  <button
                    onClick={() => fetchSessionData()}
                    className="text-xs text-blue-600 hover:text-blue-800 font-semibold flex items-center space-x-1"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>Refresh</span>
                  </button>
                </div>

                <div className="overflow-x-auto max-h-[460px] overflow-y-auto">
                  <table className="w-full text-left text-xs text-gray-800">
                    <thead className="bg-gray-100 text-gray-600 uppercase font-semibold text-[11px] sticky top-0">
                      <tr>
                        <th className="py-2.5 px-3">Candidate Name</th>
                        <th className="py-2.5 px-3">Roll Number</th>
                        <th className="py-2.5 px-3">Connection Status</th>
                        <th className="py-2.5 px-3">Submission Status</th>
                        <th className="py-2.5 px-3">Warning Count</th>
                        <th className="py-2.5 px-3">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {candidates.length > 0 ? (
                        candidates.map((c) => {
                          const connStatus = c.connectionStatus || (c.connected ? 'joined' : 'disconnected');
                          const subStatus = c.submitted
                            ? (c.submissionType === 'auto_timeout' || c.submissionType === 'host_close' ? 'Auto-Submitted' : 'Submitted')
                            : (Object.keys(c.answers || {}).length > 0 ? 'In Progress' : 'Not Started');

                          return (
                            <tr key={c.rollNo} className="hover:bg-gray-50">
                              <td className="py-2 px-3 font-medium">{c.name}</td>
                              <td className="py-2 px-3 font-mono font-bold text-blue-900">{c.rollNo}</td>
                              <td className="py-2 px-3">
                                {connStatus === 'joined' && (
                                  <span className="bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded text-[10px]">Joined</span>
                                )}
                                {connStatus === 'disconnected' && (
                                  <span className="bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded text-[10px]">Disconnected</span>
                                )}
                                {connStatus === 'left' && (
                                  <span className="bg-gray-200 text-gray-700 font-bold px-2 py-0.5 rounded text-[10px]">Left</span>
                                )}
                                {connStatus === 'removed' && (
                                  <span className="bg-red-100 text-red-800 font-bold px-2 py-0.5 rounded text-[10px]">Removed</span>
                                )}
                              </td>
                              <td className="py-2 px-3">
                                {subStatus === 'Submitted' && (
                                  <span className="bg-green-100 text-green-800 font-bold px-2 py-0.5 rounded text-[10px]">Submitted</span>
                                )}
                                {subStatus === 'Auto-Submitted' && (
                                  <span className="bg-blue-100 text-blue-800 font-bold px-2 py-0.5 rounded text-[10px]">Auto-Submitted</span>
                                )}
                                {subStatus === 'In Progress' && (
                                  <span className="text-emerald-600 font-semibold text-[11px]">In Progress</span>
                                )}
                                {subStatus === 'Not Started' && (
                                  <span className="text-gray-500 text-[11px]">Not Started</span>
                                )}
                              </td>
                              <td className="py-2 px-3">
                                {c.warningCount > 0 ? (
                                  <span className="bg-red-100 text-red-700 font-bold px-2 py-0.5 rounded text-[11px]">
                                    {c.warningCount} Alerts
                                  </span>
                                ) : (
                                  <span className="text-gray-400">0</span>
                                )}
                              </td>
                              <td className="py-2 px-3">
                                {connStatus !== 'left' && connStatus !== 'removed' && (
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveCandidate(c.rollNo, c.name)}
                                    className="bg-red-600 hover:bg-red-700 text-white text-[10px] font-bold px-2.5 py-1 rounded transition shadow-xs cursor-pointer"
                                  >
                                    Remove
                                  </button>
                                )}
                              </td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr>
                          <td colSpan={6} className="py-8 text-center text-gray-500">
                            No candidates have joined this session yet. Share the session ID or link!
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* 8. Anti-Cheating & Audit Log Stream */}
              <div className="bg-white rounded-lg border border-gray-300 shadow-xs flex flex-col overflow-hidden">
                <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 flex items-center justify-between">
                  <div className="flex items-center space-x-1.5">
                    <ShieldAlert className="w-4 h-4 text-red-600" />
                    <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wide">
                      Live Proctoring & Alerts Feed
                    </h3>
                  </div>
                </div>

                <div className="flex-1 p-3 overflow-y-auto max-h-[460px] space-y-2 text-xs">
                  {auditLogs.map((log) => (
                    <div
                      key={log.id}
                      className={`p-2.5 rounded border text-[11px] leading-relaxed ${
                        log.type === 'warning'
                          ? 'bg-red-50 border-red-200 text-red-900 font-medium'
                          : log.type === 'start' || log.type === 'resume'
                          ? 'bg-green-50 border-green-200 text-green-900'
                          : log.type === 'broadcast'
                          ? 'bg-blue-50 border-blue-200 text-blue-900 font-medium'
                          : 'bg-gray-50 border-gray-200 text-gray-700'
                      }`}
                    >
                      <div className="flex justify-between items-center mb-1 text-[10px] text-gray-500">
                        <span className="font-semibold uppercase">{log.type}</span>
                        <span>{new Date(log.timestamp).toLocaleTimeString()}</span>
                      </div>
                      <div>{log.message}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}



        {/* TAB 3: RESULTS EVALUATION & PDF REPORT */}
        {activeTab === 'results' && (
          <div className="space-y-4">
            <div className="bg-white rounded-lg p-5 border border-gray-300 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-gray-900">Official Results & PDF Generation</h2>
                <p className="text-xs text-gray-600">
                  Detailed candidate scorecards, ranking table, and exportable PDF examination reports.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <button
                  onClick={handleDownloadPDF}
                  className="bg-[#02529c] hover:bg-blue-800 text-white text-xs font-bold px-4 py-2.5 rounded shadow-xs flex items-center space-x-1.5 transition"
                >
                  <Download className="w-4 h-4" />
                  <span>Download Master PDF Report</span>
                </button>


              </div>
            </div>

            {/* Candidate Results Table */}
            <div className="bg-white rounded-lg border border-gray-300 shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-gray-800">
                  <thead className="bg-[#f4f6f9] text-gray-700 font-bold text-[11px] uppercase border-b border-gray-200">
                    <tr>
                      <th className="py-3 px-3">#</th>
                      <th className="py-3 px-3">Roll No</th>
                      <th className="py-3 px-3">Candidate Name</th>
                      <th className="py-3 px-3">Attempted</th>
                      <th className="py-3 px-3">Correct</th>
                      <th className="py-3 px-3">Incorrect</th>
                      <th className="py-3 px-3">Unanswered</th>
                      <th className="py-3 px-3">Score</th>
                      <th className="py-3 px-3">Percentage</th>
                      <th className="py-3 px-3">Status</th>
                      <th className="py-3 px-3">Submitted At</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {candidates.filter(c => c.submitted).length > 0 ? (
                      candidates
                        .filter(c => c.submitted)
                        .sort((a, b) => (b.score || 0) - (a.score || 0))
                        .map((c, idx) => (
                          <tr key={c.rollNo} className="hover:bg-gray-50">
                            <td className="py-2.5 px-3 font-bold text-gray-500">{idx + 1}</td>
                            <td className="py-2.5 px-3 font-mono font-bold text-blue-900">{c.rollNo}</td>
                            <td className="py-2.5 px-3 font-medium">{c.name}</td>
                            <td className="py-2.5 px-3">{Object.keys(c.answers || {}).length}</td>
                            <td className="py-2.5 px-3 text-emerald-600 font-bold">{c.correctCount || 0}</td>
                            <td className="py-2.5 px-3 text-red-600 font-semibold">{c.incorrectCount || 0}</td>
                            <td className="py-2.5 px-3 text-gray-500">{c.unansweredCount || 0}</td>
                            <td className="py-2.5 px-3 font-bold text-gray-900">{c.score || 0}</td>
                            <td className="py-2.5 px-3 font-bold text-[#02529c]">{c.percentage || 0}%</td>
                            <td className="py-2.5 px-3">
                              {(c.percentage || 0) >= 50 ? (
                                <span className="text-emerald-700 bg-emerald-100 font-bold px-2 py-0.5 rounded text-[10px]">
                                  PASS
                                </span>
                              ) : (
                                <span className="text-red-700 bg-red-100 font-bold px-2 py-0.5 rounded text-[10px]">
                                  FAIL
                                </span>
                              )}
                            </td>
                            <td className="py-2.5 px-3 text-gray-500 text-[11px]">
                              {c.submittedAt ? new Date(c.submittedAt).toLocaleTimeString() : 'N/A'}
                            </td>
                          </tr>
                        ))
                    ) : (
                      <tr>
                        <td colSpan={11} className="py-8 text-center text-gray-500">
                          No submissions recorded yet. Once candidates submit, evaluated results and rankings will display here.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Broadcast Notice Modal */}
      {showBroadcastModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-5 shadow-xl border border-gray-200">
            <h3 className="text-sm font-bold text-gray-900 mb-2 flex items-center space-x-1.5">
              <Send className="w-4 h-4 text-[#02529c]" />
              <span>Broadcast Notice to All Students</span>
            </h3>
            <p className="text-xs text-gray-600 mb-3">
              This message will immediately appear as a banner notification on all candidate screens.
            </p>
            <textarea
              rows={3}
              value={broadcastMessage}
              onChange={(e) => setBroadcastMessage(e.target.value)}
              placeholder="e.g. You have 15 minutes remaining. Please review your answers."
              className="w-full p-2.5 text-xs bg-white border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
            />
            <div className="mt-4 flex justify-end space-x-2">
              <button
                type="button"
                onClick={() => setShowBroadcastModal(false)}
                className="px-3 py-1.5 border border-gray-300 text-xs font-semibold rounded text-gray-700 hover:bg-gray-100 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSendBroadcast}
                className="px-4 py-1.5 bg-[#02529c] hover:bg-blue-800 text-white text-xs font-bold rounded shadow-xs cursor-pointer"
              >
                Send Notice
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Close Session Confirmation Modal */}
      <HostExitConfirmModal
        isOpen={showCloseConfirmModal}
        sessionId={sessionId}
        sessionStatus={session?.status || 'waiting'}
        isClosing={actionLoading}
        onCancel={() => setShowCloseConfirmModal(false)}
        onConfirmClose={async () => {
          await handleHostAction('close');
          setShowCloseConfirmModal(false);
        }}
      />

      {/* Remove Student Confirmation Modal */}
      {candidateToRemove && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs animate-fade-in">
          <div 
            className="bg-white rounded-xl max-w-md w-full p-6 shadow-2xl border border-gray-200 transform transition-all"
            role="dialog"
            aria-modal="true"
            aria-labelledby="remove-modal-title"
          >
            <div className="flex items-start space-x-3 mb-4">
              <div className="p-2.5 rounded-xl bg-red-100 text-red-600 shrink-0">
                <UserX className="w-6 h-6" />
              </div>
              <div>
                <h2 id="remove-modal-title" className="text-lg font-extrabold text-gray-900 leading-tight">
                  Remove Student?
                </h2>
                <p className="text-xs text-gray-500 font-mono mt-0.5">
                  Active Session: <strong className="text-blue-900">{sessionId}</strong>
                </p>
              </div>
            </div>

            <div className="mb-6 text-sm text-gray-700 leading-relaxed font-medium">
              Are you sure you want to remove <strong className="text-gray-900">{candidateToRemove.name}</strong> (Roll No. <strong className="text-blue-900">{candidateToRemove.rollNo}</strong>) from this examination session?
            </div>

            <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={() => setCandidateToRemove(null)}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs md:text-sm rounded-lg transition cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={actionLoading}
                onClick={async () => {
                  const target = candidateToRemove;
                  setCandidateToRemove(null);
                  await handleHostAction('remove_candidate', { rollNo: target.rollNo });
                }}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold text-xs md:text-sm rounded-lg transition shadow-xs flex items-center space-x-1.5 cursor-pointer disabled:opacity-50"
              >
                <UserX className="w-4 h-4" />
                <span>Remove Student</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
