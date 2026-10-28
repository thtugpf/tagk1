import React, { useState } from 'react';
import { Download, Trash2, CheckCircle2, FileText, Settings } from 'lucide-react';
import { UserSettings } from '../types';
import { createBackupPayload } from '../utils/storage';
import { DOCUMENT_HEADER } from '../data/curriculumData';

interface SettingsViewProps {
  settings: UserSettings;
  onUpdateSettings: (next: UserSettings) => void;
  onClearAllData: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  settings,
  onUpdateSettings,
  onClearAllData,
}) => {
  const [showConfirmClear, setShowConfirmClear] = useState<boolean>(false);
  const [statusNotice, setStatusNotice] = useState<string | null>(null);

  const handleExportJson = () => {
    try {
      const payload = createBackupPayload();
      const blob = new Blob([JSON.stringify(payload, null, 2)], {
        type: 'application/json;charset=utf-8',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `sao-luu-on-tap-tieng-anh-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setStatusNotice('Đã xuất tệp sao lưu JSON thành công.');
      window.setTimeout(() => setStatusNotice(null), 3000);
    } catch (err) {
      console.error('Lỗi xuất JSON:', err);
      setStatusNotice('Không thể xuất dữ liệu sao lưu.');
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 space-y-6">
        <div className="space-y-1 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2 text-sky-700 text-xs font-semibold">
            <Settings className="w-4 h-4" />
            <span>Quản lý tùy chọn cá nhân & Bộ nhớ trình duyệt</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Cài đặt cơ bản</h1>
          <p className="text-sm text-slate-600">
            Dữ liệu học tập, bản nháp và lịch sử làm bài được lưu cục bộ trên trình duyệt hiện tại
            (localStorage). Dữ liệu không tự động đồng bộ qua đám mây hay thiết bị khác.
          </p>
        </div>

        {statusNotice && (
          <div
            role="status"
            className="bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-xl px-4 py-3 text-xs sm:text-sm font-semibold flex items-center gap-2"
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{statusNotice}</span>
          </div>
        )}

        {/* Display & Behavior Preferences */}
        <div className="space-y-4">
          <h2 className="text-base font-bold text-slate-900">1. Tùy chọn hiển thị và làm bài</h2>

          <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-slate-50 border border-slate-200/80 rounded-xl">
            <div className="space-y-0.5">
              <div className="text-sm font-semibold text-slate-900">Cỡ chữ hiển thị</div>
              <div className="text-xs text-slate-500">
                Điều chỉnh kích thước chữ câu hỏi và lý thuyết để dễ đọc hơn.
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => onUpdateSettings({ ...settings, fontSize: 'normal' })}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                  settings.fontSize === 'normal'
                    ? 'bg-sky-600 text-white border-sky-600'
                    : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                }`}
              >
                Tiêu chuẩn
              </button>
              <button
                type="button"
                onClick={() => onUpdateSettings({ ...settings, fontSize: 'large' })}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                  settings.fontSize === 'large'
                    ? 'bg-sky-600 text-white border-sky-600'
                    : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                }`}
              >
                Cỡ chữ lớn
              </button>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-slate-50 border border-slate-200/80 rounded-xl">
            <div className="space-y-0.5">
              <div className="text-sm font-semibold text-slate-900">
                Tự động lưu bản nháp khi làm đề
              </div>
              <div className="text-xs text-slate-500">
                Tự động cập nhật bản nháp sau mỗi lần chọn đáp án hoặc chuyển câu hỏi.
              </div>
            </div>
            <input
              type="checkbox"
              id="toggle-autosave"
              checked={settings.autoSaveDraft}
              onChange={(e) =>
                onUpdateSettings({ ...settings, autoSaveDraft: e.target.checked })
              }
              aria-label="Tự động lưu bản nháp khi làm đề"
              className="w-5 h-5 accent-sky-600 rounded cursor-pointer"
            />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-slate-50 border border-slate-200/80 rounded-xl">
            <div className="space-y-0.5">
              <div className="text-sm font-semibold text-slate-900">
                Hiển thị ghi chú đối chiếu tài liệu PDF gốc
              </div>
              <div className="text-xs text-slate-500">
                Hiển thị thông báo về các chỗ trống/phương án đặc biệt trong bản in PDF gốc.
              </div>
            </div>
            <input
              type="checkbox"
              id="toggle-sourcenotes"
              checked={settings.showSourceNotes}
              onChange={(e) =>
                onUpdateSettings({ ...settings, showSourceNotes: e.target.checked })
              }
              aria-label="Hiển thị ghi chú đối chiếu tài liệu PDF gốc"
              className="w-5 h-5 accent-sky-600 rounded cursor-pointer"
            />
          </div>
        </div>

        {/* Backup & Reset */}
        <div className="space-y-4 pt-4 border-t border-slate-100">
          <h2 className="text-base font-bold text-slate-900">
            2. Sao lưu và quản lý dữ liệu trình duyệt
          </h2>

          <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-slate-50 border border-slate-200/80 rounded-xl">
            <div className="space-y-0.5">
              <div className="text-sm font-semibold text-slate-900">
                Xuất lịch sử và tiến độ (JSON)
              </div>
              <div className="text-xs text-slate-500">
                Tải về tệp JSON chứa toàn bộ lịch sử làm bài, bản nháp và tiến độ ôn tập hiện tại.
              </div>
            </div>
            <button
              type="button"
              onClick={handleExportJson}
              className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white text-xs sm:text-sm font-semibold rounded-xl transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0"
            >
              <Download className="w-4 h-4" />
              <span>Xuất dữ liệu JSON</span>
            </button>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-rose-50/50 border border-rose-200 rounded-xl">
            <div className="space-y-0.5">
              <div className="text-sm font-semibold text-rose-950">
                Xóa toàn bộ dữ liệu tiến trình cá nhân
              </div>
              <div className="text-xs text-rose-800">
                Xóa tất cả bản nháp, lịch sử làm bài và trạng thái đánh dấu từ vựng/ngữ pháp. Nội
                dung học tập gốc từ PDF không bị ảnh hưởng.
              </div>
            </div>
            <button
              type="button"
              onClick={() => setShowConfirmClear(true)}
              className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs sm:text-sm font-semibold rounded-xl transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0"
            >
              <Trash2 className="w-4 h-4" />
              <span>Xóa dữ liệu</span>
            </button>
          </div>
        </div>

        {/* Source PDF Reference */}
        <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500">
          <div className="flex items-center gap-1.5">
            <FileText className="w-4 h-4 text-sky-600" />
            <span>Nguồn dữ liệu duy nhất: ĐỀ CƯƠNG + ĐỀ MẪU.pdf (12 trang)</span>
          </div>
          <a
            href={DOCUMENT_HEADER.pdfPath}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sky-700 font-semibold hover:underline"
          >
            Mở tệp PDF nguồn
          </a>
        </div>
      </div>

      {showConfirmClear && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4"
        >
          <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-lg">
            <h2 className="text-lg font-bold text-slate-900">
              Xác nhận xóa toàn bộ dữ liệu cá nhân
            </h2>
            <p className="text-sm text-slate-600">
              Bạn có chắc chắn muốn xóa toàn bộ bản nháp, lịch sử làm bài và tiến độ học tập đã lưu
              trên trình duyệt này không?
            </p>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowConfirmClear(false)}
                className="px-4 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-sm font-semibold rounded-xl"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={() => {
                  onClearAllData();
                  setShowConfirmClear(false);
                  setStatusNotice('Đã xóa toàn bộ dữ liệu tiến trình cá nhân.');
                  window.setTimeout(() => setStatusNotice(null), 3000);
                }}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-sm font-semibold rounded-xl"
              >
                Xác nhận xóa tất cả
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
