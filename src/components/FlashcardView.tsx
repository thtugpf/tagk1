import React, { useState, useEffect, useMemo } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  RotateCw,
  Shuffle,
  List,
  CheckCircle2,
  Bookmark,
  ArrowLeft,
} from 'lucide-react';
import {
  AppView,
  FlashcardReviewStatus,
  StudyProgressState,
  UnitId,
  VocabItem,
} from '../types';
import { UNITS_INFO, VOCABULARY_DATA } from '../data/curriculumData';
import { VOCAB_QUIZ_QUESTIONS } from '../data/theoryQuizzesData';
import { TheoryPracticeQuiz } from './TheoryPracticeQuiz';

interface FlashcardViewProps {
  onNavigate: (view: AppView) => void;
  progress: StudyProgressState;
  onUpdateProgress: (updater: (prev: StudyProgressState) => StudyProgressState) => void;
}

export const FlashcardView: React.FC<FlashcardViewProps> = ({
  onNavigate,
  progress,
  onUpdateProgress,
}) => {
  const [unitFilter, setUnitFilter] = useState<UnitId | 'all'>(
    progress.lastVocabUnitFilter || 'all'
  );
  const [shuffledIds, setShuffledIds] = useState<string[] | null>(null);
  const [currentIndex, setCurrentIndex] = useState<number>(progress.lastVocabIndex || 0);
  const [isFlipped, setIsFlipped] = useState<boolean>(false);
  const [showAllTable, setShowAllTable] = useState<boolean>(false);

  const baseList = useMemo(() => {
    if (unitFilter === 'all') return VOCABULARY_DATA;
    return VOCABULARY_DATA.filter((v) => v.unitId === unitFilter);
  }, [unitFilter]);

  const activeDeck: VocabItem[] = useMemo(() => {
    if (!shuffledIds) return baseList;
    const map = new Map(baseList.map((item) => [item.id, item]));
    const ordered: VocabItem[] = [];
    for (const id of shuffledIds) {
      const found = map.get(id);
      if (found) ordered.push(found);
    }
    // Include any missing items if filter changed
    for (const item of baseList) {
      if (!ordered.some((o) => o.id === item.id)) {
        ordered.push(item);
      }
    }
    return ordered;
  }, [baseList, shuffledIds]);

  const safeIndex = Math.min(Math.max(0, currentIndex), Math.max(0, activeDeck.length - 1));
  const currentCard = activeDeck[safeIndex];

  // Record viewed card and position in progress
  useEffect(() => {
    if (!currentCard) return;
    onUpdateProgress((prev) => {
      const alreadyViewed = prev.viewedVocabIds.includes(currentCard.id);
      const nextViewed = alreadyViewed
        ? prev.viewedVocabIds
        : [...prev.viewedVocabIds, currentCard.id];

      if (
        alreadyViewed &&
        prev.lastVocabUnitFilter === unitFilter &&
        prev.lastVocabIndex === safeIndex
      ) {
        return prev;
      }

      return {
        ...prev,
        viewedVocabIds: nextViewed,
        lastVocabUnitFilter: unitFilter,
        lastVocabIndex: safeIndex,
      };
    });
  }, [currentCard?.id, unitFilter, safeIndex]);

  const handleChangeUnit = (newUnit: UnitId | 'all') => {
    setUnitFilter(newUnit);
    setShuffledIds(null);
    setCurrentIndex(0);
    setIsFlipped(false);
  };

  const handlePrevCard = () => {
    if (safeIndex > 0) {
      setCurrentIndex(safeIndex - 1);
      setIsFlipped(false);
    }
  };

  const handleNextCard = () => {
    if (safeIndex < activeDeck.length - 1) {
      setCurrentIndex(safeIndex + 1);
      setIsFlipped(false);
    }
  };

  const handleShuffle = () => {
    const ids = baseList.map((item) => item.id);
    for (let i = ids.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [ids[i], ids[j]] = [ids[j], ids[i]];
    }
    setShuffledIds(ids);
    setCurrentIndex(0);
    setIsFlipped(false);
  };

  const handleResetOrder = () => {
    setShuffledIds(null);
    setCurrentIndex(0);
    setIsFlipped(false);
  };

  const handleMarkStatus = (vocabId: string, status: FlashcardReviewStatus) => {
    onUpdateProgress((prev) => {
      const currentStatus = prev.vocabStatus[vocabId] || 'unmarked';
      const nextStatus = currentStatus === status ? 'unmarked' : status;
      return {
        ...prev,
        vocabStatus: {
          ...prev.vocabStatus,
          [vocabId]: nextStatus,
        },
      };
    });
  };

  const viewedInFilterCount = baseList.filter((item) =>
    progress.viewedVocabIds.includes(item.id)
  ).length;
  const currentCardStatus: FlashcardReviewStatus = currentCard
    ? progress.vocabStatus[currentCard.id] || 'unmarked'
    : 'unmarked';

  return (
    <div className="space-y-6">
      {/* Top Header & Back Button */}
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
              1. Ôn tập từ vựng bằng Flashcard
            </h1>
            <p className="text-xs sm:text-sm text-slate-600">
              Ghi chú: Chức năng đánh dấu &ldquo;Đã ôn&rdquo; hoặc &ldquo;Cần ôn lại&rdquo; là ghi nhận cá nhân của
              người học để theo dõi tiến độ.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleShuffle}
              className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs sm:text-sm font-semibold rounded-xl transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0"
            >
              <Shuffle className="w-4 h-4 text-sky-600" />
              <span>Xáo trộn thứ tự thẻ</span>
            </button>
            {shuffledIds && (
              <button
                type="button"
                onClick={handleResetOrder}
                className="px-3 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-medium rounded-xl transition-colors whitespace-nowrap shrink-0"
              >
                Khôi phục thứ tự gốc
              </button>
            )}
            <button
              type="button"
              onClick={() => setShowAllTable(!showAllTable)}
              className="px-3.5 py-2 bg-sky-50 hover:bg-sky-100 text-sky-800 text-xs sm:text-sm font-semibold rounded-xl transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0"
            >
              <List className="w-4 h-4" />
              <span>{showAllTable ? 'Ẩn danh sách từ vựng' : 'Xem tất cả từ vựng'}</span>
            </button>
          </div>
        </div>

        {/* Unit Filter Tabs */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100">
          <button
            type="button"
            onClick={() => handleChangeUnit('all')}
            className={`px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition-colors whitespace-nowrap shrink-0 ${
              unitFilter === 'all'
                ? 'bg-sky-600 text-white'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            Tất cả ({VOCABULARY_DATA.length})
          </button>
          {UNITS_INFO.map((u) => {
            const count = VOCABULARY_DATA.filter((v) => v.unitId === u.id).length;
            return (
              <button
                key={u.id}
                type="button"
                onClick={() => handleChangeUnit(u.id)}
                className={`px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition-colors whitespace-nowrap shrink-0 ${
                  unitFilter === u.id
                    ? 'bg-sky-600 text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {u.title} ({count})
              </button>
            );
          })}
        </div>

        {/* Progress Bar */}
        <div className="space-y-1.5 pt-1">
          <div className="flex items-center justify-between text-xs text-slate-600 font-medium">
            <span>
              Tiến độ đã xem trong nhóm đang chọn: {viewedInFilterCount} / {baseList.length} thẻ
            </span>
            <span className="font-mono tabular-nums">
              Thẻ hiện tại: {safeIndex + 1} / {activeDeck.length}
            </span>
          </div>
          <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-sky-600 transition-transform duration-200 origin-left"
              style={{
                transform: `scaleX(${
                  baseList.length > 0 ? viewedInFilterCount / baseList.length : 0
                })`,
              }}
            />
          </div>
        </div>
      </div>

      {/* Main Flashcard Stage */}
      {currentCard && (
        <div className="max-w-3xl mx-auto space-y-5">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-10 shadow-xs min-h-[320px] flex flex-col justify-between">
            {/* Top card metadata */}
            <div className="flex items-center justify-between text-xs text-slate-500 border-b border-slate-100 pb-3">
              <span className="font-semibold text-sky-800">{currentCard.unitTitle}</span>
              <div>
                <span>{isFlipped ? 'Mặt sau (Nghĩa & Cụm thường gặp / Ví dụ)' : 'Mặt trước (Từ vựng / Cụm từ)'}</span>
                {currentCardStatus !== 'unmarked' && (
                  <>
                    <span className="mx-2" aria-hidden="true">·</span>
                    <span
                      className={
                        currentCardStatus === 'reviewed'
                          ? 'text-emerald-700 font-semibold'
                          : 'text-amber-700 font-semibold'
                      }
                    >
                      {currentCardStatus === 'reviewed' ? 'Đã ôn' : 'Cần ôn lại'}
                    </span>
                  </>
                )}
              </div>
            </div>

            {/* Card Center Content */}
            {!isFlipped ? (
              <div className="py-10 text-center space-y-3">
                <div className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight">
                  {currentCard.term}
                </div>
                <div className="text-sm sm:text-base italic font-mono text-slate-500">
                  Từ loại: {currentCard.partOfSpeech}
                </div>
              </div>
            ) : (
              <div className="py-6 space-y-5 text-center">
                <div className="space-y-1">
                  <div className="text-xs font-medium text-slate-500">
                    Từ vựng / Cụm từ ({currentCard.partOfSpeech})
                  </div>
                  <div className="text-xl font-bold text-slate-800">{currentCard.term}</div>
                </div>

                <div className="bg-sky-50/70 border border-sky-100 rounded-xl p-4 space-y-1">
                  <div className="text-xs font-semibold text-sky-800">Nghĩa tiếng Việt</div>
                  <div className="text-xl sm:text-2xl font-bold text-sky-950">
                    {currentCard.meaningVi}
                  </div>
                </div>

                <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-4 space-y-1">
                  <div className="text-xs font-semibold text-slate-600">
                    Cụm thường gặp / Ví dụ
                  </div>
                  <div className="text-base sm:text-lg font-medium text-slate-900">
                    {currentCard.collocationOrExample}
                  </div>
                </div>
              </div>
            )}

            {/* Flip Action & Status Marking inside Card Footer */}
            <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setIsFlipped(!isFlipped)}
                className="px-5 py-2.5 bg-sky-600 hover:bg-sky-700 text-white text-sm font-semibold rounded-xl transition-colors flex items-center gap-2 whitespace-nowrap shrink-0"
              >
                <RotateCw className="w-4 h-4" />
                <span>Lật thẻ</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleMarkStatus(currentCard.id, 'reviewed')}
                  className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold border transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
                    currentCardStatus === 'reviewed'
                      ? 'bg-emerald-600 text-white border-emerald-600'
                      : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Đã ôn</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleMarkStatus(currentCard.id, 'needs_review')}
                  className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold border transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
                    currentCardStatus === 'needs_review'
                      ? 'bg-amber-600 text-white border-amber-600'
                      : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <Bookmark className="w-4 h-4" />
                  <span>Cần ôn lại</span>
                </button>
              </div>
            </div>
          </div>

          {/* Previous / Next Navigation Bar */}
          <div className="flex items-center justify-between gap-4">
            <button
              type="button"
              onClick={handlePrevCard}
              disabled={safeIndex === 0}
              className="px-4 py-2.5 bg-white border border-slate-300 hover:bg-slate-50 disabled:opacity-40 disabled:pointer-events-none text-slate-800 text-sm font-semibold rounded-xl transition-colors flex items-center gap-2 whitespace-nowrap shrink-0"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Thẻ trước</span>
            </button>

            <span className="text-xs sm:text-sm text-slate-500 font-mono tabular-nums">
              {safeIndex + 1} / {activeDeck.length}
            </span>

            <button
              type="button"
              onClick={handleNextCard}
              disabled={safeIndex >= activeDeck.length - 1}
              className="px-4 py-2.5 bg-white border border-slate-300 hover:bg-slate-50 disabled:opacity-40 disabled:pointer-events-none text-slate-800 text-sm font-semibold rounded-xl transition-colors flex items-center gap-2 whitespace-nowrap shrink-0"
            >
              <span>Thẻ tiếp theo</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Full Vocabulary Table ("Xem tất cả từ vựng") */}
      {showAllTable && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4 overflow-x-auto">
          <h2 className="text-lg font-bold text-slate-900">
            Bảng tổng hợp tất cả từ vựng ({baseList.length} mục)
          </h2>
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-slate-600 bg-slate-50">
                <th className="py-3 px-4 font-semibold">Từ vựng / Cụm từ</th>
                <th className="py-3 px-4 font-semibold">Từ loại</th>
                <th className="py-3 px-4 font-semibold">Nghĩa tiếng Việt</th>
                <th className="py-3 px-4 font-semibold">Cụm thường gặp / Ví dụ</th>
                <th className="py-3 px-4 font-semibold text-right">Trạng thái tự đánh dấu</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {baseList.map((item, idx) => {
                const st = progress.vocabStatus[item.id] || 'unmarked';
                return (
                  <tr key={item.id} className="hover:bg-slate-50/80">
                    <td className="py-3 px-4 font-bold text-slate-900">
                      <button
                        type="button"
                        onClick={() => {
                          const targetIdx = activeDeck.findIndex((d) => d.id === item.id);
                          if (targetIdx >= 0) {
                            setCurrentIndex(targetIdx);
                            setIsFlipped(false);
                          }
                        }}
                        className="hover:text-sky-700 text-left"
                      >
                        {item.term}
                      </button>
                    </td>
                    <td className="py-3 px-4 font-mono italic text-slate-600">
                      {item.partOfSpeech}
                    </td>
                    <td className="py-3 px-4 text-slate-800">{item.meaningVi}</td>
                    <td className="py-3 px-4 text-slate-700">{item.collocationOrExample}</td>
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleMarkStatus(item.id, 'reviewed')}
                          className={`px-2.5 py-1 rounded-md text-xs font-medium border ${
                            st === 'reviewed'
                              ? 'bg-emerald-600 text-white border-emerald-600'
                              : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-100'
                          }`}
                        >
                          Đã ôn
                        </button>
                        <button
                          type="button"
                          onClick={() => handleMarkStatus(item.id, 'needs_review')}
                          className={`px-2.5 py-1 rounded-md text-xs font-medium border ${
                            st === 'needs_review'
                              ? 'bg-amber-600 text-white border-amber-600'
                              : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-100'
                          }`}
                        >
                          Cần ôn lại
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* 15-Question Vocabulary Practice Quiz */}
      <TheoryPracticeQuiz
        title="Bài tập trắc nghiệm ôn tập Từ vựng (15 câu)"
        subtitle="Chọn đáp án đúng để tự động qua câu tiếp theo. Nếu chọn sai, hệ thống sẽ hiện giải thích chi tiết ngay lập tức."
        questions={VOCAB_QUIZ_QUESTIONS}
      />
    </div>
  );
};
