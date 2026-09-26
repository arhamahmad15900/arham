import React from 'react';
import { 
  MonitorCheck, 
  GraduationCap, 
  ArrowRight, 
  Clock, 
  FileSpreadsheet, 
  Search, 
  CheckCircle2, 
  ShieldAlert,
  Layers
} from 'lucide-react';
import { Logo } from './Logo.tsx';

interface HomepageProps {
  onNavigateToHost: () => void;
  onNavigateToJoin: () => void;
  onNavigateToResults: () => void;
}

export const Homepage: React.FC<HomepageProps> = ({
  onNavigateToHost,
  onNavigateToJoin,
  onNavigateToResults
}) => {
  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-800 flex flex-col font-sans select-none">
      {/* Top Header */}
      <header className="bg-white border-b border-slate-200 px-4 sm:px-6 md:px-10 py-3 flex items-center justify-between sticky top-0 z-30 shadow-xs">
        <div className="flex items-center space-x-3 min-w-0">
          <Logo size="md" className="shrink-0" />
          <div className="min-w-0">
            <h1 className="font-extrabold text-slate-900 text-sm sm:text-base md:text-lg leading-tight tracking-tight truncate">
              Access Computer Education Center
            </h1>
            <div className="text-xs text-slate-500 font-medium leading-tight truncate mt-0.5">
              Computer Based Test (CBT) Portal • Developed by Majid Ali
            </div>
          </div>
        </div>

        {/* Header Action Nav */}
        <div className="flex items-center space-x-2 sm:space-x-3 shrink-0">
          <button
            type="button"
            onClick={onNavigateToJoin}
            className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 rounded-md text-xs font-semibold bg-[#15803d] hover:bg-[#166534] text-white transition shadow-xs cursor-pointer"
          >
            <GraduationCap className="w-3.5 h-3.5" />
            <span>Join Test</span>
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col items-center px-4 py-10 sm:py-14 md:py-16 max-w-5xl mx-auto w-full">
        {/* Editorial Eyebrow */}
        <div className="text-xs font-bold tracking-wider text-slate-500 uppercase mb-3 flex items-center space-x-2">
          <span>Official Assessment Portal</span>
          <span aria-hidden="true" className="text-slate-300">•</span>
          <span className="text-[#02529c]">Access Computer Education Center</span>
        </div>

        {/* Hero Title */}
        <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-[42px] font-black text-slate-900 text-center tracking-tight leading-tight max-w-3xl mb-4">
          Computer Exam Practice and Online Testing
        </h2>

        {/* Supporting Text */}
        <p className="text-sm sm:text-base text-slate-600 text-center max-w-2xl mb-10 md:mb-12 leading-relaxed">
          Practice MCQ-based examinations, participate in teacher-hosted live tests, and inspect verified answer scorecards. Engineered for students, candidates, and faculty members of Access Computer Education Center.
        </p>

        {/* Primary Portals Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-6 w-full max-w-3xl mb-12">
          {/* Card 1: Host Test */}
          <div
            onClick={onNavigateToHost}
            className="bg-white rounded-lg p-6 sm:p-7 border border-slate-200 hover:border-[#02529c] shadow-xs hover:shadow-md transition-all flex flex-col cursor-pointer group"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-md bg-blue-50 text-[#02529c] flex items-center justify-center border border-blue-100">
                <MonitorCheck className="w-6 h-6" />
              </div>
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Examiner & Faculty
              </span>
            </div>

            <h3 className="text-xl font-bold text-slate-900 mb-2 group-hover:text-[#02529c] transition-colors">
              Host Test
            </h3>

            <p className="text-xs sm:text-sm text-slate-600 mb-6 leading-relaxed flex-1">
              Create and launch synchronized computer-based examinations. Extract questions from PDF question papers, control the countdown timer, monitor candidate progress in real time, and export master ranking sheets.
            </p>

            <button
              type="button"
              className="w-full py-2.5 px-4 bg-[#02529c] hover:bg-[#024482] text-white font-semibold text-xs sm:text-sm rounded-md transition flex items-center justify-center space-x-2 shadow-xs cursor-pointer"
            >
              <span>Create Examination</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>

          {/* Card 2: Join Test */}
          <div
            onClick={onNavigateToJoin}
            className="bg-white rounded-lg p-6 sm:p-7 border border-slate-200 hover:border-[#15803d] shadow-xs hover:shadow-md transition-all flex flex-col cursor-pointer group"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-md bg-emerald-50 text-[#15803d] flex items-center justify-center border border-emerald-100">
                <GraduationCap className="w-6 h-6" />
              </div>
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Candidate & Student
              </span>
            </div>

            <h3 className="text-xl font-bold text-slate-900 mb-2 group-hover:text-[#15803d] transition-colors">
              Join Test
            </h3>

            <p className="text-xs sm:text-sm text-slate-600 mb-6 leading-relaxed flex-1">
              Connect to an active examination session using your 6-digit Session ID and Roll Number. Take your test inside the authentic CBT environment with question palette navigation and automatic submission.
            </p>

            <button
              type="button"
              className="w-full py-2.5 px-4 bg-[#15803d] hover:bg-[#166534] text-white font-semibold text-xs sm:text-sm rounded-md transition flex items-center justify-center space-x-2 shadow-xs cursor-pointer"
            >
              <span>Enter Examination</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>
        </div>



        {/* Platform Architecture & Features */}
        <div className="w-full max-w-4xl">
          <div className="text-center mb-6">
            <h3 className="text-base font-bold text-slate-900 uppercase tracking-wider">
              Examination Platform Capabilities
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Purposefully designed for computer science examinations, certifications, and institutional assessments.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs">
              <div className="w-8 h-8 rounded-md bg-blue-50 text-[#02529c] flex items-center justify-center mb-3">
                <Clock className="w-4 h-4" />
              </div>
              <h4 className="text-xs font-bold text-slate-900 mb-1">Synchronized Timer</h4>
              <p className="text-[11px] text-slate-600 leading-normal">
                Host-controlled authoritative countdown with pause, resume, and overtime controls.
              </p>
            </div>

            <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs">
              <div className="w-8 h-8 rounded-md bg-emerald-50 text-[#15803d] flex items-center justify-center mb-3">
                <Layers className="w-4 h-4" />
              </div>
              <h4 className="text-xs font-bold text-slate-900 mb-1">Standard Question Palette</h4>
              <p className="text-[11px] text-slate-600 leading-normal">
                Authentic color-coded state tracking matching NIELIT and NTA national examination portals.
              </p>
            </div>

            <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs">
              <div className="w-8 h-8 rounded-md bg-amber-50 text-amber-700 flex items-center justify-center mb-3">
                <ShieldAlert className="w-4 h-4" />
              </div>
              <h4 className="text-xs font-bold text-slate-900 mb-1">Focus & Integrity Guard</h4>
              <p className="text-[11px] text-slate-600 leading-normal">
                Monitors window focus loss, tab switching, and keyboard shortcuts with candidate audit logging.
              </p>
            </div>

            <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs">
              <div className="w-8 h-8 rounded-md bg-slate-100 text-slate-700 flex items-center justify-center mb-3">
                <FileSpreadsheet className="w-4 h-4" />
              </div>
              <h4 className="text-xs font-bold text-slate-900 mb-1">Comprehensive PDF Reports</h4>
              <p className="text-[11px] text-slate-600 leading-normal">
                Instant master ranking lists, pass/fail statistics, and downloadable candidate mark sheets.
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-6 px-4 text-center text-xs text-slate-500">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <p>© {new Date().getFullYear()} Access Computer Education Center. Developed by Majid Ali. All rights reserved.</p>
          <div className="flex items-center space-x-5">
            <button onClick={onNavigateToHost} className="hover:text-[#02529c] font-medium transition-colors cursor-pointer">
              Host Test
            </button>
            <button onClick={onNavigateToJoin} className="hover:text-[#15803d] font-medium transition-colors cursor-pointer">
              Join Test
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
};
