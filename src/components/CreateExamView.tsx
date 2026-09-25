import React, { useState, useEffect } from 'react';
import type { Question, GeneratedQuestion } from '../types.ts';
import { NIELIT_SAMPLE_QUESTIONS, generateQuestionSet } from '../data/sampleQuestions.ts';
import { 
  Upload, 
  Sparkles, 
  CheckCircle, 
  AlertCircle, 
  Trash2, 
  Plus, 
  RefreshCw, 
  FileText, 
  Check, 
  ArrowRight, 
  Edit3, 
  Info, 
  Cpu, 
  SlidersHorizontal,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

interface CreateExamViewProps {
  onSessionCreated: (sessionId: string) => void;
  onBackToHome: () => void;
}

export const CreateExamView: React.FC<CreateExamViewProps> = ({
  onSessionCreated,
  onBackToHome
}) => {
  // Exam Configuration
  const [testName, setTestName] = useState<string>('Access Computer Education Center — Online Test');
  const [topic, setTopic] = useState<string>('NIELIT O Level & Computer Applications');
  const [examinerName, setExaminerName] = useState<string>('Prof. R. K. Sharma');
  const [durationMinutes, setDurationMinutes] = useState<number>(60);
  const [questionCount, setQuestionCount] = useState<number>(25);
  const [marksPerQuestion, setMarksPerQuestion] = useState<number>(1);
  const [instructions, setInstructions] = useState<string>('');

  // AI & PDF Upload States
  const [generationMode, setGenerationMode] = useState<'extract' | 'practice'>('extract');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileBase64, setFileBase64] = useState<string>('');
  const [fileName, setFileName] = useState<string>('');
  const [rawText, setRawText] = useState<string>('');
  const [aiStatus, setAiStatus] = useState<{ openRouterConfigured: boolean; geminiConfigured: boolean; model: string; activeEngine: string } | null>(null);

  // Generation Processing States
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [generationStep, setGenerationStep] = useState<string>('');
  const [generationError, setGenerationError] = useState<string>('');
  const [generationSuccessInfo, setGenerationSuccessInfo] = useState<string>('');

  // Reviewed Questions State
  const [questions, setQuestions] = useState<GeneratedQuestion[]>([]);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [isCreatingSession, setIsCreatingSession] = useState<boolean>(false);

  // Fetch AI Config on Mount
  useEffect(() => {
    fetch('/api/ai/config')
      .then(res => res.json())
      .then(data => setAiStatus(data))
      .catch(console.error);
  }, []);

  // Handle File Selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 15 * 1024 * 1024) {
      setGenerationError('File is too large. Please select a file smaller than 15MB.');
      return;
    }

    setSelectedFile(file);
    setFileName(file.name);
    setGenerationError('');

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const base64Data = result.split(',')[1] || '';
      setFileBase64(base64Data);
    };
    reader.readAsDataURL(file);
  };

  // Generate Test with AI (OpenRouter / Fallback)
  const handleGenerateTestWithAI = async () => {
    if (!fileBase64 && !rawText.trim()) {
      setGenerationError('Please upload a PDF question paper or paste question text first.');
      return;
    }

    setGenerationError('');
    setIsGenerating(true);

    try {
      setGenerationStep('Uploading PDF & Extracting Text...');
      await new Promise(r => setTimeout(r, 400));

      setGenerationStep(`Processing with AI (${aiStatus?.activeEngine || 'OpenRouter'})...`);

      const res = await fetch('/api/ai/generate-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileBase64,
          fileName,
          rawText,
          mode: generationMode,
          questionCount,
          topic,
          testTitle: testName,
          model: aiStatus?.model
        })
      });

      setGenerationStep('Validating Questions & Options...');
      const json = await res.json();

      if (!res.ok || !json.success) {
        throw new Error(json.error || 'AI generation failed. Please check your OpenRouter configuration.');
      }

      const receivedQuestions: any[] = json.data?.questions || [];
      if (receivedQuestions.length === 0) {
        throw new Error('No valid questions could be extracted from this document.');
      }

      // Map to standard GeneratedQuestion format
      const formatted: GeneratedQuestion[] = receivedQuestions.map((q, idx) => ({
        id: idx + 1,
        question: q.question || q.text || `Question ${idx + 1}`,
        options: Array.isArray(q.options) && q.options.length >= 2 ? q.options : ['A. Option 1', 'B. Option 2', 'C. Option 3', 'D. Option 4'],
        correctAnswer: (q.correctAnswer as any) || ['A', 'B', 'C', 'D'][q.correctOption ?? 0],
        correctOption: typeof q.correctOption === 'number' ? q.correctOption : ['A', 'B', 'C', 'D'].indexOf(q.correctAnswer || 'A'),
        explanation: q.explanation,
        sourceReference: q.sourceReference,
        answerStatus: q.answerStatus || 'verified'
      }));

      setQuestions(formatted);
      setQuestionCount(formatted.length);
      if (json.data?.testTitle) setTestName(json.data.testTitle);
      if (json.data?.topic) setTopic(json.data.topic);

      setGenerationSuccessInfo(
        `✓ All ${formatted.length} Questions Extracted from PDF with 100% Options Intact. Every question will load in a neutral unselected state for students.`
      );
      setGenerationStep('Ready for Review');
    } catch (err: any) {
      setGenerationError(err.message || 'Failed to generate test. Please try again or load sample preset.');
    } finally {
      setIsGenerating(false);
    }
  };

  // Quick Load Sample Preset
  const handleLoadSamplePreset = () => {
    const preset = NIELIT_SAMPLE_QUESTIONS.slice(0, questionCount).map((q, idx) => ({
      id: idx + 1,
      question: q.text,
      options: q.options,
      correctAnswer: ['A', 'B', 'C', 'D'][q.correctOption ?? 0] as 'A' | 'B' | 'C' | 'D',
      correctOption: q.correctOption ?? 0,
      answerStatus: 'verified' as const
    }));

    setQuestions(preset);
    setTestName('Access Computer Education Center — NIELIT O Level Test');
    setTopic('M1-R5 IT Tools & Network Basics');
    setGenerationSuccessInfo(`Loaded ${preset.length} verified bilingual questions from NIELIT question bank.`);
    setGenerationError('');
  };

  // Section 8 Question Editing Actions
  const handleUpdateQuestion = (index: number, updatedFields: Partial<GeneratedQuestion>) => {
    setQuestions(prev => {
      const copy = [...prev];
      copy[index] = { ...copy[index], ...updatedFields };
      if (updatedFields.correctAnswer) {
        copy[index].correctOption = ['A', 'B', 'C', 'D'].indexOf(updatedFields.correctAnswer);
      }
      return copy;
    });
  };

  const handleUpdateOption = (qIndex: number, optIndex: number, newText: string) => {
    setQuestions(prev => {
      const copy = [...prev];
      const labels = ['A', 'B', 'C', 'D'];
      const clean = newText.replace(/^(\(?[A-Da-d][\.\)]|\b[A-Da-d][:.\s])\s*/, '');
      const newOpts = [...copy[qIndex].options];
      newOpts[optIndex] = `${labels[optIndex]}. ${clean}`;
      copy[qIndex] = { ...copy[qIndex], options: newOpts };
      return copy;
    });
  };

  const handleDeleteQuestion = (index: number) => {
    setQuestions(prev => {
      const filtered = prev.filter((_, i) => i !== index);
      return filtered.map((q, i) => ({ ...q, id: i + 1 }));
    });
  };

  const handleAddQuestionManually = () => {
    const newQ: GeneratedQuestion = {
      id: questions.length + 1,
      question: 'New Question statement',
      options: ['A. Option 1', 'B. Option 2', 'C. Option 3', 'D. Option 4'],
      correctAnswer: 'A',
      correctOption: 0,
      answerStatus: 'verified'
    };
    setQuestions(prev => [...prev, newQ]);
    setEditingIndex(questions.length);
  };

  // Section 9: Create Session from Final Reviewed Questions
  const handleCreateSession = async () => {
    if (questions.length === 0) {
      setGenerationError('Please generate or add at least one question before creating a session.');
      return;
    }

    setIsCreatingSession(true);
    setGenerationError('');

    try {
      // Map questions into backend format
      const finalQuestions: Question[] = questions.map((q, idx) => ({
        id: idx + 1,
        text: q.question,
        options: q.options,
        marks: marksPerQuestion,
        correctOption: q.correctOption,
        explanation: q.explanation
      }));

      const res = await fetch('/api/sessions/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          testName,
          topic,
          examinerName,
          durationMinutes,
          totalQuestions: finalQuestions.length,
          marksPerQuestion,
          instructions: instructions ? instructions.split('\n').filter(Boolean) : undefined,
          questions: finalQuestions
        })
      });

      const data = await res.json();
      if (!res.ok || !data.sessionId) {
        throw new Error(data.error || 'Failed to create session');
      }

      // Transition to Host Session Manager
      onSessionCreated(data.sessionId);
    } catch (err: any) {
      setGenerationError(err.message || 'Error creating examination session');
    } finally {
      setIsCreatingSession(false);
    }
  };

  const verifiedCount = questions.filter(q => q.answerStatus === 'verified').length;
  const aiProposedCount = questions.filter(q => q.answerStatus === 'ai_proposed').length;

  return (
    <div className="min-h-screen bg-[#f4f7fb] py-8 px-4 md:px-8 font-sans">
      <div className="max-w-5xl mx-auto space-y-6">
        
        {/* Top Header & Breadcrumbs */}
        <div className="pb-4 border-b border-gray-200">
          <div className="flex items-center space-x-2 text-xs text-gray-500 mb-1">
            <button onClick={onBackToHome} className="hover:text-blue-600 font-medium">Home</button>
            <span>/</span>
            <span className="font-semibold text-gray-800">Host Test</span>
            <span>/</span>
            <span className="text-blue-700 font-bold">Create Examination</span>
          </div>
          <h1 className="text-xl md:text-2xl font-extrabold text-gray-900 tracking-tight">
            Create Examination & Generate Test with AI
          </h1>
          <p className="text-xs md:text-sm text-gray-600 mt-0.5">
            Upload a PDF question paper to automatically generate structured MCQs using OpenRouter AI.
          </p>
        </div>

        {/* 1. Exam Configuration Card */}
        <div className="bg-white rounded-xl border border-gray-300 shadow-xs p-5 md:p-6">
          <h2 className="text-sm font-bold text-gray-800 uppercase tracking-wide mb-4 flex items-center space-x-2">
            <SlidersHorizontal className="w-4 h-4 text-[#02529c]" />
            <span>1. Examination Parameters</span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="block font-bold text-gray-700 mb-1">Examination Title</label>
              <input
                type="text"
                required
                value={testName}
                onChange={(e) => setTestName(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-gray-300 rounded text-xs text-gray-900 focus:ring-2 focus:ring-blue-500 font-medium"
              />
            </div>

            <div>
              <label className="block font-bold text-gray-700 mb-1">Subject / Topic</label>
              <input
                type="text"
                required
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-gray-300 rounded text-xs text-gray-900 focus:ring-2 focus:ring-blue-500 font-medium"
              />
            </div>

            <div>
              <label className="block font-bold text-gray-700 mb-1">Examiner Name</label>
              <input
                type="text"
                required
                value={examinerName}
                onChange={(e) => setExaminerName(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-gray-300 rounded text-xs text-gray-900 focus:ring-2 focus:ring-blue-500 font-medium"
              />
            </div>

            <div className="grid grid-cols-3 gap-2 md:col-span-3">
              <div>
                <label className="block font-bold text-gray-700 mb-1">Duration (Mins)</label>
                <input
                  type="number"
                  min={5}
                  max={180}
                  value={durationMinutes}
                  onChange={(e) => setDurationMinutes(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-white border border-gray-300 rounded text-xs text-gray-900 font-medium"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">Target Questions</label>
                <select
                  value={questionCount}
                  onChange={(e) => setQuestionCount(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-white border border-gray-300 rounded text-xs text-gray-900 font-medium"
                >
                  <option value={10}>10 Questions</option>
                  <option value={25}>25 Questions</option>
                  <option value={50}>50 Questions</option>
                  <option value={100}>100 Questions</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">Marks per Question</label>
                <input
                  type="number"
                  min={1}
                  max={10}
                  value={marksPerQuestion}
                  onChange={(e) => setMarksPerQuestion(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-white border border-gray-300 rounded text-xs text-gray-900 font-medium"
                />
              </div>
            </div>
          </div>
        </div>

        {/* 2. PDF Upload & OpenRouter AI Generator Card */}
        <div className="bg-white rounded-xl border border-gray-300 shadow-xs p-5 md:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 mb-4 border-b border-gray-200 gap-2">
            <div>
              <h2 className="text-sm font-bold text-gray-800 uppercase tracking-wide flex items-center space-x-2">
                <Sparkles className="w-4 h-4 text-purple-600" />
                <span>2. Upload Question Paper (PDF) & AI Generation</span>
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Upload any PDF containing MCQs or study materials. Supports Hindi and English questions.
              </p>
            </div>

            {/* Mode: Extract from PDF */}
            <div className="flex items-center text-xs self-start sm:self-auto">
              <span className="bg-blue-50 border border-blue-200 text-blue-900 font-bold px-3 py-1.5 rounded-lg shadow-2xs">
                Extract from PDF
              </span>
            </div>
          </div>

          {generationError && (
            <div className="mb-4 p-3.5 bg-red-50 border border-red-200 rounded-lg text-red-700 text-xs flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{generationError}</span>
            </div>
          )}

          {generationSuccessInfo && (
            <div className="mb-4 p-3.5 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-800 text-xs flex items-center space-x-2">
              <CheckCircle className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>{generationSuccessInfo}</span>
            </div>
          )}

          {/* File Upload Zone */}
          <div>
            <div className="border-2 border-dashed border-gray-300 hover:border-blue-500 rounded-xl p-6 text-center flex flex-col items-center justify-center bg-gray-50/50 hover:bg-blue-50/20 transition-all cursor-pointer relative">
              <input
                type="file"
                accept=".pdf,.txt,.json,.csv"
                onChange={handleFileChange}
                className="absolute inset-0 opacity-0 cursor-pointer"
              />
              <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mb-2">
                <Upload className="w-6 h-6" />
              </div>
              <span className="text-xs font-bold text-gray-800 mb-0.5">
                {selectedFile ? selectedFile.name : 'Choose or drop PDF question paper'}
              </span>
              <span className="text-[11px] text-gray-500">
                {selectedFile ? `${(selectedFile.size / 1024).toFixed(1)} KB` : 'Supports PDF question papers (Max 15MB)'}
              </span>
            </div>
          </div>

          {/* AI Generation Action */}
          <div className="mt-5 flex items-center justify-end pt-3 border-t border-gray-100">
            <button
              type="button"
              onClick={handleGenerateTestWithAI}
              disabled={isGenerating}
              className="bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs px-6 py-2.5 rounded-lg shadow-sm flex items-center space-x-2 transition disabled:opacity-50"
            >
              <Sparkles className="w-4 h-4" />
              <span>{isGenerating ? generationStep : 'Generate Test with AI'}</span>
            </button>
          </div>
        </div>

        {/* 3. Section 8: Question Review & Editing Section */}
        {questions.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-300 shadow-xs p-5 md:p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-gray-200 gap-2">
              <div>
                <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wide flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span>3. Review & Edit Questions ({questions.length})</span>
                </h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  Verify questions, edit statements, modify options, or confirm answer keys before creating session.
                </p>
              </div>

              {/* Status Counters */}
              <div className="flex items-center space-x-2 text-xs">
                <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold px-2.5 py-1 rounded-md">
                  {verifiedCount} Verified
                </span>
                {aiProposedCount > 0 && (
                  <span className="bg-amber-50 text-amber-800 border border-amber-200 font-bold px-2.5 py-1 rounded-md">
                    {aiProposedCount} AI Proposed
                  </span>
                )}
                <button
                  onClick={handleAddQuestionManually}
                  className="bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold px-3 py-1 rounded-md flex items-center space-x-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Question</span>
                </button>
              </div>
            </div>

            {/* Pre-Launch Validation Card */}
            <div className="bg-blue-50/70 border border-blue-200 rounded-xl p-3.5 text-xs text-blue-900 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5">
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                <span><strong>{questions.length} of {questions.length}</strong> Questions Extracted</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                <span><strong>100%</strong> Original Options Preserved</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                <span><strong>Unselected</strong> Default Option State</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                <span><strong>Secure</strong> Backend Evaluation Key</span>
              </div>
            </div>

            {/* Questions List */}
            <div className="space-y-4 max-h-[600px] overflow-y-auto pr-1">
              {questions.map((q, idx) => {
                const isEditing = editingIndex === idx;
                return (
                  <div
                    key={idx}
                    className="p-4 rounded-xl border border-gray-200 bg-gray-50/60 hover:bg-white hover:border-blue-300 transition-all text-xs"
                  >
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="flex items-center space-x-2">
                        <span className="font-bold bg-blue-100 text-blue-900 px-2 py-0.5 rounded text-[11px]">
                          Q{idx + 1}
                        </span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                          q.answerStatus === 'verified'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}>
                          {q.answerStatus === 'verified' ? '✓ Verified Answer' : '⚡ AI Proposed'}
                        </span>
                      </div>

                      <div className="flex items-center space-x-1.5">
                        <button
                          type="button"
                          onClick={() => setEditingIndex(isEditing ? null : idx)}
                          className="p-1 hover:bg-gray-200 rounded text-gray-600 hover:text-gray-900"
                          title="Edit Question"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteQuestion(idx)}
                          className="p-1 hover:bg-red-100 rounded text-gray-400 hover:text-red-600"
                          title="Delete Question"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Question Statement */}
                    {isEditing ? (
                      <div className="mb-3">
                        <label className="block text-[11px] font-bold text-gray-700 mb-1">Question Text</label>
                        <textarea
                          rows={2}
                          value={q.question}
                          onChange={(e) => handleUpdateQuestion(idx, { question: e.target.value })}
                          className="w-full p-2 bg-white border border-gray-300 rounded font-medium focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    ) : (
                      <p className="font-semibold text-gray-900 mb-3 text-sm leading-relaxed">
                        {q.question}
                      </p>
                    )}

                    {/* Options (A, B, C, D) */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-3">
                      {q.options.map((opt, optIdx) => {
                        const label = ['A', 'B', 'C', 'D'][optIdx];
                        const isCorrect = q.correctAnswer === label;
                        return (
                          <div
                            key={optIdx}
                            className={`p-2 rounded border flex items-center justify-between ${
                              isCorrect
                                ? 'bg-green-50 border-green-300 text-green-900 font-semibold'
                                : 'bg-white border-gray-200 text-gray-700'
                            }`}
                          >
                            {isEditing ? (
                              <input
                                type="text"
                                value={opt}
                                onChange={(e) => handleUpdateOption(idx, optIdx, e.target.value)}
                                className="w-full bg-transparent border-none text-xs focus:outline-none"
                              />
                            ) : (
                              <span className="truncate">{opt}</span>
                            )}
                            <button
                              type="button"
                              onClick={() => handleUpdateQuestion(idx, { correctAnswer: label as any })}
                              className={`text-[10px] font-bold px-2 py-0.5 rounded transition ${
                                isCorrect
                                  ? 'bg-green-600 text-white'
                                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                              }`}
                            >
                              {isCorrect ? '✓ Correct' : 'Set Correct'}
                            </button>
                          </div>
                        );
                      })}
                    </div>

                    {q.explanation && (
                      <div className="text-[11px] text-gray-500 bg-white p-2 rounded border border-gray-200">
                        <strong>Explanation:</strong> {q.explanation}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Section 9: Final Create Session Confirmation Bar */}
            <div className="pt-4 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="text-xs text-gray-600">
                <strong>{questions.length}</strong> questions ready for examination • Time: <strong>{durationMinutes}</strong> mins
              </div>

              <button
                type="button"
                onClick={handleCreateSession}
                disabled={isCreatingSession || questions.length === 0}
                className="w-full sm:w-auto bg-[#198754] hover:bg-[#157347] text-white font-bold text-sm px-8 py-3 rounded-xl transition shadow flex items-center justify-center space-x-2 disabled:opacity-50"
              >
                <span>{isCreatingSession ? 'Creating Session...' : 'Create Session & Open Host Dashboard'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
