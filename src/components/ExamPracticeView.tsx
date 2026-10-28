import React, { useState, useEffect, useMemo } from 'react';
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Save,
  Send,
  RotateCcw,
  Home,
  Eye,
  Clock,
  FileCheck2,
  HelpCircle,
} from 'lucide-react';
import {
  AnswerChoice,
  AppView,
  AttemptHistoryRecord,
  DraftSession,
  ExamPaper,
  PracticeMode,
  QuestionConfirmState,
} from '../types';
import { EXAM_PAPERS } from '../data/examsData';
import {
  evaluateExamSubmission,
  evaluateSingleQuestion,
  formatDurationVi,
} from '../utils/scoring';
import { FormattedQuestionStem } from './FormattedQuestionStem';

interface ExamPracticeViewProps {
  initialExamId?: string | null;
  initialMode?: PracticeMode | null;
  activeDraftToResume?: DraftSession | null;
  onClearResumeDraft: () => void;
  onSaveDraft: (draft: DraftSession, showToast: boolean) => void;
  onDeleteDraft: (draftId: string) => void;
  onCompleteAttempt: (record: AttemptHistoryRecord, draftIdToClear?: string) => void;
  onNavigate: (view: AppView) => void;
  autoSaveEnabled: boolean;
  showSourceNotes: boolean;
}

type Stage = 'select' | 'running' | 'review_grid' | 'results';
type ResultFilter = 'all' | 'incorrect' | 'unverified';

export const ExamPracticeView: React.FC<ExamPracticeViewProps> = ({
  initialExamId,
  initialMode,
  activeDraftToResume,
  onClearResumeDraft,
  onSaveDraft,
  onCompleteAttempt,
  onNavigate,
  autoSaveEnabled,
  showSourceNotes,
}) => {
  const [selectedExamId, setSelectedExamId] = useState<string>(
    initialExamId || EXAM_PAPERS[0].id
  );
  const [selectedMode, setSelectedMode] = useState<PracticeMode>(initialMode || 'practice');
  const [stage, setStage] = useState<Stage>('select');

  // Session state
  const [sessionId, setSessionId] = useState<string>('');
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, AnswerChoice>>({});
  const [confirmedQuestions, setConfirmedQuestions] = useState<
    Record<string, QuestionConfirmState>
  >({});
  const [shownHints, setShownHints] = useState<Record<string, boolean>>({});
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
  const [startedAt, setStartedAt] = useState<string>('');
  const [draftToastMessage, setDraftToastMessage] = useState<string | null>(null);
  const [showSubmitConfirmModal, setShowSubmitConfirmModal] = useState<boolean>(false);
  const [resultFilter, setResultFilter] = useState<ResultFilter>('all');

  const currentExam: ExamPaper = useMemo(() => {
    return EXAM_PAPERS.find((e) => e.id === selectedExamId) || EXAM_PAPERS[0];
  }, [selectedExamId]);

  // Handle resuming from a draft or starting direct from Home
  useEffect(() => {
    if (activeDraftToResume) {
      const targetExam = EXAM_PAPERS.find((e) => e.id === activeDraftToResume.examId);
      if (targetExam) {
        setSelectedExamId(targetExam.id);
        setSelectedMode(activeDraftToResume.mode);
        setSessionId(activeDraftToResume.id);
        setCurrentQuestionIndex(
          Math.min(
            Math.max(0, activeDraftToResume.currentQuestionIndex),
            targetExam.questions.length - 1
          )
        );
        setSelectedAnswers(activeDraftToResume.selectedAnswers || {});
        setConfirmedQuestions(activeDraftToResume.confirmedQuestions || {});
        setShownHints({});
        setElapsedSeconds(activeDraftToResume.elapsedSeconds || 0);
        setStartedAt(activeDraftToResume.startedAt || new Date().toISOString());
        setStage('running');
      }
      onClearResumeDraft();
    } else if (initialExamId && initialMode) {
      const targetExam = EXAM_PAPERS.find((e) => e.id === initialExamId);
      if (targetExam) {
        startNewSession(targetExam.id, initialMode);
      }
    }
  }, [activeDraftToResume, initialExamId, initialMode]);

  const startNewSession = (examId: string, mode: PracticeMode) => {
    const newId = `draft-${Date.now()}`;
    setSelectedExamId(examId);
    setSelectedMode(mode);
    setSessionId(newId);
    setCurrentQuestionIndex(0);
    setSelectedAnswers({});
    setConfirmedQuestions({});
    setShownHints({});
    setElapsedSeconds(0);
    setStartedAt(new Date().toISOString());
    setResultFilter('all');
    setStage('running');
  };

  // Timer when running
  useEffect(() => {
    if (stage !== 'running' && stage !== 'review_grid') return;
    const timer = window.setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);
    return () => window.clearInterval(timer);
  }, [stage]);

  // Build current draft object
  const buildCurrentDraft = (): DraftSession => ({
    id: sessionId || `draft-${Date.now()}`,
    examId: currentExam.id,
    examTitle: currentExam.title,
    mode: selectedMode,
    currentQuestionIndex,
    selectedAnswers,
    confirmedQuestions,
    elapsedSeconds,
    startedAt: startedAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  // Auto-save whenever answers, confirmations, or question index change
  useEffect(() => {
    if (stage !== 'running' && stage !== 'review_grid') return;
    if (!autoSaveEnabled || !sessionId) return;
    onSaveDraft(buildCurrentDraft(), false);
  }, [selectedAnswers, confirmedQuestions, currentQuestionIndex, stage]);

  const handleManualSaveDraft = () => {
    const draft = buildCurrentDraft();
    onSaveDraft(draft, true);
    setDraftToastMessage('Đã lưu bản nháp');
    window.setTimeout(() => {
      setDraftToastMessage(null);
    }, 2500);
  };

  const currentQuestion = currentExam.questions[currentQuestionIndex];
  const currentPassage = currentQuestion?.passageId
    ? currentExam.passages[currentQuestion.passageId]
    : undefined;

  const isCurrentQuestionConfirmed =
    selectedMode === 'practice' && Boolean(confirmedQuestions[currentQuestion?.id]?.confirmed);

  const handleSelectOption = (choice: AnswerChoice) => {
    if (!currentQuestion) return;

    if (selectedMode === 'practice') {
      // If already answered in practice mode, ignore repeat clicks
      if (confirmedQuestions[currentQuestion.id]?.confirmed) {
        return;
      }

      const evalSingle = evaluateSingleQuestion(currentQuestion, choice);
      const isCorrectFirstTry =
        evalSingle.status === 'correct'
          ? true
          : evalSingle.status === 'incorrect'
          ? false
          : null;

      setSelectedAnswers((prev) => ({
        ...prev,
        [currentQuestion.id]: choice,
      }));

      setConfirmedQuestions((prev) => ({
        ...prev,
        [currentQuestion.id]: {
          selectedChoice: choice,
          confirmed: true,
          isCorrectFirstTry,
          isVerified: currentQuestion.isVerified,
        },
      }));

      // If correct -> automatically move to the next question immediately!
      if (isCorrectFirstTry === true) {
        window.setTimeout(() => {
          if (currentQuestionIndex < currentExam.totalQuestions - 1) {
            setCurrentQuestionIndex((prev) =>
              Math.min(currentExam.totalQuestions - 1, prev + 1)
            );
          } else {
            setShowSubmitConfirmModal(true);
          }
        }, 300);
      }
      return;
    }

    // Mock mode: allow changing choice freely before submitting
    setSelectedAnswers((prev) => ({
      ...prev,
      [currentQuestion.id]: choice,
    }));
  };

  const toggleHintForCurrent = () => {
    if (!currentQuestion) return;
    setShownHints((prev) => ({
      ...prev,
      [currentQuestion.id]: !prev[currentQuestion.id],
    }));
  };

  const liveEvaluation = useMemo(() => {
    return evaluateExamSubmission(
      currentExam,
      selectedAnswers,
      selectedMode,
      confirmedQuestions
    );
  }, [currentExam, selectedAnswers, selectedMode, confirmedQuestions]);

  const finalizeAndSubmitExam = () => {
    setShowSubmitConfirmModal(false);
    const evalSummary = evaluateExamSubmission(
      currentExam,
      selectedAnswers,
      selectedMode,
      confirmedQuestions
    );

    const firstTryResults: Record<string, boolean | null> = {};
    if (selectedMode === 'practice') {
      for (const [qId, st] of Object.entries(confirmedQuestions)) {
        firstTryResults[qId] = st.isCorrectFirstTry;
      }
    }

    const record: AttemptHistoryRecord = {
      id: `attempt-${Date.now()}`,
      examId: currentExam.id,
      examTitle: currentExam.title,
      mode: selectedMode,
      completedAt: new Date().toISOString(),
      elapsedSeconds,
      totalQuestions: evalSummary.totalQuestions,
      verifiedGradableCount: evalSummary.verifiedGradableCount,
      unverifiedCount: evalSummary.unverifiedCount,
      answeredCount: evalSummary.answeredCount,
      unansweredCount: evalSummary.unansweredCount,
      correctCount: evalSummary.correctCount,
      incorrectCount: evalSummary.incorrectCount,
      scoreOutOf10: evalSummary.scoreOutOf10,
      accuracyPercent: evalSummary.accuracyPercent,
      isFullyVerifiedExam: evalSummary.isFullyVerifiedExam,
      selectedAnswers: { ...selectedAnswers },
      firstTryResults: selectedMode === 'practice' ? firstTryResults : undefined,
    };

    onCompleteAttempt(record, sessionId);
    setStage('results');
  };

  // 1. STAGE: SELECT EXAM & MODE
  if (stage === 'select') {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 space-y-6">
          <div className="space-y-1">
            <button
              type="button"
              onClick={() => onNavigate('home')}
              className="text-xs font-semibold text-sky-700 hover:text-sky-800 flex items-center gap-1 mb-1"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Quay lại</span>
            </button>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
              Khu vực Luyện đề
            </h1>
            <p className="text-sm text-slate-600">
              Chọn đề ôn luyện có trong tệp PDF gốc và chế độ làm bài phù hợp với mục tiêu của bạn.
            </p>
          </div>

          {/* Step 1: Select Exam Paper */}
          <div className="space-y-3">
            <h2 className="text-sm font-bold text-slate-800">
              1. Chọn đề muốn làm (từ tài liệu gốc)
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {EXAM_PAPERS.map((paper) => {
                const isSelected = paper.id === selectedExamId;
                return (
                  <button
                    key={paper.id}
                    type="button"
                    onClick={() => setSelectedExamId(paper.id)}
                    className={`text-left p-5 rounded-xl border transition-colors space-y-2 ${
                      isSelected
                        ? 'bg-sky-50/70 border-sky-600 ring-1 ring-sky-600'
                        : 'bg-white border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <div className="text-xs text-slate-500">{paper.sourceSubtitle}</div>
                    <div className="text-base font-bold text-slate-900">{paper.title}</div>
                    <div className="text-xs text-slate-600">
                      <span>Số lượng câu hỏi: {paper.totalQuestions} câu</span>
                      <span className="mx-1.5" aria-hidden="true">·</span>
                      <span>Câu có đáp án chuẩn: {paper.verifiedCount} câu</span>
                      <span className="mx-1.5" aria-hidden="true">·</span>
                      <span>Câu lỗi đề gốc: {paper.unverifiedCount} câu</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Step 2: Select Mode */}
          <div className="space-y-3">
            <h2 className="text-sm font-bold text-slate-800">2. Chọn chế độ làm bài</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setSelectedMode('practice')}
                className={`text-left p-5 rounded-xl border transition-colors space-y-2 ${
                  selectedMode === 'practice'
                    ? 'bg-sky-50/70 border-sky-600 ring-1 ring-sky-600'
                    : 'bg-white border-slate-200 hover:bg-slate-50'
                }`}
              >
                <div className="text-base font-bold text-slate-900">1. Chế độ ôn tập</div>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  Mỗi câu đều có nút &ldquo;Hiện gợi ý&rdquo; (dịch nghĩa & cấu trúc). Khi chọn đáp án: nếu chọn
                  đúng sẽ tự động chuyển qua câu tiếp theo ngay; nếu chọn sai sẽ hiển thị lời giải
                  thích chi tiết.
                </p>
              </button>

              <button
                type="button"
                onClick={() => setSelectedMode('mock')}
                className={`text-left p-5 rounded-xl border transition-colors space-y-2 ${
                  selectedMode === 'mock'
                    ? 'bg-emerald-50/70 border-emerald-600 ring-1 ring-emerald-600'
                    : 'bg-white border-slate-200 hover:bg-slate-50'
                }`}
              >
                <div className="text-base font-bold text-slate-900">2. Chế độ thi thử</div>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  Mô phỏng bài kiểm tra: không có gợi ý và không tiết lộ đáp án đúng trong lúc làm,
                  cho phép thay đổi lựa chọn trước khi bấm &ldquo;Nộp bài&rdquo;.
                </p>
              </button>
            </div>
          </div>

          {/* Source Extraction Integrity Notes */}
          {showSourceNotes && (
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2">
              <div className="text-xs font-bold text-slate-800">
                Thông tin đối chiếu dữ liệu gốc ({currentExam.title}):
              </div>
              <ul className="text-xs text-slate-600 space-y-1 list-disc list-inside">
                {currentExam.extractionNotes.map((note, idx) => (
                  <li key={idx}>{note}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Action Buttons */}
          <div className="pt-2 flex flex-wrap items-center justify-between gap-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => onNavigate('home')}
              className="px-4 py-2.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-sm font-semibold rounded-xl transition-colors whitespace-nowrap shrink-0"
            >
              Quay lại
            </button>
            <button
              type="button"
              onClick={() => startNewSession(currentExam.id, selectedMode)}
              className="px-6 py-2.5 bg-sky-600 hover:bg-sky-700 text-white text-sm font-semibold rounded-xl transition-colors flex items-center gap-2 whitespace-nowrap shrink-0"
            >
              <FileCheck2 className="w-4 h-4" />
              <span>Bắt đầu làm bài</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 2. STAGE: REVIEW GRID (Used in Mock Mode & Practice Mode to inspect answered/unanswered questions)
  if (stage === 'review_grid') {
    const answeredCount = Object.keys(selectedAnswers).length;
    const unansweredCount = currentExam.totalQuestions - answeredCount;

    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <div className="text-xs font-semibold text-sky-700">
                {currentExam.title} ·{' '}
                {selectedMode === 'practice' ? 'Chế độ ôn tập' : 'Chế độ thi thử'}
              </div>
              <h2 className="text-xl font-bold text-slate-900">
                Xem lại danh sách câu hỏi trước khi nộp bài
              </h2>
            </div>
            <div className="text-xs sm:text-sm font-mono text-slate-600 tabular-nums">
              Đã chọn: {answeredCount}/{currentExam.totalQuestions} · Chưa trả lời: {unansweredCount}
            </div>
          </div>

          <div className="grid grid-cols-5 sm:grid-cols-10 gap-2.5">
            {currentExam.questions.map((q, idx) => {
              const chosen = selectedAnswers[q.id];
              const confirmed = confirmedQuestions[q.id]?.confirmed;
              return (
                <button
                  key={q.id}
                  type="button"
                  onClick={() => {
                    setCurrentQuestionIndex(idx);
                    setStage('running');
                  }}
                  className={`py-2.5 px-2 rounded-xl text-xs font-mono font-semibold border transition-colors flex flex-col items-center justify-center ${
                    chosen
                      ? 'bg-sky-600 text-white border-sky-600'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <span>Câu {q.number}</span>
                  <span className="text-[11px] opacity-90">
                    {chosen ? `(${chosen}${confirmed ? '✓' : ''})` : '—'}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => setStage('running')}
              className="px-4 py-2.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-800 text-sm font-semibold rounded-xl transition-colors"
            >
              Quay lại câu đang làm
            </button>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleManualSaveDraft}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-sm font-semibold rounded-xl transition-colors"
              >
                Lưu bản nháp
              </button>
              <button
                type="button"
                onClick={() => setShowSubmitConfirmModal(true)}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-xl transition-colors"
              >
                Nộp bài
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 3. STAGE: RESULTS (After submission)
  if (stage === 'results') {
    const filteredDetails = liveEvaluation.details.filter((d) => {
      if (resultFilter === 'incorrect') return d.status === 'incorrect';
      if (resultFilter === 'unverified') return d.status === 'unverified';
      return true;
    });

    return (
      <div className="space-y-6">
        {/* Summary Card */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 space-y-6">
          <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-100 pb-4">
            <div className="space-y-1">
              <div className="text-xs font-semibold text-sky-700">
                Kết quả hoàn thành ·{' '}
                {selectedMode === 'practice' ? 'Chế độ ôn tập' : 'Chế độ thi thử'}
              </div>
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
                {currentExam.title}
              </h1>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setResultFilter('incorrect')}
                className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold border transition-colors ${
                  resultFilter === 'incorrect'
                    ? 'bg-rose-600 text-white border-rose-600'
                    : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                }`}
              >
                Xem lại câu sai ({liveEvaluation.incorrectCount})
              </button>
              <button
                type="button"
                onClick={() => setResultFilter('all')}
                className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold border transition-colors ${
                  resultFilter === 'all'
                    ? 'bg-sky-600 text-white border-sky-600'
                    : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                }`}
              >
                Xem lại toàn bộ bài ({liveEvaluation.totalQuestions})
              </button>
              <button
                type="button"
                onClick={() => startNewSession(currentExam.id, selectedMode)}
                className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-semibold rounded-xl transition-colors flex items-center gap-1.5"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Làm lại đề</span>
              </button>
              <button
                type="button"
                onClick={() => onNavigate('home')}
                className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs sm:text-sm font-semibold rounded-xl transition-colors flex items-center gap-1.5"
              >
                <Home className="w-4 h-4" />
                <span>Về trang chủ</span>
              </button>
            </div>
          </div>

          {/* Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
            <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3.5">
              <div className="text-xs text-slate-500">Tổng số câu</div>
              <div className="text-lg font-bold font-mono tabular-nums text-slate-900">
                {liveEvaluation.totalQuestions}
              </div>
            </div>
            <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-3.5">
              <div className="text-xs text-emerald-800">Số câu đúng</div>
              <div className="text-lg font-bold font-mono tabular-nums text-emerald-900">
                {liveEvaluation.correctCount}
              </div>
            </div>
            <div className="bg-rose-50/70 border border-rose-200 rounded-xl p-3.5">
              <div className="text-xs text-rose-800">Số câu sai</div>
              <div className="text-lg font-bold font-mono tabular-nums text-rose-900">
                {liveEvaluation.incorrectCount}
              </div>
            </div>
            <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3.5">
              <div className="text-xs text-slate-500">Chưa trả lời</div>
              <div className="text-lg font-bold font-mono tabular-nums text-slate-900">
                {liveEvaluation.unansweredCount}
              </div>
            </div>
            <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-3.5">
              <div className="text-xs text-amber-800">Câu lỗi đề gốc</div>
              <div className="text-lg font-bold font-mono tabular-nums text-amber-900">
                {liveEvaluation.unverifiedCount}
              </div>
            </div>
            <div className="bg-sky-50/70 border border-sky-200 rounded-xl p-3.5">
              <div className="text-xs text-sky-800">
                Điểm ({liveEvaluation.verifiedGradableCount} câu hợp lệ)
              </div>
              <div className="text-lg font-bold font-mono tabular-nums text-sky-900">
                {liveEvaluation.scoreOutOf10 !== null
                  ? `${liveEvaluation.scoreOutOf10.toFixed(1)} / 10`
                  : '—'}
              </div>
            </div>
            <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3.5">
              <div className="text-xs text-slate-500">Tỷ lệ chính xác · Thời gian</div>
              <div className="text-sm font-bold font-mono tabular-nums text-slate-900">
                {liveEvaluation.accuracyPercent !== null
                  ? `${liveEvaluation.accuracyPercent}%`
                  : '—'}{' '}
                · {formatDurationVi(elapsedSeconds)}
              </div>
            </div>
          </div>

          {/* Notice for questions without correct option in source */}
          {liveEvaluation.unverifiedCount > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-xs sm:text-sm text-amber-900 space-y-1">
              <div className="font-bold flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0" />
                <span>
                  Ghi chú về {liveEvaluation.unverifiedCount} câu không có đáp án đúng trong đề
                  cương gốc:
                </span>
              </div>
              <p>
                Trong đề gốc có {liveEvaluation.unverifiedCount} câu bị lỗi in ấn phương án (không
                có phương án đúng trong 4 lựa chọn A, B, C, D). Hệ thống đã tách riêng các câu này
                để không làm sai lệch điểm số của bạn và hiển thị rõ đáp án cần điền ở chi tiết bên
                dưới.
              </p>
            </div>
          )}
        </div>

        {/* Question-by-Question Review List */}
        <div className="space-y-4">
          {filteredDetails.map((detail) => {
            const q = currentExam.questions.find((item) => item.id === detail.questionId);
            if (!q) return null;
            return (
              <div
                key={q.id}
                className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
                  <span className="text-xs font-bold text-slate-500">Câu {q.number}</span>
                  <div className="text-xs font-semibold">
                    {detail.status === 'correct' && (
                      <span className="text-emerald-700 flex items-center gap-1">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Chính xác! (Bạn chọn {detail.selectedChoice})</span>
                      </span>
                    )}
                    {detail.status === 'incorrect' && (
                      <span className="text-rose-700 flex items-center gap-1">
                        <XCircle className="w-4 h-4" />
                        <span>
                          Chưa chính xác! (Bạn chọn {detail.selectedChoice} · Đáp án đúng:{' '}
                          {detail.verifiedAnswer})
                        </span>
                      </span>
                    )}
                    {detail.status === 'unanswered' && (
                      <span className="text-slate-600">
                        Chưa trả lời{' '}
                        {q.isVerified && q.verifiedAnswer
                          ? `· Đáp án đúng: ${q.verifiedAnswer}`
                          : '· Câu không có đáp án đúng trong đề cương'}
                      </span>
                    )}
                    {detail.status === 'unverified' && (
                      <span className="text-amber-700 flex items-center gap-1">
                        <AlertTriangle className="w-4 h-4" />
                        <span>
                          Bạn chọn {detail.selectedChoice} · Không có đáp án đúng trong đề cương
                        </span>
                      </span>
                    )}
                  </div>
                </div>

                <div className="text-base font-semibold text-slate-900">
                  <FormattedQuestionStem text={q.stem} />
                </div>
                {q.subLines && q.subLines.length > 0 && (
                  <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-4 space-y-1.5 text-sm text-slate-800">
                    {q.subLines.map((line, idx) => (
                      <div key={idx}>{line}</div>
                    ))}
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {q.options.map((opt) => {
                    const isUserChoice = detail.selectedChoice === opt.label;
                    const isVerifiedCorrect = q.isVerified && q.verifiedAnswer === opt.label;
                    return (
                      <div
                        key={opt.label}
                        className={`p-3 rounded-xl border text-sm flex items-center justify-between ${
                          isVerifiedCorrect
                            ? 'bg-emerald-50 border-emerald-500 text-emerald-950 font-semibold'
                            : isUserChoice && detail.status === 'incorrect'
                            ? 'bg-rose-50 border-rose-400 text-rose-950'
                            : isUserChoice
                            ? 'bg-sky-50 border-sky-400 text-sky-950 font-medium'
                            : 'bg-white border-slate-200 text-slate-700'
                        }`}
                      >
                        <span>
                          <strong>{opt.label}.</strong> {opt.text}
                        </span>
                        {isVerifiedCorrect && (
                          <span className="text-xs text-emerald-700 font-semibold">
                            Đáp án đúng
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>

                {q.hasNoCorrectOptionInSource && q.suggestedReplacementVi ? (
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-xs sm:text-sm text-amber-950 space-y-1.5">
                    <div className="font-bold text-amber-900">
                      Không có đáp án đúng trong đề cương — Gợi ý đáp án cần điền:
                    </div>
                    <div>{q.suggestedReplacementVi}</div>
                  </div>
                ) : (
                  <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-4 text-xs sm:text-sm text-slate-700 space-y-1">
                    {q.relatedTopicTitle && (
                      <div className="font-semibold text-sky-900">
                        Chủ điểm liên quan: {q.relatedTopicTitle}
                      </div>
                    )}
                    <div>{q.verificationBasis}</div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // 4. STAGE: RUNNING (Active Exam Question View)
  const chosenForCurrent = currentQuestion ? selectedAnswers[currentQuestion.id] : undefined;
  const confirmStateForCurrent = currentQuestion
    ? confirmedQuestions[currentQuestion.id]
    : undefined;
  const isHintVisibleForCurrent = currentQuestion
    ? Boolean(shownHints[currentQuestion.id])
    : false;

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      {/* Top Bar: Exam Title, Mode, Progress, Score/Time */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="space-y-0.5">
            <div className="text-xs font-semibold text-sky-700">
              <span>
                {selectedMode === 'practice' ? 'Chế độ ôn tập' : 'Chế độ thi thử'}
              </span>
              <span className="mx-2" aria-hidden="true">·</span>
              <span>
                Câu {currentQuestionIndex + 1} / {currentExam.totalQuestions}
              </span>
            </div>
            <h1 className="text-base sm:text-lg font-bold text-slate-900">
              {currentExam.title}
            </h1>
          </div>

          <div className="flex flex-wrap items-center gap-3 text-xs sm:text-sm font-mono tabular-nums">
            <div className="flex items-center gap-1.5 text-slate-700 bg-slate-100 px-3 py-1.5 rounded-lg">
              <Clock className="w-4 h-4 text-sky-600" />
              <span>{formatDurationVi(elapsedSeconds)}</span>
            </div>

            {selectedMode === 'practice' ? (
              <div className="bg-sky-50 text-sky-900 border border-sky-200 px-3 py-1.5 rounded-lg font-semibold">
                <span>Đúng lần đầu: {liveEvaluation.correctCount}</span>
                <span className="mx-1.5" aria-hidden="true">·</span>
                <span>Sai: {liveEvaluation.incorrectCount}</span>
                <span className="mx-1.5" aria-hidden="true">·</span>
                <span>
                  Điểm:{' '}
                  {liveEvaluation.scoreOutOf10 !== null
                    ? liveEvaluation.scoreOutOf10.toFixed(1)
                    : '0.0'}
                </span>
              </div>
            ) : (
              <div className="bg-emerald-50 text-emerald-900 border border-emerald-200 px-3 py-1.5 rounded-lg font-semibold">
                Đã trả lời: {Object.keys(selectedAnswers).length}/{currentExam.totalQuestions}
              </div>
            )}
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-sky-600 transition-transform duration-200 origin-left"
            style={{
              transform: `scaleX(${
                currentExam.totalQuestions > 0
                  ? (currentQuestionIndex + 1) / currentExam.totalQuestions
                  : 0
              })`,
            }}
          />
        </div>

        {draftToastMessage && (
          <div
            role="status"
            className="text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-1.5"
          >
            {draftToastMessage}
          </div>
        )}
      </div>

      {/* Section Instruction or Reading Passage if attached to this question */}
      {currentQuestion?.sectionInstruction && (
        <div className="bg-slate-100 border border-slate-200 rounded-xl px-4 py-3 text-xs sm:text-sm font-bold text-slate-800 whitespace-pre-line">
          {currentQuestion.sectionInstruction}
        </div>
      )}

      {currentPassage && (
        <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 space-y-3">
          <div className="text-xs sm:text-sm font-bold text-slate-700">
            {currentPassage.instruction}
          </div>
          {currentPassage.title && (
            <h2 className="text-base font-bold text-center text-slate-900">
              {currentPassage.title}
            </h2>
          )}
          <div className="space-y-3 text-sm sm:text-base text-slate-800 leading-relaxed">
            {currentPassage.paragraphs.map((p, idx) => (
              <p key={idx}>{p}</p>
            ))}
          </div>
          {currentPassage.bulletItems && currentPassage.bulletItems.length > 0 && (
            <ul className="list-disc list-inside space-y-1.5 text-sm sm:text-base text-slate-800">
              {currentPassage.bulletItems.map((b, idx) => (
                <li key={idx}>{b}</li>
              ))}
            </ul>
          )}
          {showSourceNotes && currentPassage.extractionWarning && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-900">
              {currentPassage.extractionWarning}
            </div>
          )}
        </div>
      )}

      {/* Center Question Card */}
      {currentQuestion && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 space-y-6">
          <div className="space-y-3">
            {/* Practice Mode ONLY: "Hiện gợi ý" button and Hint Display */}
            {selectedMode === 'practice' && (
              <div className="space-y-2.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs text-slate-500">
                    Chọn đúng sẽ tự động chuyển qua câu tiếp theo; chọn sai sẽ hiện lời giải thích.
                  </span>
                  <button
                    type="button"
                    onClick={toggleHintForCurrent}
                    className="px-3.5 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0"
                  >
                    <HelpCircle className="w-4 h-4 text-amber-600" />
                    <span>{isHintVisibleForCurrent ? 'Ẩn gợi ý' : 'Hiện gợi ý'}</span>
                  </button>
                </div>

                {isHintVisibleForCurrent && (
                  <div className="bg-amber-50/80 border border-amber-200 rounded-xl p-4 text-xs sm:text-sm text-amber-950 space-y-1">
                    <div className="font-bold text-amber-900">
                      Gợi ý (Bản dịch & Cấu trúc ngữ pháp liên quan):
                    </div>
                    <div className="leading-relaxed">{currentQuestion.hintVi}</div>
                  </div>
                )}
              </div>
            )}

            <div className="text-lg sm:text-xl font-bold text-slate-900 leading-snug">
              <FormattedQuestionStem text={currentQuestion.stem} />
            </div>

            {currentQuestion.subLines && currentQuestion.subLines.length > 0 && (
              <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-4 space-y-2 text-sm sm:text-base text-slate-800">
                {currentQuestion.subLines.map((line, idx) => (
                  <div key={idx}>{line}</div>
                ))}
              </div>
            )}
          </div>

          {/* Options List */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {currentQuestion.options.map((opt) => {
              const isSelected = chosenForCurrent === opt.label;
              const isConfirmed = Boolean(confirmStateForCurrent?.confirmed);
              const isVerifiedCorrect =
                isConfirmed &&
                currentQuestion.isVerified &&
                currentQuestion.verifiedAnswer === opt.label;
              const isConfirmedWrong =
                isConfirmed &&
                isSelected &&
                currentQuestion.isVerified &&
                currentQuestion.verifiedAnswer !== opt.label;

              return (
                <button
                  key={opt.label}
                  type="button"
                  aria-label={`Phương án ${opt.label}: ${opt.text}`}
                  disabled={isConfirmed}
                  onClick={() => handleSelectOption(opt.label)}
                  className={`text-left p-4 rounded-xl border transition-colors flex items-center justify-between gap-3 ${
                    isVerifiedCorrect
                      ? 'bg-emerald-50 border-emerald-600 text-emerald-950 font-semibold'
                      : isConfirmedWrong
                      ? 'bg-rose-50 border-rose-500 text-rose-950 font-semibold'
                      : isSelected
                      ? 'bg-sky-50 border-sky-600 text-sky-950 font-semibold ring-1 ring-sky-600'
                      : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-800'
                  }`}
                >
                  <span className="text-sm sm:text-base">
                    <strong className="mr-2">{opt.label}.</strong>
                    {opt.text}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Practice Mode Immediate Feedback when wrong or when question has no correct option in source */}
          {selectedMode === 'practice' && isCurrentQuestionConfirmed && (
            <div className="space-y-4 pt-2 border-t border-slate-100">
              {currentQuestion.hasNoCorrectOptionInSource ? (
                <div className="bg-amber-50 border border-amber-300 rounded-xl p-4 space-y-2">
                  <div className="text-sm sm:text-base font-bold text-amber-950 flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
                    <span>Không có đáp án đúng trong đề cương!</span>
                  </div>
                  <p className="text-xs sm:text-sm text-amber-950 leading-relaxed">
                    {currentQuestion.suggestedReplacementVi || currentQuestion.verificationBasis}
                  </p>
                  <div className="pt-2">
                    {currentQuestionIndex < currentExam.totalQuestions - 1 ? (
                      <button
                        type="button"
                        onClick={() =>
                          setCurrentQuestionIndex((prev) =>
                            Math.min(currentExam.totalQuestions - 1, prev + 1)
                          )
                        }
                        className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs sm:text-sm font-semibold rounded-xl transition-colors"
                      >
                        Đã hiểu – Câu tiếp theo
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setShowSubmitConfirmModal(true)}
                        className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs sm:text-sm font-semibold rounded-xl transition-colors"
                      >
                        Đã hiểu – Hoàn thành lượt ôn tập
                      </button>
                    )}
                  </div>
                </div>
              ) : confirmStateForCurrent?.isCorrectFirstTry === false ? (
                <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 space-y-2">
                  <div className="text-base font-bold text-rose-900 flex items-center gap-2">
                    <XCircle className="w-5 h-5 text-rose-600" />
                    <span>Chưa chính xác!</span>
                  </div>
                  <div className="text-xs sm:text-sm text-rose-900">
                    Đáp án đúng là: <strong>{currentQuestion.verifiedAnswer}</strong>
                  </div>
                  {currentQuestion.relatedTopicTitle && (
                    <div className="text-xs font-semibold text-rose-800">
                      Chủ điểm kiến thức liên quan: {currentQuestion.relatedTopicTitle}
                    </div>
                  )}
                  <div className="text-xs sm:text-sm text-slate-800 leading-relaxed">
                    {currentQuestion.verificationBasis}
                  </div>
                  <div className="pt-2">
                    {currentQuestionIndex < currentExam.totalQuestions - 1 ? (
                      <button
                        type="button"
                        onClick={() =>
                          setCurrentQuestionIndex((prev) =>
                            Math.min(currentExam.totalQuestions - 1, prev + 1)
                          )
                        }
                        className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs sm:text-sm font-semibold rounded-xl transition-colors"
                      >
                        Đã hiểu – Câu tiếp theo
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setShowSubmitConfirmModal(true)}
                        className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs sm:text-sm font-semibold rounded-xl transition-colors"
                      >
                        Đã hiểu – Hoàn thành lượt ôn tập
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 space-y-1.5">
                  <div className="text-sm font-bold text-emerald-900 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>
                      Chính xác! Đáp án đúng: {currentQuestion.verifiedAnswer}
                    </span>
                  </div>
                  <div className="text-xs sm:text-sm text-slate-700">
                    {currentQuestion.verificationBasis}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Bottom Navigation & Draft Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={currentQuestionIndex === 0}
            onClick={() => setCurrentQuestionIndex((prev) => Math.max(0, prev - 1))}
            className="px-4 py-2.5 bg-white border border-slate-300 hover:bg-slate-50 disabled:opacity-40 disabled:pointer-events-none text-slate-800 text-xs sm:text-sm font-semibold rounded-xl transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Câu trước</span>
          </button>

          <button
            type="button"
            disabled={currentQuestionIndex >= currentExam.totalQuestions - 1}
            onClick={() =>
              setCurrentQuestionIndex((prev) =>
                Math.min(currentExam.totalQuestions - 1, prev + 1)
              )
            }
            className="px-4 py-2.5 bg-white border border-slate-300 hover:bg-slate-50 disabled:opacity-40 disabled:pointer-events-none text-slate-800 text-xs sm:text-sm font-semibold rounded-xl transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0"
          >
            <span>Câu tiếp theo</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={handleManualSaveDraft}
            className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs sm:text-sm font-semibold rounded-xl transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0"
          >
            <Save className="w-4 h-4 text-sky-600" />
            <span>Lưu bản nháp</span>
          </button>

          <button
            type="button"
            onClick={() => setStage('review_grid')}
            className="px-4 py-2.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-800 text-xs sm:text-sm font-semibold rounded-xl transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0"
          >
            <Eye className="w-4 h-4 text-slate-600" />
            <span>Xem lại bài</span>
          </button>

          <button
            type="button"
            onClick={() => setShowSubmitConfirmModal(true)}
            className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-semibold rounded-xl transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0"
          >
            <Send className="w-4 h-4" />
            <span>Nộp bài</span>
          </button>
        </div>
      </div>

      {/* Submit Confirmation Modal */}
      {showSubmitConfirmModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="submit-modal-title"
          className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4"
        >
          <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-lg">
            <h2 id="submit-modal-title" className="text-lg font-bold text-slate-900">
              Xác nhận nộp bài
            </h2>
            <p className="text-sm text-slate-600 leading-relaxed">
              Bạn đã trả lời{' '}
              <strong>
                {Object.keys(selectedAnswers).length} / {currentExam.totalQuestions}
              </strong>{' '}
              câu hỏi trong <strong>{currentExam.title}</strong>.
            </p>
            {currentExam.totalQuestions - Object.keys(selectedAnswers).length > 0 && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs sm:text-sm text-amber-900 font-medium">
                Cảnh báo: Bạn còn{' '}
                <strong>
                  {currentExam.totalQuestions - Object.keys(selectedAnswers).length} câu chưa trả
                  lời
                </strong>
                . Bạn có chắc chắn muốn nộp bài ngay bây giờ không?
              </div>
            )}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowSubmitConfirmModal(false)}
                className="px-4 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-sm font-semibold rounded-xl transition-colors"
              >
                Tiếp tục làm bài
              </button>
              <button
                type="button"
                onClick={finalizeAndSubmitExam}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-xl transition-colors"
              >
                Xác nhận nộp bài
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
