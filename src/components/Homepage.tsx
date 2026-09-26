import React from 'react';
import { MonitorCheck, GraduationCap, ArrowRight, Shield, Award, Sparkles, BookOpen, CheckCircle, FileText, Clock, Bug } from 'lucide-react';

interface HomepageProps {
  onNavigateToHost: () => void;
  onNavigateToJoin: () => void;
  onNavigateToResults: () => void;
  onNavigateToBugReport: () => void;
}

export const Homepage: React.FC<HomepageProps> = ({
  onNavigateToHost,
  onNavigateToJoin,
  onNavigateToResults,
  onNavigateToBugReport
}) => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#f4f7fb] to-[#eaf0f8] flex flex-col font-sans select-none">
      {/* Top Header */}
      <header className="bg-white border-b border-gray-200 px-4 md:px-8 py-3.5 flex items-center justify-between sticky top-0 z-30 shadow-xs">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-lg bg-[#02529c] text-white font-black flex items-center justify-center text-lg shadow-sm">
            ACE
          </div>
          <div>
            <div className="font-extrabold text-gray-900 text-base md:text-lg leading-tight tracking-tight">
              Access Computer Education Center
            </div>
            <div className="text-xs text-blue-800 font-medium">Computer Based Test (CBT) Examination Portal • Developed by Majid Ali</div>
          </div>
        </div>

        <button
          onClick={onNavigateToBugReport}
          className="px-3.5 py-1.5 rounded-lg text-xs font-bold bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 transition flex items-center space-x-1.5 shadow-2xs shrink-0 cursor-pointer"
        >
          <Bug className="w-4 h-4 text-amber-700" />
          <span>Report a Bug</span>
        </button>
      </header>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-8 md:py-14 max-w-5xl mx-auto w-full">
        {/* Hero Title */}
        <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-extrabold text-gray-900 text-center tracking-tight leading-tight max-w-3xl mb-4">
          Online Computer-Based Testing System
        </h1>

        {/* Subtitle */}
        <p className="text-sm md:text-base text-gray-600 text-center max-w-2xl mb-8 md:mb-12 leading-relaxed">
          Welcome to the official assessment platform of <strong className="text-gray-800">Access Computer Education Center</strong>. 
          Generate tests automatically from PDFs with OpenRouter AI, conduct synchronized examinations, and monitor candidates in real time.
        </p>

        {/* Two Main Cards Grid (Matching Section 1 requirements) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-8 w-full max-w-3xl mb-12">
          {/* Card 1: Host Test (Examiner) */}
          <div
            onClick={onNavigateToHost}
            className="group bg-white rounded-2xl p-6 md:p-8 border-2 border-transparent hover:border-blue-500 shadow-md hover:shadow-xl transition-all duration-200 flex flex-col items-center text-center cursor-pointer relative overflow-hidden"
          >
            <div className="w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-blue-50 text-[#2563EB] flex items-center justify-center mb-5 group-hover:scale-105 transition-transform duration-200 shadow-inner">
              <MonitorCheck className="w-9 h-9 md:w-11 md:h-11" />
            </div>

            <span className="text-[11px] font-bold uppercase tracking-wider text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-full mb-2">
              Examiner & Teacher Portal
            </span>

            <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
              Host Test
            </h2>

            <p className="text-xs md:text-sm text-gray-600 mb-6 leading-relaxed max-w-xs">
              Upload PDF question papers, generate tests with OpenRouter AI, control exam timers, and monitor live candidates.
            </p>

            <button
              type="button"
              className="mt-auto w-full py-3 px-6 bg-[#02529c] hover:bg-blue-700 text-white font-bold text-sm rounded-xl transition flex items-center justify-center space-x-2 shadow-sm group-hover:shadow"
            >
              <span>Create Examination</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>

          {/* Card 2: Join Test (Student) */}
          <div
            onClick={onNavigateToJoin}
            className="group bg-white rounded-2xl p-6 md:p-8 border-2 border-transparent hover:border-green-500 shadow-md hover:shadow-xl transition-all duration-200 flex flex-col items-center text-center cursor-pointer relative overflow-hidden"
          >
            <div className="w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-green-50 text-[#16A34A] flex items-center justify-center mb-5 group-hover:scale-105 transition-transform duration-200 shadow-inner">
              <GraduationCap className="w-9 h-9 md:w-11 md:h-11" />
            </div>

            <span className="text-[11px] font-bold uppercase tracking-wider text-green-700 bg-green-50 px-2.5 py-0.5 rounded-full mb-2">
              Student & Candidate Portal
            </span>

            <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-2 group-hover:text-green-600 transition-colors">
              Join Test
            </h2>

            <p className="text-xs md:text-sm text-gray-600 mb-6 leading-relaxed max-w-xs">
              Join an online examination session using your Session ID or direct link. Take the test in the official CBT interface.
            </p>

            <button
              type="button"
              className="mt-auto w-full py-3 px-6 bg-[#16A34A] hover:bg-green-700 text-white font-bold text-sm rounded-xl transition flex items-center justify-center space-x-2 shadow-sm group-hover:shadow"
            >
              <span>Enter Examination</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>

        {/* Feature Highlights Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 w-full max-w-4xl text-left">
          <div className="bg-white/80 backdrop-blur-xs p-3.5 rounded-xl border border-gray-200 shadow-2xs">
            <div className="flex items-center space-x-2 text-blue-700 mb-1">
              <Sparkles className="w-4 h-4 shrink-0" />
              <span className="text-xs font-bold">OpenRouter AI</span>
            </div>
            <p className="text-[11px] text-gray-600">Instant PDF-to-MCQ test generation with answer keys.</p>
          </div>

          <div className="bg-white/80 backdrop-blur-xs p-3.5 rounded-xl border border-gray-200 shadow-2xs">
            <div className="flex items-center space-x-2 text-green-700 mb-1">
              <Clock className="w-4 h-4 shrink-0" />
              <span className="text-xs font-bold">CBT Interface</span>
            </div>
            <p className="text-[11px] text-gray-600">Authentic NTA/NIELIT question palette & server timer.</p>
          </div>

          <div className="bg-white/80 backdrop-blur-xs p-3.5 rounded-xl border border-gray-200 shadow-2xs">
            <div className="flex items-center space-x-2 text-purple-700 mb-1">
              <Shield className="w-4 h-4 shrink-0" />
              <span className="text-xs font-bold">Anti-Cheat Alerts</span>
            </div>
            <p className="text-[11px] text-gray-600">Real-time tab switch & browser focus-loss detection.</p>
          </div>

          <div className="bg-white/80 backdrop-blur-xs p-3.5 rounded-xl border border-gray-200 shadow-2xs">
            <div className="flex items-center space-x-2 text-amber-700 mb-1">
              <FileText className="w-4 h-4 shrink-0" />
              <span className="text-xs font-bold">Official Reports</span>
            </div>
            <p className="text-[11px] text-gray-600">Downloadable master examination PDF ranking sheets.</p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 py-6 px-4 text-center text-xs text-gray-500">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <p>© {new Date().getFullYear()} Access Computer Education Center. Developed by Majid Ali. All rights reserved.</p>
          <div className="flex items-center space-x-4">
            <button onClick={onNavigateToHost} className="hover:text-blue-600 font-medium">Host Test</button>
            <button onClick={onNavigateToJoin} className="hover:text-blue-600 font-medium">Join Test</button>
            <button onClick={onNavigateToBugReport} className="hover:text-amber-700 font-bold text-amber-800 flex items-center space-x-1">
              <Bug className="w-3.5 h-3.5" />
              <span>Report a Bug</span>
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
};
