import test from 'node:test';
import assert from 'node:assert/strict';
import {
  evaluateSingleQuestion,
  evaluateExamSubmission,
  computeAggregateStatistics,
  formatDurationVi,
} from './scoring';
import { EXAM_PAPERS } from '../data/examsData';
import { VOCABULARY_DATA, GRAMMAR_DATA, SENTENCE_STRUCTURES_DATA } from '../data/curriculumData';
import {
  VOCAB_QUIZ_QUESTIONS,
  GRAMMAR_QUIZ_QUESTIONS,
  STRUCTURE_QUIZ_QUESTIONS,
} from '../data/theoryQuizzesData';
import { AttemptHistoryRecord } from '../types';

test('curriculum data has exact verbatim counts from PDF (30 vocab items across 3 units, 7 grammar sections)', () => {
  assert.equal(VOCABULARY_DATA.length, 30);
  assert.equal(VOCABULARY_DATA.filter((v) => v.unitId === 'unit-1').length, 10);
  assert.equal(VOCABULARY_DATA.filter((v) => v.unitId === 'unit-2').length, 10);
  assert.equal(VOCABULARY_DATA.filter((v) => v.unitId === 'unit-3').length, 10);
  assert.equal(GRAMMAR_DATA.length, 7);
  assert.equal(SENTENCE_STRUCTURES_DATA.length, 4);
});

test('theory review quizzes contain 15 custom practice questions each for Vocab, Grammar, and Structures', () => {
  assert.equal(VOCAB_QUIZ_QUESTIONS.length, 15);
  assert.equal(GRAMMAR_QUIZ_QUESTIONS.length, 15);
  assert.equal(STRUCTURE_QUIZ_QUESTIONS.length, 15);
});

test('exam papers match exact PDF structure (2 papers, 50 questions each, 4 options per question, hints & Q23/24 underlines)', () => {
  assert.equal(EXAM_PAPERS.length, 2);
  assert.equal(EXAM_PAPERS[0].title, 'ĐỀ ÔN TẬP KIỂM TRA - ĐỀ SỐ 1');
  assert.equal(EXAM_PAPERS[1].title, 'ĐỀ ÔN LUYỆN TIẾNG ANH (UNIT 1 - 3) - ĐỀ SỐ 2');
  for (const exam of EXAM_PAPERS) {
    assert.equal(exam.questions.length, 50);
    assert.equal(exam.totalQuestions, 50);
    assert.equal(exam.verifiedCount + exam.unverifiedCount, 50);
    // Verify Q23 and Q24 have <u>...</u> underlines in both exams
    assert.ok(exam.questions[22].stem.includes('<u>') && exam.questions[22].stem.includes('</u>'));
    assert.ok(exam.questions[23].stem.includes('<u>') && exam.questions[23].stem.includes('</u>'));
    for (let i = 0; i < 50; i++) {
      const q = exam.questions[i];
      assert.equal(q.number, i + 1);
      assert.equal(q.options.length, 4);
      assert.ok(q.hintVi.length > 0);
      if (q.isVerified) {
        assert.ok(q.verifiedAnswer !== null);
      } else {
        assert.equal(q.verifiedAnswer, null);
        assert.equal(q.hasNoCorrectOptionInSource, true);
        assert.ok(q.suggestedReplacementVi && q.suggestedReplacementVi.length > 0);
      }
    }
  }
});

test('evaluateSingleQuestion distinguishes correct, incorrect, unanswered, and unverified', () => {
  const exam1 = EXAM_PAPERS[0];
  const verifiedQ = exam1.questions[0]; // Q1: verified answer 'D'
  const unverifiedQ = exam1.questions[27]; // Q28: no correct option in source (isVerified: false)

  assert.equal(evaluateSingleQuestion(verifiedQ, null).status, 'unanswered');
  assert.equal(evaluateSingleQuestion(verifiedQ, 'D').status, 'correct');
  assert.equal(evaluateSingleQuestion(verifiedQ, 'A').status, 'incorrect');

  // Unverified / defective question should NEVER be marked correct or incorrect
  assert.equal(evaluateSingleQuestion(unverifiedQ, null).status, 'unanswered');
  assert.equal(evaluateSingleQuestion(unverifiedQ, 'A').status, 'unverified');
});

test('evaluateExamSubmission computes accurate counts and separates unverified answers', () => {
  const exam1 = EXAM_PAPERS[0];
  const result = evaluateExamSubmission(
    exam1,
    {
      'e1-q1': 'D', // verified correct
      'e1-q28': 'A', // unverified (no correct answer in source)
      'e1-q3': 'A', // verified incorrect (correct is B)
    },
    'mock'
  );

  assert.equal(result.totalQuestions, 50);
  assert.equal(result.answeredCount, 3);
  assert.equal(result.unansweredCount, 47);
  assert.equal(result.correctCount, 1);
  assert.equal(result.incorrectCount, 1);
  assert.equal(result.unverifiedAnsweredCount, 1);
  assert.equal(result.accuracyPercent, 50); // 1 / (1 + 1) * 100%
});

test('computeAggregateStatistics returns empty state when no history records exist', () => {
  const stats = computeAggregateStatistics([]);
  assert.equal(stats.totalAttempts, 0);
  assert.equal(stats.overallAccuracyPercent, null);
  assert.equal(stats.highestScore, null);
  assert.equal(stats.averageFullyGradedMockScore, null);
});

test('computeAggregateStatistics calculates accuracy only on validly graded questions', () => {
  const records: AttemptHistoryRecord[] = [
    {
      id: 'att-1',
      examId: 'exam-1',
      examTitle: 'ĐỀ ÔN TẬP KIỂM TRA - ĐỀ SỐ 1',
      mode: 'practice',
      completedAt: '2026-10-27T10:00:00.000Z',
      elapsedSeconds: 120,
      totalQuestions: 50,
      verifiedGradableCount: 25,
      unverifiedCount: 25,
      answeredCount: 20,
      unansweredCount: 30,
      correctCount: 15,
      incorrectCount: 5,
      scoreOutOf10: 6.0,
      accuracyPercent: 75,
      isFullyVerifiedExam: false,
      selectedAnswers: {},
    },
    {
      id: 'att-2',
      examId: 'exam-2',
      examTitle: 'ĐỀ ÔN LUYỆN TIẾNG ANH (UNIT 1 - 3) - ĐỀ SỐ 2',
      mode: 'mock',
      completedAt: '2026-10-27T11:00:00.000Z',
      elapsedSeconds: 300,
      totalQuestions: 50,
      verifiedGradableCount: 20,
      unverifiedCount: 30,
      answeredCount: 50,
      unansweredCount: 0,
      correctCount: 15,
      incorrectCount: 5,
      scoreOutOf10: 7.5,
      accuracyPercent: 75,
      isFullyVerifiedExam: false,
      selectedAnswers: {},
    },
  ];

  const stats = computeAggregateStatistics(records);
  assert.equal(stats.totalAttempts, 2);
  assert.equal(stats.totalCorrect, 30);
  assert.equal(stats.totalIncorrect, 10);
  assert.equal(stats.overallAccuracyPercent, 75);
  assert.equal(stats.highestScore, 7.5);
  assert.equal(stats.averageFullyGradedMockScore, null); // Because unverifiedCount > 0
  assert.equal(stats.averageVerifiedMockScore, 7.5);
  assert.equal(formatDurationVi(125), '2 phút 05 giây');
});
