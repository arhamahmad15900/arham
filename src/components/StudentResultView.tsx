import React, { useState } from 'react';
import { Award, CheckCircle, XCircle, Search, Clock, FileText, ChevronDown, ChevronUp } from 'lucide-react';

export const StudentResultView: React.FC<{ initialSessionId?: string }> = ({ initialSessionId = '' }) => {
  const [sessionId, setSessionId] = useState(initialSessionId);
  const [rollNo, setRollNo] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [resultData, setResultData] = useState<any>(null);
  const [showSolutions, setShowSolutions] = useState(false);

  const handleFetchResult = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sessionId.trim() || !rollNo.trim()) {
      setError('Please provide both Session ID and Roll Number');
      return;
    }
    setError('');
    setLoading(true);

    try {
      const res = await fetch(`/api/sessions/${sessionId.trim()}/my-result?rollNo=${encodeURIComponent(rollNo.trim().toUpperCase())}`);
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Unable to retrieve result');
        setResultData(null);
      } else {
        setResultData(data);
      }
    } catch {
      setError('Network error occurred while fetching results');
      setResultData(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f4f6f9] py-8 px-4 flex flex-col items-center">
      <div className="max-w-2xl w-full">
        {/* Header */}
        <div className="bg-[#02529c] text-white rounded-t-lg p-5 text-center shadow-xs">
          <h1 className="text-xl font-bold tracking-wide">ACCESS COMPUTER EDUCATION CENTER</h1>
          <p className="text-xs text-blue-100 uppercase tracking-wider mt-1">Official Student Examination Scorecard</p>
        </div>

        {/* Search Card */}
        <div className="bg-white rounded-b-lg border border-gray-200 p-6 shadow-xs mb-6">
          <form onSubmit={handleFetchResult} className="space-y-4">
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded">
                {error}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Session ID</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. ACE-2026"
                  value={sessionId}
                  onChange={(e) => setSessionId(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-gray-300 rounded text-xs font-mono font-bold uppercase focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Your Roll Number</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 1 or ROLL-101"
                  value={rollNo}
                  onChange={(e) => setRollNo(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-gray-300 rounded text-xs font-mono font-bold uppercase focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#02529c] hover:bg-blue-800 text-white font-bold text-xs py-2.5 rounded transition flex items-center justify-center space-x-1.5 shadow-xs"
            >
              <Search className="w-3.5 h-3.5" />
              <span>{loading ? 'Verifying Results...' : 'View My Scorecard'}</span>
            </button>
          </form>
        </div>

        {/* Result Card */}
        {resultData && (
          <div className="bg-white rounded-lg border border-gray-200 shadow-md overflow-hidden animate-fade-in">
            <div className="bg-gray-50 border-b border-gray-200 p-4 flex justify-between items-center">
              <div>
                <span className="text-xs text-gray-500 font-semibold">Candidate: </span>
                <span className="font-bold text-gray-900 text-sm">{resultData.candidateName}</span>
                <span className="text-xs text-gray-500 font-mono ml-2">(Roll: {resultData.rollNo})</span>
              </div>

              <div className="text-xs">
                {resultData.percentage >= 50 ? (
                  <span className="bg-green-100 text-green-800 font-bold px-2.5 py-1 rounded-full border border-green-300">
                    PASSED
                  </span>
                ) : (
                  <span className="bg-red-100 text-red-800 font-bold px-2.5 py-1 rounded-full border border-red-300">
                    FAILED
                  </span>
                )}
              </div>
            </div>

            <div className="p-6">
              {/* Score Badges */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center mb-6">
                <div className="bg-blue-50 border border-blue-200 rounded p-3">
                  <span className="text-[10px] font-bold text-blue-700 uppercase">Score</span>
                  <div className="text-2xl font-black text-blue-900 mt-0.5">
                    {resultData.score} <span className="text-xs text-gray-500">/ {resultData.maxScore}</span>
                  </div>
                </div>

                <div className="bg-emerald-50 border border-emerald-200 rounded p-3">
                  <span className="text-[10px] font-bold text-emerald-700 uppercase">Percentage</span>
                  <div className="text-2xl font-black text-emerald-900 mt-0.5">
                    {resultData.percentage}%
                  </div>
                </div>

                <div className="bg-green-50 border border-green-200 rounded p-3">
                  <span className="text-[10px] font-bold text-green-700 uppercase">Correct</span>
                  <div className="text-2xl font-black text-green-700 mt-0.5">
                    {resultData.correctAnswers}
                  </div>
                </div>

                <div className="bg-red-50 border border-red-200 rounded p-3">
                  <span className="text-[10px] font-bold text-red-700 uppercase">Incorrect</span>
                  <div className="text-2xl font-black text-red-700 mt-0.5">
                    {resultData.incorrectAnswers}
                  </div>
                </div>
              </div>

              <div className="text-xs text-gray-600 space-y-1.5 border-t border-gray-100 pt-4 mb-4">
                <div className="flex justify-between">
                  <span>Examination:</span>
                  <strong className="text-gray-800">{resultData.testName}</strong>
                </div>
                <div className="flex justify-between">
                  <span>Topic / Subject:</span>
                  <strong className="text-gray-800">{resultData.topic}</strong>
                </div>
                <div className="flex justify-between">
                  <span>Examiner:</span>
                  <strong className="text-gray-800">{resultData.examinerName}</strong>
                </div>
                <div className="flex justify-between">
                  <span>Total Questions:</span>
                  <strong className="text-gray-800">{resultData.totalQuestions}</strong>
                </div>
                <div className="flex justify-between">
                  <span>Unanswered Questions:</span>
                  <strong className="text-gray-800">{resultData.unansweredQuestions}</strong>
                </div>
                <div className="flex justify-between">
                  <span>Submission Time:</span>
                  <strong className="text-gray-800">{resultData.submissionTime}</strong>
                </div>
              </div>

              {/* Toggle Question-by-Question Solution Review */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => setShowSolutions(!showSolutions)}
                  className="w-full py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded flex items-center justify-center space-x-1.5 transition"
                >
                  <span>{showSolutions ? 'Hide Question Solutions' : 'View Question-by-Question Solutions'}</span>
                  {showSolutions ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                </button>
              </div>

              {showSolutions && (
                <div className="mt-4 space-y-3">
                  {resultData.questions.map((q: any, idx: number) => (
                    <div
                      key={q.id}
                      className={`p-3 rounded border text-xs leading-relaxed ${
                        q.isCorrect
                          ? 'bg-green-50/60 border-green-200'
                          : q.selectedOption === null
                          ? 'bg-gray-50 border-gray-200'
                          : 'bg-red-50/60 border-red-200'
                      }`}
                    >
                      <div className="flex justify-between font-bold text-gray-800 mb-1">
                        <span>Q{idx + 1}. {q.text}</span>
                        <span className={`px-1.5 py-0.5 rounded text-[10px] ${
                          q.isCorrect
                            ? 'bg-green-200 text-green-900'
                            : q.selectedOption === null
                            ? 'bg-gray-200 text-gray-800'
                            : 'bg-red-200 text-red-900'
                        }`}>
                          {q.isCorrect ? '+1 Mark' : q.selectedOption === null ? 'Unattempted (0)' : 'Incorrect (0)'}
                        </span>
                      </div>

                      <div className="space-y-1 mt-2 text-[11px]">
                        {q.options.map((opt: string, optIdx: number) => {
                          const isCorrectAns = optIdx === q.correctOption;
                          const isStudentSelected = optIdx === q.selectedOption;
                          return (
                            <div
                              key={optIdx}
                              className={`p-1.5 rounded flex items-center justify-between ${
                                isCorrectAns
                                  ? 'bg-green-100 text-green-900 font-semibold'
                                  : isStudentSelected
                                  ? 'bg-red-100 text-red-900 font-medium'
                                  : 'text-gray-600'
                              }`}
                            >
                              <span>{opt}</span>
                              {isCorrectAns && <span className="text-[10px] text-green-800 font-bold">✓ Correct Answer</span>}
                              {isStudentSelected && !isCorrectAns && <span className="text-[10px] text-red-800 font-bold">✗ Your Choice</span>}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
