import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, CheckCircle2, ArrowLeft, BookOpen } from 'lucide-react';
import { AppView, StudyProgressState } from '../types';
import { SENTENCE_STRUCTURES_DATA } from '../data/curriculumData';
import { STRUCTURE_QUIZ_QUESTIONS } from '../data/theoryQuizzesData';
import { TheoryPracticeQuiz } from './TheoryPracticeQuiz';

interface SentenceStructuresViewProps {
  onNavigate: (view: AppView) => void;
  progress: StudyProgressState;
  onUpdateProgress: (updater: (prev: StudyProgressState) => StudyProgressState) => void;
}

export const SentenceStructuresView: React.FC<SentenceStructuresViewProps> = ({
  onNavigate,
  progress,
  onUpdateProgress,
}) => {
  const [selectedIndex, setSelectedIndex] = useState<number>(0);

  const currentStructure = SENTENCE_STRUCTURES_DATA[selectedIndex];
  const isReviewed = progress.reviewedStructureIds.includes(currentStructure.id);

  const handleToggleReviewed = (structId: string) => {
    onUpdateProgress((prev) => {
      const exists = prev.reviewedStructureIds.includes(structId);
      const next = exists
        ? prev.reviewedStructureIds.filter((id) => id !== structId)
        : [...prev.reviewedStructureIds, structId];
      return {
        ...prev,
        reviewedStructureIds: next,
      };
    });
  };

  return (
    <div className="space-y-6">
      <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1">
            <button
              type="button"
              onClick={() => onNavigate('theory')}
              className="text-xs font-semibold text-sky-700 hover:text-sky-800 flex items-center gap-1 mb-1"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Quay lại Lý thuyết</span>
            </button>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
              3. Ôn tập cấu trúc câu và cách kết hợp
            </h1>
            <p className="text-xs sm:text-sm text-slate-600">
              Đã đánh dấu đã ôn: {progress.reviewedStructureIds.length} /{' '}
              {SENTENCE_STRUCTURES_DATA.length} cấu trúc
            </p>
          </div>

          <button
            type="button"
            onClick={() => onNavigate('grammar')}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs sm:text-sm font-semibold rounded-xl transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0"
          >
            <BookOpen className="w-4 h-4 text-emerald-600" />
            <span>Xem toàn bộ mục Ngữ pháp</span>
          </button>
        </div>

        {/* Selector buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2 border-t border-slate-100">
          {SENTENCE_STRUCTURES_DATA.map((item, idx) => {
            const done = progress.reviewedStructureIds.includes(item.id);
            const active = idx === selectedIndex;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setSelectedIndex(idx)}
                className={`text-left px-4 py-3 rounded-xl text-xs sm:text-sm font-medium border transition-colors flex items-center justify-between gap-3 ${
                  active
                    ? 'bg-sky-700 text-white border-sky-700 font-semibold'
                    : 'bg-slate-50 text-slate-800 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <div className="truncate">
                  <span className="opacity-75 mr-1.5">[{item.unitTitle.split(':')[0]}]</span>
                  <span>{item.name}</span>
                </div>
                {done && (
                  <CheckCircle2
                    className={`w-4 h-4 shrink-0 ${active ? 'text-white' : 'text-emerald-600'}`}
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Structure Detail Card */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-100 pb-4">
          <div className="space-y-1">
            <div className="text-xs font-semibold text-sky-700">
              <span>{currentStructure.unitTitle}</span>
              <span className="mx-2" aria-hidden="true">·</span>
              <span>
                Cấu trúc {selectedIndex + 1} / {SENTENCE_STRUCTURES_DATA.length}
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
              {currentStructure.name}
            </h2>
          </div>

          <button
            type="button"
            onClick={() => handleToggleReviewed(currentStructure.id)}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold border transition-colors flex items-center gap-2 whitespace-nowrap shrink-0 ${
              isReviewed
                ? 'bg-emerald-600 text-white border-emerald-600'
                : 'bg-white text-slate-800 border-slate-300 hover:bg-slate-50'
            }`}
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>{isReviewed ? 'Đã đánh dấu đã ôn' : 'Đánh dấu đã ôn'}</span>
          </button>
        </div>

        {/* Formula */}
        <div className="space-y-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Công thức nguyên gốc
          </h3>
          <div className="bg-sky-50/70 border border-sky-200 rounded-xl p-4">
            <pre className="font-mono text-sm sm:text-base font-semibold text-sky-950 whitespace-pre-wrap">
              {currentStructure.formula}
            </pre>
          </div>
        </div>

        {/* Explanation / Condition */}
        <div className="space-y-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Điều kiện sử dụng / Giải thích trong tài liệu
          </h3>
          <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-5 space-y-2">
            {currentStructure.usageOrExplanation.map((line, i) => (
              <p key={i} className="text-sm sm:text-base text-slate-800 leading-relaxed">
                {line}
              </p>
            ))}
          </div>
        </div>

        {/* Examples */}
        {currentStructure.examples.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Ví dụ minh họa gốc
            </h3>
            <div className="bg-emerald-50/50 border border-emerald-200/80 rounded-xl p-4 space-y-2">
              {currentStructure.examples.map((ex, i) => (
                <p key={i} className="text-sm sm:text-base font-medium text-slate-900">
                  {ex}
                </p>
              ))}
            </div>
          </div>
        )}

        {/* Prev / Next Navigation */}
        <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-4">
          <button
            type="button"
            onClick={() => setSelectedIndex((prev) => Math.max(0, prev - 1))}
            disabled={selectedIndex === 0}
            className="px-4 py-2.5 bg-white border border-slate-300 hover:bg-slate-50 disabled:opacity-40 disabled:pointer-events-none text-slate-800 text-sm font-semibold rounded-xl transition-colors flex items-center gap-2 whitespace-nowrap shrink-0"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Cấu trúc trước</span>
          </button>

          <span className="text-xs sm:text-sm text-slate-500 font-mono tabular-nums">
            {selectedIndex + 1} / {SENTENCE_STRUCTURES_DATA.length}
          </span>

          <button
            type="button"
            onClick={() =>
              setSelectedIndex((prev) =>
                Math.min(SENTENCE_STRUCTURES_DATA.length - 1, prev + 1)
              )
            }
            disabled={selectedIndex >= SENTENCE_STRUCTURES_DATA.length - 1}
            className="px-4 py-2.5 bg-white border border-slate-300 hover:bg-slate-50 disabled:opacity-40 disabled:pointer-events-none text-slate-800 text-sm font-semibold rounded-xl transition-colors flex items-center gap-2 whitespace-nowrap shrink-0"
          >
            <span>Cấu trúc tiếp theo</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 15-Question Sentence Structure Practice Quiz */}
      <TheoryPracticeQuiz
        title="Bài tập trắc nghiệm ôn tập Cấu trúc câu (15 câu)"
        subtitle="Chọn đáp án đúng để tự động qua câu tiếp theo. Nếu chọn sai, hệ thống sẽ hiện giải thích chi tiết ngay lập tức."
        questions={STRUCTURE_QUIZ_QUESTIONS}
      />
    </div>
  );
};
