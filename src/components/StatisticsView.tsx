import React, { useState, useMemo } from 'react';
import {
  BarChart3,
  Award,
  CheckCircle2,
  Clock,
  Layers,
  BookOpen,
  FileCheck2,
} from 'lucide-react';
import { AppView, AttemptHistoryRecord, StudyProgressState } from '../types';
import { EXAM_PAPERS } from '../data/examsData';
import {
  VOCABULARY_DATA,
  GRAMMAR_DATA,
  SENTENCE_STRUCTURES_DATA,
} from '../data/curriculumData';
import { computeAggregateStatistics, formatDurationVi } from '../utils/scoring';

interface StatisticsViewProps {
  history: AttemptHistoryRecord[];
  progress: StudyProgressState;
  onNavigate: (view: AppView) => void;
}

export const StatisticsView: React.FC<StatisticsViewProps> = ({
  history,
  progress,
  onNavigate,
}) => {
  const [filterExamId, setFilterExamId] = useState<string>('all');
  const [filterMode, setFilterMode] = useState<string>('all');

  const stats = useMemo(
    () => computeAggregateStatistics(history, filterExamId, filterMode),
    [history, filterExamId, filterMode]
  );

  const filteredHistoryChronological = useMemo(() => {
    return history
      .filter((r) => {
        if (filterExamId !== 'all' && r.examId !== filterExamId) return false;
        if (filterMode !== 'all' && r.mode !== filterMode) return false;
        return true;
      })
      .slice()
      .sort((a, b) => new Date(a.completedAt).getTime() - new Date(b.completedAt).getTime());
  }, [history, filterExamId, filterMode]);

  const reviewedVocabCount = Object.values(progress.vocabStatus).filter(
    (s) => s === 'reviewed'
  ).length;
  const needsReviewVocabCount = Object.values(progress.vocabStatus).filter(
    (s) => s === 'needs_review'
  ).length;

  const totalCombinedSeconds = progress.totalStudySeconds + stats.totalExamSeconds;

  return (
    <div className="space-y-6">
      <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 space-y-4">
        <div className="space-y-1">
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
            Thống kê và theo dõi tiến độ
          </h1>
          <p className="text-sm text-slate-600">
            Số liệu thống kê được tính trực tiếp từ dữ liệu thật của các lượt học lý thuyết và làm
            bài luyện đề đã lưu trên trình duyệt của bạn.
          </p>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
          <div>
            <label
              htmlFor="stats-exam-filter"
              className="block text-xs font-semibold text-slate-600 mb-1"
            >
              Lọc theo đề thi
            </label>
            <select
              id="stats-exam-filter"
              value={filterExamId}
              onChange={(e) => setFilterExamId(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-800"
            >
              <option value="all">Tất cả các đề</option>
              {EXAM_PAPERS.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.title}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="stats-mode-filter"
              className="block text-xs font-semibold text-slate-600 mb-1"
            >
              Lọc theo chế độ làm bài
            </label>
            <select
              id="stats-mode-filter"
              value={filterMode}
              onChange={(e) => setFilterMode(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-800"
            >
              <option value="all">Tất cả chế độ</option>
              <option value="practice">Chế độ ôn tập</option>
              <option value="mock">Chế độ thi thử</option>
            </select>
          </div>
        </div>
      </div>

      {/* Section 1: Theory & Flashcard Progress */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 space-y-4">
        <h2 className="text-base sm:text-lg font-bold text-slate-900">
          1. Tiến độ học lý thuyết & Flashcard từ vựng
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-4 space-y-1">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span>Tiến độ Flashcard đã đánh dấu</span>
              <Layers className="w-4 h-4 text-sky-600" />
            </div>
            <div className="text-xl font-bold font-mono tabular-nums text-slate-900">
              Đã ôn: {reviewedVocabCount} / {VOCABULARY_DATA.length}
            </div>
            <div className="text-xs text-slate-500">
              Đã xem: {progress.viewedVocabIds.length} · Cần ôn lại: {needsReviewVocabCount}
            </div>
          </div>

          <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-4 space-y-1">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span>Chủ điểm ngữ pháp & cấu trúc đã ôn</span>
              <BookOpen className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-xl font-bold font-mono tabular-nums text-slate-900">
              {progress.reviewedGrammarIds.length + progress.reviewedStructureIds.length} /{' '}
              {GRAMMAR_DATA.length + SENTENCE_STRUCTURES_DATA.length}
            </div>
            <div className="text-xs text-slate-500">
              Ngữ pháp: {progress.reviewedGrammarIds.length}/{GRAMMAR_DATA.length} · Cấu trúc câu:{' '}
              {progress.reviewedStructureIds.length}/{SENTENCE_STRUCTURES_DATA.length}
            </div>
          </div>

          <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-4 space-y-1">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span>Tổng thời gian học và làm bài</span>
              <Clock className="w-4 h-4 text-sky-600" />
            </div>
            <div className="text-xl font-bold font-mono tabular-nums text-slate-900">
              {formatDurationVi(totalCombinedSeconds)}
            </div>
            <div className="text-xs text-slate-500">
              Làm đề: {formatDurationVi(stats.totalExamSeconds)}
            </div>
          </div>
        </div>
      </div>

      {/* Section 2: Exam Practice & Mock Test Statistics */}
      {stats.totalAttempts === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center space-y-3">
          <div className="text-base sm:text-lg font-bold text-slate-800">
            Chưa có dữ liệu thống kê
          </div>
          <p className="text-sm text-slate-500 max-w-md mx-auto">
            Chưa có lượt luyện đề nào được hoàn thành theo bộ lọc hiện tại. Hãy hoàn thành ít nhất
            một bài luyện đề để xem thống kê kết quả và biểu đồ điểm số.
          </p>
          <button
            type="button"
            onClick={() => onNavigate('exam')}
            className="px-5 py-2.5 bg-sky-600 hover:bg-sky-700 text-white text-sm font-semibold rounded-xl transition-colors inline-flex items-center gap-2"
          >
            <FileCheck2 className="w-4 h-4" />
            <span>Chuyển tới Luyện đề</span>
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 space-y-5">
            <h2 className="text-base sm:text-lg font-bold text-slate-900">
              2. Thống kê kết quả luyện đề (tách biệt Ôn tập và Thi thử)
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-4 space-y-1">
                <div className="text-xs text-slate-500">Tổng số lượt làm bài đã hoàn thành</div>
                <div className="text-2xl font-bold font-mono tabular-nums text-slate-900">
                  {stats.totalAttempts}
                </div>
                <div className="text-xs text-slate-600">
                  Lượt ôn tập: {stats.practiceAttempts} · Lượt thi thử: {stats.mockAttempts}
                </div>
              </div>

              <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-4 space-y-1">
                <div className="text-xs text-slate-500">Tổng số câu đã trả lời (Đúng / Sai)</div>
                <div className="text-2xl font-bold font-mono tabular-nums text-slate-900">
                  {stats.totalAnswered} câu
                </div>
                <div className="text-xs text-slate-600">
                  Đúng xác nhận: {stats.totalCorrect} · Sai xác nhận: {stats.totalIncorrect}
                </div>
              </div>

              <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-4 space-y-1">
                <div className="text-xs text-slate-500">
                  Tỷ lệ chính xác (trên các câu đã chấm hợp lệ)
                </div>
                <div className="text-2xl font-bold font-mono tabular-nums text-emerald-700">
                  {stats.overallAccuracyPercent !== null
                    ? `${stats.overallAccuracyPercent}%`
                    : '—'}
                </div>
                <div className="text-xs text-slate-600">
                  Công thức: {stats.totalCorrect} / ({stats.totalCorrect} + {stats.totalIncorrect}){' '}
                  × 100%
                </div>
              </div>

              <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-4 space-y-1">
                <div className="text-xs text-slate-500">Điểm cao nhất (trên câu đã xác minh)</div>
                <div className="text-2xl font-bold font-mono tabular-nums text-sky-700">
                  {stats.highestScore !== null ? `${stats.highestScore.toFixed(1)} / 10` : '—'}
                </div>
                <div className="text-xs text-slate-600">
                  Tính trên các câu có đáp án xác minh trong đề
                </div>
              </div>

              <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-4 space-y-1">
                <div className="text-xs text-slate-500">
                  Điểm trung bình thi thử (chấm đầy đủ 100% đề)
                </div>
                <div className="text-lg font-bold font-mono tabular-nums text-slate-900">
                  {stats.averageFullyGradedMockScore !== null
                    ? `${stats.averageFullyGradedMockScore.toFixed(1)} / 10`
                    : 'Chưa đủ căn cứ 50/50 câu'}
                </div>
                <div className="text-xs text-slate-600">
                  Điểm TB thi thử (nhóm câu đã xác minh):{' '}
                  {stats.averageVerifiedMockScore !== null
                    ? `${stats.averageVerifiedMockScore.toFixed(1)} / 10`
                    : '—'}
                </div>
              </div>

              <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-4 space-y-1">
                <div className="text-xs text-slate-500">Thời gian làm đề đã ghi nhận</div>
                <div className="text-2xl font-bold font-mono tabular-nums text-slate-900">
                  {formatDurationVi(stats.totalExamSeconds)}
                </div>
                <div className="text-xs text-slate-600">
                  Không tính câu chưa trả lời/chưa xác minh là câu sai
                </div>
              </div>
            </div>
          </div>

          {/* Score Chart over Time */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 space-y-4">
            <h2 className="text-base sm:text-lg font-bold text-slate-900">
              3. Biểu đồ điểm số theo thời gian ({filteredHistoryChronological.length} lượt)
            </h2>
            <div className="space-y-3">
              {filteredHistoryChronological.map((rec, idx) => {
                const scoreVal = rec.scoreOutOf10 ?? 0;
                const widthPercent = Math.min(100, Math.max(4, scoreVal * 10));
                return (
                  <div key={rec.id} className="space-y-1">
                    <div className="flex flex-wrap items-center justify-between text-xs text-slate-600">
                      <span>
                        Lượt {idx + 1}: <strong>{rec.examTitle}</strong> (
                        {rec.mode === 'practice' ? 'Ôn tập' : 'Thi thử'}) ·{' '}
                        {new Date(rec.completedAt).toLocaleString('vi-VN')}
                      </span>
                      <span className="font-mono font-bold text-slate-900 tabular-nums">
                        {rec.scoreOutOf10 !== null ? `${rec.scoreOutOf10.toFixed(1)} / 10` : '—'} (
                        {rec.accuracyPercent !== null ? `${rec.accuracyPercent}%` : '—'})
                      </span>
                    </div>
                    <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          rec.mode === 'mock' ? 'bg-emerald-600' : 'bg-sky-600'
                        }`}
                        style={{ width: `${widthPercent}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
