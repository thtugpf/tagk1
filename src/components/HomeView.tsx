import React from 'react';
import {
  BookOpen,
  Layers,
  FileCheck2,
  Clock,
  Award,
  CheckCircle2,
  ArrowRight,
  PlayCircle,
  BarChart3,
  FileText,
  Sparkles,
} from 'lucide-react';
import { AppView, AttemptHistoryRecord, DraftSession, StudyProgressState } from '../types';
import { VOCABULARY_DATA, GRAMMAR_DATA, SENTENCE_STRUCTURES_DATA, DOCUMENT_HEADER } from '../data/curriculumData';
import { EXAM_PAPERS } from '../data/examsData';
import { computeAggregateStatistics, formatDurationVi } from '../utils/scoring';

interface HomeViewProps {
  onNavigate: (view: AppView) => void;
  onResumeDraft: (draft: DraftSession) => void;
  onStartExamDirect: (examId: string, mode: 'practice' | 'mock') => void;
  drafts: DraftSession[];
  history: AttemptHistoryRecord[];
  progress: StudyProgressState;
}

export const HomeView: React.FC<HomeViewProps> = ({
  onNavigate,
  onResumeDraft,
  onStartExamDirect,
  drafts,
  history,
  progress,
}) => {
  const stats = computeAggregateStatistics(history);

  const reviewedVocabCount = Object.values(progress.vocabStatus).filter(
    (s) => s === 'reviewed'
  ).length;
  const totalTheoryItems =
    VOCABULARY_DATA.length + GRAMMAR_DATA.length + SENTENCE_STRUCTURES_DATA.length;
  const completedTheoryItems =
    reviewedVocabCount +
    progress.reviewedGrammarIds.length +
    progress.reviewedStructureIds.length;
  const theoryProgressPercent =
    totalTheoryItems > 0 ? Math.round((completedTheoryItems / totalTheoryItems) * 100) : 0;

  const latestDraft = drafts.length > 0 ? drafts[0] : null;

  return (
    <div className="space-y-8">
      {/* Hero Banner */}
      <section className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-xs">
        <div className="max-w-4xl space-y-4">
          <div className="text-xs font-medium text-sky-700">
            <span>{DOCUMENT_HEADER.mainTitle}</span>
            <span className="mx-2" aria-hidden="true">·</span>
            <span>{DOCUMENT_HEADER.subTitle}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight text-balance">
            ENGLISH MIDTERM I – ÔN TẬP VÀ LUYỆN ĐỀ
          </h1>
          <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
            Chào mừng bạn đến với ứng dụng ôn tập và luyện đề kiểm tra giữa học kì I môn Tiếng Anh.
            Toàn bộ từ vựng, lý thuyết ngữ pháp, cấu trúc câu và 2 đề ôn luyện (100 câu hỏi) được
            trích xuất nguyên văn từ tài liệu <span className="font-medium text-slate-800">ĐỀ CƯƠNG + ĐỀ MẪU.pdf</span>.
          </p>

          <div className="pt-2 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => onNavigate('theory')}
              className="px-5 py-2.5 bg-sky-600 hover:bg-sky-700 text-white font-semibold text-sm rounded-xl transition-colors flex items-center gap-2 whitespace-nowrap shrink-0"
            >
              <BookOpen className="w-4 h-4" />
              <span>Bắt đầu ôn tập</span>
            </button>
            <button
              type="button"
              onClick={() => onNavigate('flashcards')}
              className="px-4 py-2.5 bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 font-semibold text-sm rounded-xl transition-colors flex items-center gap-2 whitespace-nowrap shrink-0"
            >
              <Layers className="w-4 h-4 text-sky-600" />
              <span>Học từ vựng</span>
            </button>
            <button
              type="button"
              onClick={() => onNavigate('grammar')}
              className="px-4 py-2.5 bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 font-semibold text-sm rounded-xl transition-colors flex items-center gap-2 whitespace-nowrap shrink-0"
            >
              <FileText className="w-4 h-4 text-emerald-600" />
              <span>Ôn ngữ pháp</span>
            </button>
            <button
              type="button"
              onClick={() => onNavigate('exam')}
              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm rounded-xl transition-colors flex items-center gap-2 whitespace-nowrap shrink-0"
            >
              <FileCheck2 className="w-4 h-4" />
              <span>Luyện đề</span>
            </button>
            {latestDraft && (
              <button
                type="button"
                onClick={() => onResumeDraft(latestDraft)}
                className="px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-semibold text-sm rounded-xl transition-colors flex items-center gap-2 whitespace-nowrap shrink-0"
              >
                <PlayCircle className="w-4 h-4" />
                <span>Tiếp tục bài đang làm</span>
              </button>
            )}
          </div>
        </div>
      </section>

      {/* Quick Statistics Strip */}
      <section aria-label="Thống kê nhanh" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-1">
          <div className="flex items-center justify-between text-xs font-medium text-slate-500">
            <span>Số lượt làm bài</span>
            <FileCheck2 className="w-4 h-4 text-sky-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900 font-mono tabular-nums">
            {stats.totalAttempts}
          </div>
          <div className="text-xs text-slate-500">
            <span>Ôn tập: {stats.practiceAttempts}</span>
            <span className="mx-1.5" aria-hidden="true">·</span>
            <span>Thi thử: {stats.mockAttempts}</span>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-1">
          <div className="flex items-center justify-between text-xs font-medium text-slate-500">
            <span>Số câu đã trả lời</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900 font-mono tabular-nums">
            {stats.totalAnswered}
          </div>
          <div className="text-xs text-slate-500">
            <span>Đúng: {stats.totalCorrect}</span>
            <span className="mx-1.5" aria-hidden="true">·</span>
            <span>Sai: {stats.totalIncorrect}</span>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-1">
          <div className="flex items-center justify-between text-xs font-medium text-slate-500">
            <span>Điểm cao nhất (câu đã xác minh)</span>
            <Award className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900 font-mono tabular-nums">
            {stats.highestScore !== null ? `${stats.highestScore.toFixed(1)} / 10` : 'Chưa có'}
          </div>
          <div className="text-xs text-slate-500">
            <span>
              Tỷ lệ chính xác:{' '}
              {stats.overallAccuracyPercent !== null ? `${stats.overallAccuracyPercent}%` : '—'}
            </span>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-1">
          <div className="flex items-center justify-between text-xs font-medium text-slate-500">
            <span>Tiến độ ôn tập lý thuyết</span>
            <BarChart3 className="w-4 h-4 text-sky-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900 font-mono tabular-nums">
            {theoryProgressPercent}%
          </div>
          <div className="text-xs text-slate-500">
            <span>Đã đánh dấu: {completedTheoryItems}/{totalTheoryItems} mục</span>
          </div>
        </div>
      </section>

      {/* Active Draft Callout if Exists */}
      {latestDraft && (
        <section className="bg-amber-50/70 border border-amber-200 rounded-2xl p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="text-xs font-semibold text-amber-800">
              Bản nháp đang lưu ({drafts.length} bản nháp)
            </div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900">
              {latestDraft.examTitle}
            </h2>
            <div className="text-xs text-slate-600">
              <span>
                Chế độ: {latestDraft.mode === 'practice' ? 'Chế độ ôn tập' : 'Chế độ thi thử'}
              </span>
              <span className="mx-2" aria-hidden="true">·</span>
              <span>Đang ở câu {latestDraft.currentQuestionIndex + 1}</span>
              <span className="mx-2" aria-hidden="true">·</span>
              <span>Đã chọn {Object.keys(latestDraft.selectedAnswers).length} câu</span>
              <span className="mx-2" aria-hidden="true">·</span>
              <span>Thời gian: {formatDurationVi(latestDraft.elapsedSeconds)}</span>
            </div>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={() => onResumeDraft(latestDraft)}
              className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-sm font-semibold rounded-xl transition-colors whitespace-nowrap shrink-0"
            >
              Tiếp tục làm bài
            </button>
            <button
              type="button"
              onClick={() => onNavigate('drafts')}
              className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 text-sm font-medium rounded-xl transition-colors whitespace-nowrap shrink-0"
            >
              Xem tất cả bản nháp
            </button>
          </div>
        </section>
      )}

      {/* Main Feature Cards */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg sm:text-xl font-bold text-slate-900">
            Khu vực học tập và luyện thi
          </h2>
          <a
            href={DOCUMENT_HEADER.pdfPath}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-semibold text-sky-700 hover:text-sky-800 underline whitespace-nowrap"
          >
            Xem tệp PDF gốc đính kèm
          </a>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Card 1: Flashcards */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 flex flex-col justify-between space-y-5">
            <div className="space-y-2">
              <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center">
                <Layers className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900">
                1. Flashcard từ vựng (Unit 1 – 3)
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Ôn tập toàn bộ 30 từ vựng và cụm từ cốt lõi theo từng Unit: mặt trước hiển thị từ
                và từ loại, mặt sau hiển thị nghĩa tiếng Việt và cụm thường gặp / ví dụ nguyên gốc.
              </p>
            </div>
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <span>Đã xem: {progress.viewedVocabIds.length}/{VOCABULARY_DATA.length} thẻ</span>
              <button
                type="button"
                onClick={() => onNavigate('flashcards')}
                className="text-sky-700 font-semibold hover:text-sky-800 flex items-center gap-1"
              >
                <span>Mở Flashcard</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Card 2: Grammar & Sentence Structures */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 flex flex-col justify-between space-y-5">
            <div className="space-y-2">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <BookOpen className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900">
                2. Ngữ pháp & Cấu trúc câu
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Hệ thống hóa Quá khứ đơn & Quá khứ tiếp diễn (When/While), Mạo từ (A/An/The/Ø),
                Động từ đi kèm giới từ và Mệnh đề quan hệ với ", which + V(số ít)".
              </p>
            </div>
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <button
                type="button"
                onClick={() => onNavigate('grammar')}
                className="text-emerald-700 font-semibold hover:text-emerald-800 flex items-center gap-1"
              >
                <span>Ôn ngữ pháp ({GRAMMAR_DATA.length})</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => onNavigate('structures')}
                className="text-sky-700 font-semibold hover:text-sky-800 flex items-center gap-1"
              >
                <span>Cấu trúc câu ({SENTENCE_STRUCTURES_DATA.length})</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Card 3: Exam Practice */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 flex flex-col justify-between space-y-5">
            <div className="space-y-2">
              <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center">
                <FileCheck2 className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900">
                3. Luyện đề (Ôn tập & Thi thử)
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Thực hành 2 đề trong tài liệu gốc (mỗi đề 50 câu hỏi). Hỗ trợ chế độ ôn tập phản
                hồi từng câu và chế độ thi thử chấm điểm sau khi nộp bài.
              </p>
            </div>
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <span>2 đề gốc · 100 câu hỏi</span>
              <button
                type="button"
                onClick={() => onNavigate('exam')}
                className="text-sky-700 font-semibold hover:text-sky-800 flex items-center gap-1"
              >
                <span>Chọn đề ngay</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Available Exam Papers Preview */}
      <section className="space-y-4">
        <h2 className="text-lg sm:text-xl font-bold text-slate-900">
          Danh sách đề trong tài liệu gốc
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {EXAM_PAPERS.map((exam) => (
            <div
              key={exam.id}
              className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4"
            >
              <div className="space-y-1">
                <div className="text-xs text-slate-500">{exam.sourceSubtitle}</div>
                <h3 className="text-base sm:text-lg font-bold text-slate-900">{exam.title}</h3>
                <div className="text-xs text-slate-600">
                  <span>Tổng số câu: {exam.totalQuestions} câu</span>
                  <span className="mx-2" aria-hidden="true">·</span>
                  <span>Đã xác minh đáp án từ nguồn: {exam.verifiedCount} câu</span>
                  <span className="mx-2" aria-hidden="true">·</span>
                  <span>Chưa xác minh đáp án: {exam.unverifiedCount} câu</span>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => onStartExamDirect(exam.id, 'practice')}
                  className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white text-xs sm:text-sm font-semibold rounded-xl transition-colors whitespace-nowrap shrink-0"
                >
                  Làm chế độ ôn tập
                </button>
                <button
                  type="button"
                  onClick={() => onStartExamDirect(exam.id, 'mock')}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-semibold rounded-xl transition-colors whitespace-nowrap shrink-0"
                >
                  Làm chế độ thi thử
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};
