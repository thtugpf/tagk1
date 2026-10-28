import React, { useState } from 'react';
import { PlayCircle, Trash2, AlertTriangle, FileCheck2 } from 'lucide-react';
import { AppView, DraftSession } from '../types';
import { formatDurationVi } from '../utils/scoring';

interface DraftsViewProps {
  drafts: DraftSession[];
  corruptedDraftWarning: boolean;
  onResumeDraft: (draft: DraftSession) => void;
  onDeleteDraft: (draftId: string) => void;
  onNavigate: (view: AppView) => void;
}

export const DraftsView: React.FC<DraftsViewProps> = ({
  drafts,
  corruptedDraftWarning,
  onResumeDraft,
  onDeleteDraft,
  onNavigate,
}) => {
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  return (
    <div className="space-y-6">
      <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 space-y-2">
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Bản nháp đang làm</h1>
        <p className="text-sm text-slate-600">
          Quản lý và tiếp tục các bài luyện đề chưa hoàn thành. Bản nháp lưu giữ nguyên vị trí câu
          hỏi hiện tại, các phương án đã chọn và trạng thái câu đã xác nhận.
        </p>
      </div>

      {corruptedDraftWarning && (
        <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 text-xs sm:text-sm text-rose-900 flex items-start gap-2.5">
          <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div>
            <strong>Cảnh báo khôi phục bản nháp:</strong> Phát hiện một số dữ liệu bản nháp bị lỗi
            định dạng trong bộ nhớ trình duyệt và không thể khôi phục đầy đủ.
          </div>
        </div>
      )}

      {drafts.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center space-y-4">
          <div className="text-base font-bold text-slate-800">
            Hiện không có bản nháp nào đang lưu
          </div>
          <p className="text-sm text-slate-500 max-w-md mx-auto">
            Khi đang làm bài ở chế độ ôn tập hoặc chế độ thi thử, bạn có thể bấm nút &ldquo;Lưu bản nháp&rdquo;
            để lưu tiến trình tại đây.
          </p>
          <button
            type="button"
            onClick={() => onNavigate('exam')}
            className="px-5 py-2.5 bg-sky-600 hover:bg-sky-700 text-white text-sm font-semibold rounded-xl transition-colors inline-flex items-center gap-2"
          >
            <FileCheck2 className="w-4 h-4" />
            <span>Bắt đầu luyện đề mới</span>
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {drafts.map((draft) => {
            const answeredCount = Object.keys(draft.selectedAnswers || {}).length;
            const confirmedCount = Object.values(draft.confirmedQuestions || {}).filter(
              (c) => c.confirmed
            ).length;
            const correctFirstTryCount = Object.values(draft.confirmedQuestions || {}).filter(
              (c) => c.confirmed && c.isVerified && c.isCorrectFirstTry === true
            ).length;
            const wrongFirstTryCount = Object.values(draft.confirmedQuestions || {}).filter(
              (c) => c.confirmed && c.isVerified && c.isCorrectFirstTry === false
            ).length;

            return (
              <div
                key={draft.id}
                className="bg-white border border-slate-200 rounded-2xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="space-y-1.5">
                  <div className="text-xs font-semibold text-sky-700">
                    <span>
                      {draft.mode === 'practice' ? 'Chế độ ôn tập' : 'Chế độ thi thử'}
                    </span>
                    <span className="mx-2" aria-hidden="true">·</span>
                    <span>
                      Cập nhật lúc: {new Date(draft.updatedAt).toLocaleString('vi-VN')}
                    </span>
                  </div>
                  <h2 className="text-lg font-bold text-slate-900">{draft.examTitle}</h2>
                  <div className="text-xs sm:text-sm text-slate-600">
                    <span>Vị trí đang làm: Câu {draft.currentQuestionIndex + 1}</span>
                    <span className="mx-2" aria-hidden="true">·</span>
                    <span>Số câu đã chọn đáp án: {answeredCount} / 50</span>
                    <span className="mx-2" aria-hidden="true">·</span>
                    <span>Thời gian đã làm: {formatDurationVi(draft.elapsedSeconds)}</span>
                  </div>
                  {draft.mode === 'practice' && (
                    <div className="text-xs text-slate-500">
                      <span>Đã xác nhận: {confirmedCount} câu</span>
                      <span className="mx-2" aria-hidden="true">·</span>
                      <span>Đúng lần đầu: {correctFirstTryCount}</span>
                      <span className="mx-2" aria-hidden="true">·</span>
                      <span>Sai lần đầu: {wrongFirstTryCount}</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <button
                    type="button"
                    onClick={() => onResumeDraft(draft)}
                    className="px-4 py-2.5 bg-sky-600 hover:bg-sky-700 text-white text-xs sm:text-sm font-semibold rounded-xl transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0"
                  >
                    <PlayCircle className="w-4 h-4" />
                    <span>Tiếp tục làm bài</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmDeleteId(draft.id)}
                    aria-label={`Xóa bản nháp ${draft.examTitle}`}
                    className="px-3.5 py-2.5 bg-white border border-slate-300 hover:bg-rose-50 hover:border-rose-300 hover:text-rose-700 text-slate-700 text-xs sm:text-sm font-semibold rounded-xl transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Xóa bản nháp</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Confirmation Dialog for Deleting a Draft */}
      {confirmDeleteId && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4"
        >
          <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-lg">
            <h2 className="text-lg font-bold text-slate-900">Xác nhận xóa bản nháp</h2>
            <p className="text-sm text-slate-600">
              Bạn có chắc chắn muốn xóa bản nháp này không? Toàn bộ đáp án đã chọn trong bản nháp
              này sẽ bị xóa vĩnh viễn.
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
                  onDeleteDraft(confirmDeleteId);
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
