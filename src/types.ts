export type QuestionStatus = 
  | 'not_visited' 
  | 'not_answered' 
  | 'answered' 
  | 'marked_for_review' 
  | 'answered_and_review';

export interface Question {
  id: number; // 1-based index
  text: string;
  options: string[]; // typically 4 options: ["A. ...", "B. ...", "C. ...", "D. ..."]
  marks: number;
  correctOption?: number; // 0-based index (Examiner/Backend only)
  explanation?: string;
  sourceReference?: string;
  answerStatus?: 'verified' | 'ai_proposed';
}

export interface GeneratedQuestion {
  id: number;
  question: string;
  options: string[];
  correctAnswer: 'A' | 'B' | 'C' | 'D';
  correctOption: number;
  explanation?: string;
  sourceReference?: string;
  answerStatus?: 'verified' | 'ai_proposed';
}

export type ExamStatus = 'waiting' | 'starting' | 'live' | 'paused' | 'ended';

export interface AuditLogEntry {
  id: string;
  timestamp: number;
  type: 'join' | 'leave' | 'warning' | 'start' | 'pause' | 'resume' | 'add_time' | 'broadcast' | 'submit' | 'close' | 'publish';
  candidateName?: string;
  rollNo?: string;
  message: string;
}

export interface CandidateState {
  id: string;
  name: string;
  rollNo: string;
  connected: boolean;
  lastActive: number;
  warningCount: number;
  warnings: { timestamp: number; reason: string }[];
  submitted: boolean;
  submittedAt?: number;
  submissionType?: 'manual' | 'auto_timeout' | 'host_close';
  answers: Record<number, number>; // questionId -> optionIndex (0, 1, 2, 3)
  questionStatuses: Record<number, QuestionStatus>;
  score?: number;
  percentage?: number;
  correctCount?: number;
  incorrectCount?: number;
  unansweredCount?: number;
}

export interface BroadcastNotice {
  id: string;
  message: string;
  timestamp: number;
  examiner: string;
}

export interface ExamSession {
  id: string; // e.g. "ACE-5021"
  testName: string;
  topic: string;
  examinerName: string;
  durationMinutes: number;
  totalQuestions: number;
  marksPerQuestion: number;
  instructions: string[];
  status: ExamStatus;
  resultsPublished: boolean;
  createdAt: number;
  startedAt?: number;
  endTime?: number; // timestamp in ms when exam will conclude
  remainingSeconds: number;
  startingCountdown: number; // 30 down to 0
  broadcastNotice: BroadcastNotice | null;
  candidates: Record<string, CandidateState>;
  auditLogs: AuditLogEntry[];
  questions: Question[];
}

export interface SessionPublicInfo {
  id: string;
  testName: string;
  topic: string;
  examinerName: string;
  durationMinutes: number;
  totalQuestions: number;
  marksPerQuestion: number;
  instructions: string[];
  status: ExamStatus;
  resultsPublished: boolean;
  remainingSeconds: number;
  startingCountdown: number;
  broadcastNotice: BroadcastNotice | null;
  candidateCount: number;
}
