import React, { useState, useMemo } from 'react';
import {
  Trash2,
  Eye,
  CheckCircle2,
  XCircle,
  HelpCircle,
  ArrowLeft,
  FileCheck2,
} from 'lucide-react';
import { AppView, AttemptHistoryRecord } from '../types';
import { EXAM_PAPERS } from '../data/examsData';
import { evaluateSingleQuestion, formatDurationVi } from '../utils/scoring';
import { FormattedQuestionStem } from './FormattedQuestionStem';

interface HistoryViewProps {
  history: AttemptHistoryRecord[];
  onDeleteHistoryItem: (id: string) => void;
  onNavigate: (view: AppView) => void;
}

export const HistoryView: React.FC<HistoryViewProps> = ({
  history,
  onDeleteHistoryItem,
  onNavigate,
}) => {
  const [filterExamId, setFilterExamId] = useState<string>('all');
  const [filterMode, setFilterMode] = useState<string>('all');
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');
  const [selectedRecordId, setSelectedRecordId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const filteredRecords = useMemo(() => {
    const list = history.filter((item) => {
      if (filterExamId !== 'all' && item.examId !== filterExamId) return false;
      if (filterMode !== 'all' && item.mode !== filterMode) return false;
      return true;
    });

    return [...list].sort((a, b) => {
      const tA = new Date(a.completedAt).getTime();
      const tB = new Date(b.completedAt).getTime();
      return sortOrder === 'newest' ? tB - tA : tA - tB;
    });
  }, [history, filterExamId, filterMode, sortOrder]);

  const selectedRecord = useMemo(() => {
    if (!selectedRecordId) return null;
    return history.find((r) => r.id === selectedRecordId) || null;
  }, [history, selectedRecordId]);

  if (selectedRecord) {
    const examPaper = EXAM_PAPERS.find((e) => e.id === selectedRecord.examId);
    return (
      <div className="space-y-6">
        <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 space-y-4">
          <button
            type="button"
            onClick={() => setSelectedRecordId(null)}
            className="text-xs font-semibold text-sky-700 hover:text-sky-800 flex items-center gap-1"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Quay lại danh sách lịch sử</span>
          </button>

          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="space-y-1">
              <div className="text-xs text-slate-500 font-mono">
                Mã lượt làm bài: {selectedRecord.id} · Hoàn thành:{' '}
                {new Date(selectedRecord.completedAt).toLocaleString('vi-VN')}
              </div>
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
                {selectedRecord.examTitle}
              </h1>
              <div className="text-xs sm:text-sm text-slate-600">
                <span>
                  Chế độ:{' '}
                  {selectedRecord.mode === 'practice' ? 'Chế độ ôn tập' : 'Chế độ thi thử'}
                </span>
                <span className="mx-2" aria-hidden="true">·</span>
                <span>Trạng thái: Đã hoàn thành</span>
                <span className="mx-2" aria-hidden="true">·</span>
                <span>Thời gian làm bài: {formatDurationVi(selectedRecord.elapsedSeconds)}</span>
              </div>
            </div>

            <div className="bg-sky-50 border border-sky-200 rounded-xl px-4 py-3 text-right">
              <div className="text-xs text-sky-800">
                Điểm ({selectedRecord.verifiedGradableCount} câu xác minh)
              </div>
              <div className="text-xl font-bold font-mono tabular-nums text-sky-950">
                {selectedRecord.scoreOutOf10 !== null
                  ? `${selectedRecord.scoreOutOf10.toFixed(1)} / 10`
                  : '—'}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-2 border-t border-slate-100 text-xs sm:text-sm">
            <div className="bg-slate-50 rounded-xl p-3">
              <span className="text-slate-500 block text-xs">Đã trả lời</span>
              <strong className="font-mono tabular-nums">
                {selectedRecord.answeredCount} / {selectedRecord.totalQuestions}
              </strong>
            </div>
            <div className="bg-emerald-50 rounded-xl p-3">
              <span className="text-emerald-800 block text-xs">Số câu đúng</span>
              <strong className="font-mono tabular-nums text-emerald-950">
                {selectedRecord.correctCount}
              </strong>
            </div>
            <div className="bg-rose-50 rounded-xl p-3">
              <span className="text-rose-800 block text-xs">Số câu sai</span>
              <strong className="font-mono tabular-nums text-rose-950">
                {selectedRecord.incorrectCount}
              </strong>
            </div>
            <div className="bg-slate-50 rounded-xl p-3">
              <span className="text-slate-500 block text-xs">Chưa trả lời</span>
              <strong className="font-mono tabular-nums">{selectedRecord.unansweredCount}</strong>
            </div>
            <div className="bg-amber-50 rounded-xl p-3">
              <span className="text-amber-800 block text-xs">Tỷ lệ chính xác</span>
              <strong className="font-mono tabular-nums text-amber-950">
                {selectedRecord.accuracyPercent !== null
                  ? `${selectedRecord.accuracyPercent}%`
                  : '—'}
              </strong>
            </div>
          </div>
        </div>

        {/* Detailed Answers List */}
        {examPaper && (
          <div className="space-y-4">
            {examPaper.questions.map((q) => {
              const userChoice = selectedRecord.selectedAnswers[q.id] ?? null;
              const detail = evaluateSingleQuestion(q, userChoice);
              return (
                <div
                  key={q.id}
                  className="bg-white border border-slate-200 rounded-2xl p-5 space-y-3"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs border-b border-slate-100 pb-2">
                    <span className="font-bold text-slate-500">Câu {q.number}</span>
                    <div>
                      {detail.status === 'correct' && (
                        <span className="text-emerald-700 font-semibold flex items-center gap-1">
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Bạn chọn {userChoice} (Chính xác!)</span>
                        </span>
                      )}
                      {detail.status === 'incorrect' && (
                        <span className="text-rose-700 font-semibold flex items-center gap-1">
                          <XCircle className="w-4 h-4" />
                          <span>
                            Bạn chọn {userChoice} · Đáp án xác minh: {q.verifiedAnswer}
                          </span>
                        </span>
                      )}
                      {detail.status === 'unanswered' && (
                        <span className="text-slate-500">
                          Chưa chọn đáp án{' '}
                          {q.isVerified && q.verifiedAnswer
                            ? `· Đáp án xác minh: ${q.verifiedAnswer}`
                            : '· Chưa xác minh đáp án'}
                        </span>
                      )}
                      {detail.status === 'unverified' && (
                        <span className="text-amber-700 font-semibold flex items-center gap-1">
                          <HelpCircle className="w-4 h-4" />
                          <span>
                            Bạn chọn {userChoice} ·{' '}
                            {q.hasNoCorrectOptionInSource
                              ? 'Không có đáp án đúng trong đề cương'
                              : 'Chưa xác minh đáp án từ tài liệu'}
                          </span>
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="text-sm sm:text-base font-semibold text-slate-900">
                    <FormattedQuestionStem text={q.stem} />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs sm:text-sm">
                    {q.options.map((opt) => {
                      const isPicked = userChoice === opt.label;
                      const isCorrectOpt = q.isVerified && q.verifiedAnswer === opt.label;
                      return (
                        <div
                          key={opt.label}
                          className={`p-2.5 rounded-lg border ${
                            isCorrectOpt
                              ? 'bg-emerald-50 border-emerald-500 text-emerald-950 font-semibold'
                              : isPicked && detail.status === 'incorrect'
                              ? 'bg-rose-50 border-rose-400 text-rose-950'
                              : isPicked
                              ? 'bg-sky-50 border-sky-400 text-sky-950 font-medium'
                              : 'bg-white border-slate-200 text-slate-700'
                          }`}
                        >
                          <strong>{opt.label}.</strong> {opt.text}
                        </div>
                      );
                    })}
                  </div>
                  <div className="text-xs text-slate-600 bg-slate-50 p-3 rounded-lg space-y-1">
                    {q.hasNoCorrectOptionInSource && q.suggestedReplacementVi && (
                      <div className="font-semibold text-amber-900">
                        Không có đáp án đúng trong đề cương — {q.suggestedReplacementVi}
                      </div>
                    )}
                    <div>{q.verificationBasis}</div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 space-y-4">
        <div className="space-y-1">
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Lịch sử làm bài</h1>
          <p className="text-sm text-slate-600">
            Mỗi lượt luyện đề hoàn thành được lưu thành một bản ghi độc lập để bạn theo dõi tiến
            bộ và xem lại chi tiết bài làm.
          </p>
        </div>

        {/* Filter & Sort Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-100">
          <div>
            <label
              htmlFor="history-exam-filter"
              className="block text-xs font-semibold text-slate-600 mb-1"
            >
              Lọc theo tên đề
            </label>
            <select
              id="history-exam-filter"
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
              htmlFor="history-mode-filter"
              className="block text-xs font-semibold text-slate-600 mb-1"
            >
              Lọc theo chế độ làm bài
            </label>
            <select
              id="history-mode-filter"
              value={filterMode}
              onChange={(e) => setFilterMode(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-800"
            >
              <option value="all">Tất cả chế độ</option>
              <option value="practice">Chế độ ôn tập</option>
              <option value="mock">Chế độ thi thử</option>
            </select>
          </div>

          <div>
            <label
              htmlFor="history-sort-order"
              className="block text-xs font-semibold text-slate-600 mb-1"
            >
              Sắp xếp theo thời gian
            </label>
            <select
              id="history-sort-order"
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value as 'newest' | 'oldest')}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-800"
            >
              <option value="newest">Mới nhất trước</option>
              <option value="oldest">Cũ nhất trước</option>
            </select>
          </div>
        </div>
      </div>

      {filteredRecords.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center space-y-4">
          <div className="text-base font-bold text-slate-800">
            Chưa có lịch sử làm bài phù hợp
          </div>
          <p className="text-sm text-slate-500 max-w-md mx-auto">
            Ứng dụng không tạo lịch sử mẫu. Hãy hoàn thành và nộp một bài luyện đề để kết quả được
            lưu vào lịch sử của bạn.
          </p>
          <button
            type="button"
            onClick={() => onNavigate('exam')}
            className="px-5 py-2.5 bg-sky-600 hover:bg-sky-700 text-white text-sm font-semibold rounded-xl transition-colors inline-flex items-center gap-2"
          >
            <FileCheck2 className="w-4 h-4" />
            <span>Bắt đầu luyện đề</span>
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredRecords.map((rec) => (
            <div
              key={rec.id}
              className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-4"
            >
              <div className="space-y-1.5">
                <div className="text-xs text-slate-500 font-mono">
                  <span>Mã: {rec.id}</span>
                  <span className="mx-2" aria-hidden="true">·</span>
                  <span>{new Date(rec.completedAt).toLocaleString('vi-VN')}</span>
                  <span className="mx-2" aria-hidden="true">·</span>
                  <span className="font-sans font-semibold text-sky-700">
                    {rec.mode === 'practice' ? 'Chế độ ôn tập' : 'Chế độ thi thử'}
                  </span>
                </div>
                <h2 className="text-base sm:text-lg font-bold text-slate-900">{rec.examTitle}</h2>
                <div className="text-xs sm:text-sm text-slate-600 font-mono tabular-nums">
                  <span>
                    Điểm:{' '}
                    <strong className="text-slate-900">
                      {rec.scoreOutOf10 !== null ? `${rec.scoreOutOf10.toFixed(1)}/10` : '—'}
                    </strong>
                  </span>
                  <span className="mx-2" aria-hidden="true">·</span>
                  <span>Đúng: {rec.correctCount}</span>
                  <span className="mx-2" aria-hidden="true">·</span>
                  <span>Sai: {rec.incorrectCount}</span>
                  <span className="mx-2" aria-hidden="true">·</span>
                  <span>Chưa trả lời: {rec.unansweredCount}</span>
                  <span className="mx-2" aria-hidden="true">·</span>
                  <span>Thời gian: {formatDurationVi(rec.elapsedSeconds)}</span>
                </div>
              </div>

              <div className="flex items-center gap-2.5 shrink-0">
                <button
                  type="button"
                  onClick={() => setSelectedRecordId(rec.id)}
                  className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white text-xs sm:text-sm font-semibold rounded-xl transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0"
                >
                  <Eye className="w-4 h-4" />
                  <span>Xem chi tiết</span>
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmDeleteId(rec.id)}
                  aria-label={`Xóa lịch sử ${rec.id}`}
                  className="px-3.5 py-2 bg-white border border-slate-300 hover:bg-rose-50 hover:border-rose-300 hover:text-rose-700 text-slate-700 text-xs sm:text-sm font-semibold rounded-xl transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Xóa</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {confirmDeleteId && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4"
        >
          <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-lg">
            <h2 className="text-lg font-bold text-slate-900">Xác nhận xóa lượt lịch sử</h2>
            <p className="text-sm text-slate-600">
              Bạn có chắc chắn muốn xóa bản ghi lịch sử làm bài này không? Thao tác này không thể
              hoàn tác.
            </p>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setConfirmDeleteId(null)}
                className="px-4 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-sm font-semibold rounded-xl"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={() => {
                  onDeleteHistoryItem(confirmDeleteId);
                  setConfirmDeleteId(null);
                }}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-sm font-semibold rounded-xl"
              >
                Xác nhận xóa
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
