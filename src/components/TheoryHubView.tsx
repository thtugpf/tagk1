import React from 'react';
import { Layers, BookOpen, GitBranch, ArrowRight, CheckCircle2 } from 'lucide-react';
import { AppView, StudyProgressState } from '../types';
import {
  DOCUMENT_HEADER,
  UNITS_INFO,
  VOCABULARY_DATA,
  GRAMMAR_DATA,
  SENTENCE_STRUCTURES_DATA,
} from '../data/curriculumData';

interface TheoryHubViewProps {
  onNavigate: (view: AppView) => void;
  progress: StudyProgressState;
}

export const TheoryHubView: React.FC<TheoryHubViewProps> = ({ onNavigate, progress }) => {
  const reviewedVocabCount = Object.values(progress.vocabStatus).filter(
    (s) => s === 'reviewed'
  ).length;
  const needsReviewVocabCount = Object.values(progress.vocabStatus).filter(
    (s) => s === 'needs_review'
  ).length;

  return (
    <div className="space-y-8">
      <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 space-y-3">
        <div className="text-xs font-medium text-sky-700">
          <span>{DOCUMENT_HEADER.mainTitle}</span>
          <span className="mx-2" aria-hidden="true">·</span>
          <span>{DOCUMENT_HEADER.subTitle}</span>
        </div>
        <h1 className="text-2xl font-bold text-slate-900">Khu vực Lý thuyết</h1>
        <p className="text-sm sm:text-base text-slate-600 leading-relaxed max-w-3xl">
          Nội dung lý thuyết được chia thành 3 phần độc lập bám sát nguyên văn tài liệu gốc:
          (1) Ôn tập từ vựng bằng Flashcard, (2) Ôn tập ngữ pháp trọng tâm theo từng Unit, và
          (3) Ôn tập cấu trúc câu và cách kết hợp.
        </p>
      </div>

      {/* Three independent sections */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* 1. Flashcards */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 flex flex-col justify-between space-y-6">
          <div className="space-y-3">
            <div className="w-11 h-11 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center">
              <Layers className="w-5 h-5" />
            </div>
            <h2 className="text-lg font-bold text-slate-900">
              1. Ôn tập từ vựng bằng Flashcard
            </h2>
            <p className="text-sm text-slate-600 leading-relaxed">
              Tổng cộng {VOCABULARY_DATA.length} mục từ vựng và cụm từ thuộc Unit 1, Unit 2, Unit 3.
              Lật thẻ 2 mặt, lọc theo Unit, xáo trộn thẻ và đánh dấu trạng thái tự ôn tập.
            </p>
            <div className="text-xs text-slate-500 pt-1">
              <span>Đã xem: {progress.viewedVocabIds.length}/{VOCABULARY_DATA.length}</span>
              <span className="mx-2" aria-hidden="true">·</span>
              <span>Đã ôn: {reviewedVocabCount}</span>
              <span className="mx-2" aria-hidden="true">·</span>
              <span>Cần ôn lại: {needsReviewVocabCount}</span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => onNavigate('flashcards')}
            className="w-full py-2.5 px-4 bg-sky-600 hover:bg-sky-700 text-white text-sm font-semibold rounded-xl transition-colors flex items-center justify-center gap-2 whitespace-nowrap"
          >
            <span>Vào Flashcard từ vựng</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {/* 2. Grammar */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 flex flex-col justify-between space-y-6">
          <div className="space-y-3">
            <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <BookOpen className="w-5 h-5" />
            </div>
            <h2 className="text-lg font-bold text-slate-900">2. Ôn tập ngữ pháp</h2>
            <p className="text-sm text-slate-600 leading-relaxed">
              Gồm {GRAMMAR_DATA.length} chủ điểm ngữ pháp sắp xếp đúng thứ tự Unit 1 – Unit 2 – Unit 3
              với đầy đủ ký hiệu công thức (S + V2/ed, was/were + V-ing, A/An/The/Ø, V(số ít)) và ví dụ gốc.
            </p>
            <div className="text-xs text-slate-500 pt-1">
              <span>
                Đã đánh dấu đã ôn: {progress.reviewedGrammarIds.length}/{GRAMMAR_DATA.length} chủ điểm
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => onNavigate('grammar')}
            className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-xl transition-colors flex items-center justify-center gap-2 whitespace-nowrap"
          >
            <span>Vào Ôn tập ngữ pháp</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {/* 3. Sentence Structures */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 flex flex-col justify-between space-y-6">
          <div className="space-y-3">
            <div className="w-11 h-11 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center">
              <GitBranch className="w-5 h-5" />
            </div>
            <h2 className="text-lg font-bold text-slate-900">3. Ôn tập cấu trúc câu</h2>
            <p className="text-sm text-slate-600 leading-relaxed">
              Tổng hợp {SENTENCE_STRUCTURES_DATA.length} cấu trúc kết hợp câu trong tài liệu: cấu trúc
              WHEN / WHILE, các động từ đi kèm giới từ và mệnh đề quan hệ ", which + V(số ít) + O".
            </p>
            <div className="text-xs text-slate-500 pt-1">
              <span>
                Đã đánh dấu đã ôn: {progress.reviewedStructureIds.length}/
                {SENTENCE_STRUCTURES_DATA.length} cấu trúc
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => onNavigate('structures')}
            className="w-full py-2.5 px-4 bg-sky-700 hover:bg-sky-800 text-white text-sm font-semibold rounded-xl transition-colors flex items-center justify-center gap-2 whitespace-nowrap"
          >
            <span>Vào Ôn tập cấu trúc câu</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Overview by Unit */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 space-y-5">
        <h2 className="text-lg font-bold text-slate-900">
          Tóm tắt nội dung theo từng Unit trong đề cương
        </h2>
        <div className="divide-y divide-slate-200">
          {UNITS_INFO.map((u) => {
            const unitVocab = VOCABULARY_DATA.filter((v) => v.unitId === u.id);
            const unitGrammar = GRAMMAR_DATA.filter((g) => g.unitId === u.id);
            return (
              <div key={u.id} className="py-4 first:pt-0 last:pb-0 space-y-2">
                <h3 className="text-base font-bold text-sky-900">{u.title}</h3>
                <div className="text-xs sm:text-sm text-slate-600 space-y-1">
                  <p>
                    <span className="font-semibold text-slate-800">{u.vocabSectionTitle}:</span>{' '}
                    {unitVocab.map((v) => v.term).join(', ')} ({unitVocab.length} từ/cụm từ).
                  </p>
                  <p>
                    <span className="font-semibold text-slate-800">{u.grammarSectionTitle}:</span>{' '}
                    {unitGrammar.map((g) => g.title).join(' · ')}.
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
