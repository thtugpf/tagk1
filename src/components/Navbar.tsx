import React from 'react';
import { AppView } from '../types';

interface NavbarProps {
  currentView: AppView;
  onNavigate: (view: AppView) => void;
  draftCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({ currentView, onNavigate, draftCount }) => {
  const isTheoryGroup =
    currentView === 'theory' ||
    currentView === 'flashcards' ||
    currentView === 'grammar' ||
    currentView === 'structures';

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur border-b border-slate-200">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3 sm:gap-8 px-4 sm:px-6 py-3.5">
        {/* Zone 1: Single text element wordmark */}
        <button
          type="button"
          onClick={() => onNavigate('home')}
          className="text-sm sm:text-lg font-bold tracking-tight text-sky-900 hover:text-sky-700 transition-colors whitespace-nowrap truncate max-w-[200px] sm:max-w-none text-left"
        >
          ENGLISH MIDTERM I – ÔN TẬP VÀ LUYỆN ĐỀ
        </button>

        {/* Zone 2: 5 clean single-line text navigation links */}
        <nav
          aria-label="Điều hướng chính"
          className="hidden lg:flex items-center gap-6 text-sm font-medium text-slate-600"
        >
          <button
            type="button"
            onClick={() => onNavigate('home')}
            className={`py-1 transition-colors whitespace-nowrap shrink-0 border-b-2 ${
              currentView === 'home'
                ? 'border-sky-600 text-sky-700 font-semibold'
                : 'border-transparent hover:text-slate-900 hover:border-slate-300'
            }`}
          >
            Trang chủ
          </button>
          <button
            type="button"
            onClick={() => onNavigate('theory')}
            className={`py-1 transition-colors whitespace-nowrap shrink-0 border-b-2 ${
              isTheoryGroup
                ? 'border-sky-600 text-sky-700 font-semibold'
                : 'border-transparent hover:text-slate-900 hover:border-slate-300'
            }`}
          >
            Lý thuyết
          </button>
          <button
            type="button"
            onClick={() => onNavigate('exam')}
            className={`py-1 transition-colors whitespace-nowrap shrink-0 border-b-2 ${
              currentView === 'exam'
                ? 'border-sky-600 text-sky-700 font-semibold'
                : 'border-transparent hover:text-slate-900 hover:border-slate-300'
            }`}
          >
            Luyện đề
          </button>
          <button
            type="button"
            onClick={() => onNavigate('history')}
            className={`py-1 transition-colors whitespace-nowrap shrink-0 border-b-2 ${
              currentView === 'history'
                ? 'border-sky-600 text-sky-700 font-semibold'
                : 'border-transparent hover:text-slate-900 hover:border-slate-300'
            }`}
          >
            Lịch sử
          </button>
          <button
            type="button"
            onClick={() => onNavigate('stats')}
            className={`py-1 transition-colors whitespace-nowrap shrink-0 border-b-2 ${
              currentView === 'stats'
                ? 'border-sky-600 text-sky-700 font-semibold'
                : 'border-transparent hover:text-slate-900 hover:border-slate-300'
            }`}
          >
            Thống kê
          </button>
        </nav>

        {/* Zone 3: 1 primary action */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={() => onNavigate(draftCount > 0 ? 'drafts' : 'exam')}
            className="px-4 py-2 text-xs sm:text-sm font-semibold text-white bg-sky-600 rounded-lg hover:bg-sky-700 transition-colors whitespace-nowrap shrink-0"
          >
            {draftCount > 0 ? `Bản nháp (${draftCount})` : 'Bắt đầu luyện đề'}
          </button>
        </div>
      </div>

      {/* Sub-navigation bar for all 10 areas on mobile/desktop */}
      <div className="bg-slate-50 border-t border-slate-200/80 px-4 sm:px-6 py-2 overflow-x-auto">
        <div className="max-w-7xl mx-auto flex items-center gap-2 text-xs font-medium text-slate-600">
          {(
            [
              { id: 'home', label: 'Trang chủ' },
              { id: 'theory', label: 'Lý thuyết' },
              { id: 'flashcards', label: 'Flashcard từ vựng' },
              { id: 'grammar', label: 'Ôn tập ngữ pháp' },
              { id: 'structures', label: 'Ôn tập cấu trúc câu' },
              { id: 'exam', label: 'Luyện đề' },
              { id: 'drafts', label: `Bản nháp đang làm (${draftCount})` },
              { id: 'history', label: 'Lịch sử làm bài' },
              { id: 'stats', label: 'Thống kê kết quả' },
              { id: 'settings', label: 'Cài đặt cơ bản' },
            ] as { id: AppView; label: string }[]
          ).map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => onNavigate(item.id)}
              className={`px-3 py-1.5 rounded-md transition-colors whitespace-nowrap shrink-0 ${
                currentView === item.id
                  ? 'bg-sky-700 text-white font-semibold'
                  : 'text-slate-600 hover:bg-slate-200/70 hover:text-slate-900'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>
    </header>
  );
};
