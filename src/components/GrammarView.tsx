import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, CheckCircle2, ArrowLeft } from 'lucide-react';
import { AppView, StudyProgressState } from '../types';
import { GRAMMAR_DATA, UNITS_INFO } from '../data/curriculumData';
import { GRAMMAR_QUIZ_QUESTIONS } from '../data/theoryQuizzesData';
import { TheoryPracticeQuiz } from './TheoryPracticeQuiz';

interface GrammarViewProps {
  onNavigate: (view: AppView) => void;
  progress: StudyProgressState;
  onUpdateProgress: (updater: (prev: StudyProgressState) => StudyProgressState) => void;
}

export const GrammarView: React.FC<GrammarViewProps> = ({
  onNavigate,
  progress,
  onUpdateProgress,
}) => {
  const [selectedIndex, setSelectedIndex] = useState<number>(0);

  const currentTopic = GRAMMAR_DATA[selectedIndex];
  const isReviewed = progress.reviewedGrammarIds.includes(currentTopic.id);

  const handleToggleReviewed = (topicId: string) => {
    onUpdateProgress((prev) => {
      const exists = prev.reviewedGrammarIds.includes(topicId);
      const next = exists
        ? prev.reviewedGrammarIds.filter((id) => id !== topicId)
        : [...prev.reviewedGrammarIds, topicId];
      return {
        ...prev,
        reviewedGrammarIds: next,
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
              2. Ôn tập ngữ pháp trọng tâm (Unit 1 – Unit 2 – Unit 3)
            </h1>
            <p className="text-xs sm:text-sm text-slate-600">
              Đã đánh dấu đã ôn: {progress.reviewedGrammarIds.length} / {GRAMMAR_DATA.length} chủ
              điểm
            </p>
          </div>

          <button
            type="button"
            onClick={() => onNavigate('structures')}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs sm:text-sm font-semibold rounded-xl transition-colors whitespace-nowrap shrink-0"
          >
            Chuyển sang Ôn tập cấu trúc câu
          </button>
        </div>

        {/* Topic Selector grouped by Unit */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2 border-t border-slate-100">
          {UNITS_INFO.map((unit) => {
            const unitTopics = GRAMMAR_DATA.map((g, index) => ({ g, index })).filter(
              (item) => item.g.unitId === unit.id
            );
            return (
              <div key={unit.id} className="bg-slate-50 border border-slate-200/80 rounded-xl p-3 space-y-2">
                <div className="text-xs font-bold text-sky-900">{unit.title}</div>
                <div className="space-y-1">
                  {unitTopics.map(({ g, index }) => {
                    const done = progress.reviewedGrammarIds.includes(g.id);
                    const active = index === selectedIndex;
                    return (
                      <button
                        key={g.id}
                        type="button"
                        onClick={() => setSelectedIndex(index)}
                        className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium transition-colors flex items-center justify-between gap-2 ${
                          active
                            ? 'bg-sky-600 text-white font-semibold'
                            : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200/70'
                        }`}
                      >
                        <span className="truncate">{g.title}</span>
                        {done && (
                          <CheckCircle2
                            className={`w-3.5 h-3.5 shrink-0 ${
                              active ? 'text-white' : 'text-emerald-600'
                            }`}
                          />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Main Grammar Point Detail Card */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-100 pb-4">
          <div className="space-y-1">
            <div className="text-xs font-semibold text-sky-700">
              <span>{currentTopic.unitTitle}</span>
              <span className="mx-2" aria-hidden="true">·</span>
              <span>Chủ điểm {selectedIndex + 1} / {GRAMMAR_DATA.length}</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900">{currentTopic.title}</h2>
            {currentTopic.sectionSubtitle && (
              <p className="text-xs sm:text-sm text-slate-500">{currentTopic.sectionSubtitle}</p>
            )}
          </div>

          <button
            type="button"
            onClick={() => handleToggleReviewed(currentTopic.id)}
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

        {/* Formulas / Structures Highlight */}
        {currentTopic.formulas.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Công thức / Cấu trúc trọng tâm
            </h3>
            <div className="bg-sky-50/70 border border-sky-200 rounded-xl p-4 space-y-2">
              {currentTopic.formulas.map((f, i) => (
                <div
                  key={i}
                  className="font-mono text-sm sm:text-base font-semibold text-sky-950"
                >
                  {f}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Verbatim Theory Lines */}
        <div className="space-y-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Nội dung lý thuyết nguyên văn từ tài liệu
          </h3>
          <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-5 space-y-2.5">
            {currentTopic.contentLines.map((line, i) => (
              <p key={i} className="text-sm sm:text-base text-slate-800 leading-relaxed">
                {line}
              </p>
            ))}
          </div>
        </div>

        {/* Original Examples */}
        {currentTopic.examples.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Ví dụ tiếng Anh nguyên văn trong tài liệu
            </h3>
            <div className="bg-emerald-50/50 border border-emerald-200/80 rounded-xl p-4 space-y-2">
              {currentTopic.examples.map((ex, i) => (
                <p key={i} className="text-sm sm:text-base font-medium text-slate-900">
                  {ex}
                </p>
              ))}
            </div>
          </div>
        )}

        {/* Navigation Between Topics */}
        <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-4">
          <button
            type="button"
            onClick={() => setSelectedIndex((prev) => Math.max(0, prev - 1))}
            disabled={selectedIndex === 0}
            className="px-4 py-2.5 bg-white border border-slate-300 hover:bg-slate-50 disabled:opacity-40 disabled:pointer-events-none text-slate-800 text-sm font-semibold rounded-xl transition-colors flex items-center gap-2 whitespace-nowrap shrink-0"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Chủ điểm trước</span>
          </button>

          <span className="text-xs sm:text-sm text-slate-500 font-mono tabular-nums">
            {selectedIndex + 1} / {GRAMMAR_DATA.length}
          </span>

          <button
            type="button"
            onClick={() =>
              setSelectedIndex((prev) => Math.min(GRAMMAR_DATA.length - 1, prev + 1))
            }
            disabled={selectedIndex >= GRAMMAR_DATA.length - 1}
            className="px-4 py-2.5 bg-white border border-slate-300 hover:bg-slate-50 disabled:opacity-40 disabled:pointer-events-none text-slate-800 text-sm font-semibold rounded-xl transition-colors flex items-center gap-2 whitespace-nowrap shrink-0"
          >
            <span>Chủ điểm tiếp theo</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 15-Question Grammar Practice Quiz */}
      <TheoryPracticeQuiz
        title="Bài tập trắc nghiệm ôn tập Ngữ pháp (15 câu)"
        subtitle="Chọn đáp án đúng để tự động qua câu tiếp theo. Nếu chọn sai, hệ thống sẽ hiện giải thích chi tiết ngay lập tức."
        questions={GRAMMAR_QUIZ_QUESTIONS}
      />
    </div>
  );
};
