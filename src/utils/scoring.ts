import {
  AnswerChoice,
  AttemptHistoryRecord,
  ExamPaper,
  ExamQuestion,
  PracticeMode,
  QuestionConfirmState,
} from '../types';

export interface QuestionGradingDetail {
  questionId: string;
  questionNumber: number;
  selectedChoice: AnswerChoice | null;
  verifiedAnswer: AnswerChoice | null;
  isVerified: boolean;
  status: 'correct' | 'incorrect' | 'unanswered' | 'unverified';
}

export interface ExamEvaluationSummary {
  totalQuestions: number;
  verifiedGradableCount: number;
  unverifiedCount: number;
  answeredCount: number;
  unansweredCount: number;
  correctCount: number;
  incorrectCount: number;
  unverifiedAnsweredCount: number;
  scoreOutOf10: number | null;
  accuracyPercent: number | null;
  isFullyVerifiedExam: boolean;
  details: QuestionGradingDetail[];
}

/**
 * Evaluates a single question in practice or mock mode.
 * Never counts an unverified question as wrong or right.
 */
export function evaluateSingleQuestion(
  question: ExamQuestion,
  selectedChoice: AnswerChoice | undefined | null
): QuestionGradingDetail {
  const choice = selectedChoice ?? null;

  if (!choice) {
    return {
      questionId: question.id,
      questionNumber: question.number,
      selectedChoice: null,
      verifiedAnswer: question.verifiedAnswer,
      isVerified: question.isVerified,
      status: 'unanswered',
    };
  }

  if (!question.isVerified || !question.verifiedAnswer) {
    return {
      questionId: question.id,
      questionNumber: question.number,
      selectedChoice: choice,
      verifiedAnswer: null,
      isVerified: false,
      status: 'unverified',
    };
  }

  const isCorrect = choice === question.verifiedAnswer;
  return {
    questionId: question.id,
    questionNumber: question.number,
    selectedChoice: choice,
    verifiedAnswer: question.verifiedAnswer,
    isVerified: true,
    status: isCorrect ? 'correct' : 'incorrect',
  };
}

/**
 * Evaluates an entire exam attempt.
 * In 'practice' mode, if `confirmedQuestions` is provided, it uses the locked first-try confirmation state
 * so repeated interactions or reloads never double-count points.
 */
export function evaluateExamSubmission(
  exam: ExamPaper,
  selectedAnswers: Record<string, AnswerChoice>,
  mode: PracticeMode,
  confirmedQuestions?: Record<string, QuestionConfirmState>
): ExamEvaluationSummary {
  let verifiedGradableCount = 0;
  let unverifiedCount = 0;
  let answeredCount = 0;
  let unansweredCount = 0;
  let correctCount = 0;
  let incorrectCount = 0;
  let unverifiedAnsweredCount = 0;

  const details: QuestionGradingDetail[] = exam.questions.map((q) => {
    if (q.isVerified && q.verifiedAnswer) {
      verifiedGradableCount += 1;
    } else {
      unverifiedCount += 1;
    }

    // In practice mode, respect first-try locked confirmation if present
    if (mode === 'practice' && confirmedQuestions && confirmedQuestions[q.id]?.confirmed) {
      const conf = confirmedQuestions[q.id];
      answeredCount += 1;
      if (!conf.isVerified || !q.isVerified || !q.verifiedAnswer) {
        unverifiedAnsweredCount += 1;
        return {
          questionId: q.id,
          questionNumber: q.number,
          selectedChoice: conf.selectedChoice,
          verifiedAnswer: null,
          isVerified: false,
          status: 'unverified',
        };
      }
      if (conf.isCorrectFirstTry) {
        correctCount += 1;
        return {
          questionId: q.id,
          questionNumber: q.number,
          selectedChoice: conf.selectedChoice,
          verifiedAnswer: q.verifiedAnswer,
          isVerified: true,
          status: 'correct',
        };
      } else {
        incorrectCount += 1;
        return {
          questionId: q.id,
          questionNumber: q.number,
          selectedChoice: conf.selectedChoice,
          verifiedAnswer: q.verifiedAnswer,
          isVerified: true,
          status: 'incorrect',
        };
      }
    }

    const choice = selectedAnswers[q.id] ?? null;
    const detail = evaluateSingleQuestion(q, choice);

    if (detail.status === 'unanswered') {
      unansweredCount += 1;
    } else {
      answeredCount += 1;
      if (detail.status === 'correct') {
        correctCount += 1;
      } else if (detail.status === 'incorrect') {
        incorrectCount += 1;
      } else if (detail.status === 'unverified') {
        unverifiedAnsweredCount += 1;
      }
    }

    return detail;
  });

  const validGradedTotal = correctCount + incorrectCount;
  const accuracyPercent =
    validGradedTotal > 0 ? Math.round((correctCount / validGradedTotal) * 1000) / 10 : null;

  // Score out of 10 calculated over the verified gradable questions in the exam
  const scoreOutOf10 =
    verifiedGradableCount > 0
      ? Math.round((correctCount / verifiedGradableCount) * 100) / 10
      : null;

  return {
    totalQuestions: exam.questions.length,
    verifiedGradableCount,
    unverifiedCount,
    answeredCount,
    unansweredCount,
    correctCount,
    incorrectCount,
    unverifiedAnsweredCount,
    scoreOutOf10,
    accuracyPercent,
    isFullyVerifiedExam: unverifiedCount === 0 && verifiedGradableCount === exam.questions.length,
    details,
  };
}

export interface AggregateStatistics {
  totalAttempts: number;
  practiceAttempts: number;
  mockAttempts: number;
  totalAnswered: number;
  totalCorrect: number;
  totalIncorrect: number;
  overallAccuracyPercent: number | null;
  highestScore: number | null;
  averageFullyGradedMockScore: number | null;
  averageVerifiedMockScore: number | null;
  fullyGradedMockCount: number;
  totalExamSeconds: number;
}

/**
 * Computes aggregate statistics from real attempt history records.
 * Follows Section VIII rules strictly:
 * - Accuracy = correct / total validly graded questions (correct + incorrect) * 100%
 * - Unanswered or unverified questions are NEVER counted as confirmed wrong answers.
 * - Average mock score only counts mock attempts that are fully graded and valid (isFullyVerifiedExam && unansweredCount === 0),
 *   while also exposing averageVerifiedMockScore for transparency when source PDF has unverified items.
 */
export function computeAggregateStatistics(
  records: AttemptHistoryRecord[],
  filterExamId: string = 'all',
  filterMode: string = 'all'
): AggregateStatistics {
  const filtered = records.filter((r) => {
    if (filterExamId !== 'all' && r.examId !== filterExamId) return false;
    if (filterMode !== 'all' && r.mode !== filterMode) return false;
    return true;
  });

  if (filtered.length === 0) {
    return {
      totalAttempts: 0,
      practiceAttempts: 0,
      mockAttempts: 0,
      totalAnswered: 0,
      totalCorrect: 0,
      totalIncorrect: 0,
      overallAccuracyPercent: null,
      highestScore: null,
      averageFullyGradedMockScore: null,
      averageVerifiedMockScore: null,
      fullyGradedMockCount: 0,
      totalExamSeconds: 0,
    };
  }

  let practiceAttempts = 0;
  let mockAttempts = 0;
  let totalAnswered = 0;
  let totalCorrect = 0;
  let totalIncorrect = 0;
  let highestScore: number | null = null;
  let totalExamSeconds = 0;

  const fullyGradedMocks: number[] = [];
  const verifiedMocks: number[] = [];

  for (const rec of filtered) {
    if (rec.mode === 'practice') practiceAttempts += 1;
    if (rec.mode === 'mock') mockAttempts += 1;

    totalAnswered += rec.answeredCount;
    totalCorrect += rec.correctCount;
    totalIncorrect += rec.incorrectCount;
    totalExamSeconds += rec.elapsedSeconds;

    if (rec.scoreOutOf10 !== null) {
      if (highestScore === null || rec.scoreOutOf10 > highestScore) {
        highestScore = rec.scoreOutOf10;
      }
      if (rec.mode === 'mock') {
        verifiedMocks.push(rec.scoreOutOf10);
        if (rec.isFullyVerifiedExam && rec.unansweredCount === 0) {
          fullyGradedMocks.push(rec.scoreOutOf10);
        }
      }
    }
  }

  const totalValidGraded = totalCorrect + totalIncorrect;
  const overallAccuracyPercent =
    totalValidGraded > 0 ? Math.round((totalCorrect / totalValidGraded) * 1000) / 10 : null;

  const averageFullyGradedMockScore =
    fullyGradedMocks.length > 0
      ? Math.round(
          (fullyGradedMocks.reduce((acc, v) => acc + v, 0) / fullyGradedMocks.length) * 10
        ) / 10
      : null;

  const averageVerifiedMockScore =
    verifiedMocks.length > 0
      ? Math.round((verifiedMocks.reduce((acc, v) => acc + v, 0) / verifiedMocks.length) * 10) /
        10
      : null;

  return {
    totalAttempts: filtered.length,
    practiceAttempts,
    mockAttempts,
    totalAnswered,
    totalCorrect,
    totalIncorrect,
    overallAccuracyPercent,
    highestScore,
    averageFullyGradedMockScore,
    averageVerifiedMockScore,
    fullyGradedMockCount: fullyGradedMocks.length,
    totalExamSeconds,
  };
}

export function formatDurationVi(seconds: number): string {
  const safeSecs = Math.max(0, Math.floor(seconds));
  const mins = Math.floor(safeSecs / 60);
  const secs = safeSecs % 60;
  if (mins === 0) {
    return `${secs} giây`;
  }
  const hours = Math.floor(mins / 60);
  const remMins = mins % 60;
  if (hours > 0) {
    return `${hours} giờ ${remMins} phút ${secs} giây`;
  }
  return `${mins} phút ${secs < 10 ? `0${secs}` : secs} giây`;
}
