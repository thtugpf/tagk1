export type UnitId = 'unit-1' | 'unit-2' | 'unit-3';

export interface VocabItem {
  id: string;
  unitId: UnitId;
  unitTitle: string;
  term: string;
  partOfSpeech: string;
  meaningVi: string;
  collocationOrExample: string;
}

export interface GrammarPoint {
  id: string;
  unitId: UnitId;
  unitTitle: string;
  title: string;
  sectionSubtitle?: string;
  contentLines: string[];
  formulas: string[];
  examples: string[];
  notes?: string[];
  isSentenceStructure?: boolean;
}

export interface SentenceStructureItem {
  id: string;
  unitId: UnitId;
  unitTitle: string;
  name: string;
  formula: string;
  usageOrExplanation: string[];
  examples: string[];
  linkedGrammarId: string;
}

export type AnswerChoice = 'A' | 'B' | 'C' | 'D';

export interface ExamOption {
  label: AnswerChoice;
  text: string;
}

export interface ExamPassage {
  id: string;
  title?: string;
  instruction: string;
  paragraphs: string[];
  bulletItems?: string[];
  extractionWarning?: string;
}

export interface ExamQuestion {
  id: string;
  examId: string;
  number: number;
  sectionInstruction?: string;
  passageId?: string;
  stem: string;
  subLines?: string[];
  options: ExamOption[];
  isVerified: boolean;
  verifiedAnswer: AnswerChoice | null;
  verificationBasis: string;
  relatedTopicTitle?: string;
  extractionIssue?: string;
  hintVi: string;
  hasNoCorrectOptionInSource?: boolean;
  suggestedReplacementVi?: string;
}

export interface TheoryQuizQuestion {
  id: string;
  category: 'vocab' | 'grammar' | 'structure';
  unitTitle: string;
  number: number;
  stem: string;
  options: ExamOption[];
  correctAnswer: AnswerChoice;
  explanationVi: string;
  hintVi: string;
}

export interface ExamPaper {
  id: string;
  title: string;
  sourceSubtitle: string;
  totalQuestions: number;
  verifiedCount: number;
  unverifiedCount: number;
  passages: Record<string, ExamPassage>;
  questions: ExamQuestion[];
  extractionNotes: string[];
}

export type PracticeMode = 'practice' | 'mock';

export type QuestionConfirmState = {
  selectedChoice: AnswerChoice;
  confirmed: boolean;
  isCorrectFirstTry: boolean | null; // null if no valid option in source
  isVerified: boolean;
};

export interface DraftSession {
  id: string;
  examId: string;
  examTitle: string;
  mode: PracticeMode;
  currentQuestionIndex: number;
  selectedAnswers: Record<string, AnswerChoice>;
  confirmedQuestions: Record<string, QuestionConfirmState>; // used in 'practice' mode
  elapsedSeconds: number;
  startedAt: string;
  updatedAt: string;
}

export interface AttemptHistoryRecord {
  id: string;
  examId: string;
  examTitle: string;
  mode: PracticeMode;
  completedAt: string;
  elapsedSeconds: number;
  totalQuestions: number;
  verifiedGradableCount: number;
  unverifiedCount: number;
  answeredCount: number;
  unansweredCount: number;
  correctCount: number;
  incorrectCount: number;
  scoreOutOf10: number | null; // calculated over verifiedGradableCount
  accuracyPercent: number | null;
  isFullyVerifiedExam: boolean;
  selectedAnswers: Record<string, AnswerChoice>;
  firstTryResults?: Record<string, boolean | null>;
}

export type FlashcardReviewStatus = 'unmarked' | 'reviewed' | 'needs_review';

export interface StudyProgressState {
  vocabStatus: Record<string, FlashcardReviewStatus>;
  viewedVocabIds: string[];
  lastVocabUnitFilter: UnitId | 'all';
  lastVocabIndex: number;
  reviewedGrammarIds: string[];
  reviewedStructureIds: string[];
  totalStudySeconds: number;
}

export interface UserSettings {
  fontSize: 'normal' | 'large';
  autoSaveDraft: boolean;
  showSourceNotes: boolean;
}

export type AppView =
  | 'home'
  | 'theory'
  | 'flashcards'
  | 'grammar'
  | 'structures'
  | 'exam'
  | 'drafts'
  | 'history'
  | 'stats'
  | 'settings';
