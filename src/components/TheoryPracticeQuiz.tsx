import React, { useState } from 'react';
import {
  HelpCircle,
  CheckCircle2,
  XCircle,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { AnswerChoice, TheoryQuizQuestion } from '../types';

interface TheoryPracticeQuizProps {
  title: string;
  subtitle: string;
  questions: TheoryQuizQuestion[];
}

export const TheoryPracticeQuiz: React.FC<TheoryPracticeQuizProps> = ({
  title,
  subtitle,
  questions,
}) => {
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, AnswerChoice>>({});
  const [firstTryStatus, setFirstTryStatus] = useState<Record<string, boolean>>({});
  const [showHint, setShowHint] = useState<Record<string, boolean>>({});
  const [isCompleted, setIsCompleted] = useState<boolean>(false);

  const currentQuestion = questions[currentIndex];
  const chosenForCurrent = currentQuestion ? selectedAnswers[currentQuestion.id] : undefined;
  const isLocked = Boolean(chosenForCurrent);

  const correctCount = Object.values(firstTryStatus).filter(Boolean).length;
  const incorrectCount = Object.values(firstTryStatus).filter((v) => v === false).length;

  const handleSelectOption = (choice: AnswerChoice) => {
    if (!currentQuestion || isLocked) return;

    const isCorrect = choice === currentQuestion.correctAnswer;
    setSelectedAnswers((prev) => ({ ...prev, [currentQuestion.id]: choice }));
    setFirstTryStatus((prev) => ({ ...prev, [currentQuestion.id]: isCorrect }));

    // If correct -> automatically advance to the next question
    if (isCorrect) {
      window.setTimeout(() => {
        if (currentIndex < questions.length - 1) {
          setCurrentIndex((prev) => Math.min(questions.length - 1, prev + 1));
        } else {
          setIsCompleted(true);
        }
      }, 320);
    }
  };

  const handleResetQuiz = () => {
    setCurrentIndex(0);
    setSelectedAnswers({});
    setFirstTryStatus({});
    setShowHint({});
    setIsCompleted(false);
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4">
        <div className="space-y-1">
          <div className="text-xs font-semibold text-sky-700">
            Bài tập thực hành củng cố lý thuyết ({questions.length} câu hỏi)
          </div>
          <h2 className="text-lg sm:text-xl font-bold text-slate-900">{title}</h2>
          <p className="text-xs sm:text-sm text-slate-600">{subtitle}</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-slate-100 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-mono tabular-nums font-semibold text-slate-800">
            <span>Đúng: {correctCount}</span>
            <span className="mx-1.5" aria-hidden="true">·</span>
            <span>Sai: {incorrectCount}</span>
            <span className="mx-1.5" aria-hidden="true">·</span>
            <span>
              Tiến độ: {Object.keys(selectedAnswers).length}/{questions.length}
            </span>
          </div>
          <button
            type="button"
            onClick={handleResetQuiz}
            className="px-3.5 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs sm:text-sm font-semibold rounded-xl transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Làm lại 15 câu</span>
          </button>
        </div>
      </div>

      {/* Question Number Pills / Jump Bar */}
      <div className="flex flex-wrap items-center gap-1.5">
        {questions.map((q, idx) => {
          const st = firstTryStatus[q.id];
          const active = idx === currentIndex && !isCompleted;
          return (
            <button
              key={q.id}
              type="button"
              onClick={() => {
                setIsCompleted(false);
                setCurrentIndex(idx);
              }}
              className={`w-8 h-8 rounded-lg text-xs font-mono font-bold transition-colors border ${
                active
                  ? 'bg-sky-700 text-white border-sky-700 ring-2 ring-sky-300'
                  : st === true
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-400'
                  : st === false
                  ? 'bg-rose-50 text-rose-800 border-rose-400'
                  : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
              }`}
            >
              {q.number}
            </button>
          );
        })}
      </div>

      {isCompleted ? (
        <div className="bg-emerald-50/70 border border-emerald-200 rounded-2xl p-6 text-center space-y-4">
          <div className="text-lg font-bold text-emerald-950">
            Đã hoàn thành 15 câu hỏi ôn tập lý thuyết!
          </div>
          <p className="text-sm text-slate-700">
            Kết quả: Đúng <strong>{correctCount}</strong> / {questions.length} câu · Sai{' '}
            <strong>{incorrectCount}</strong> câu.
          </p>
          <div className="flex justify-center gap-3">
            <button
              type="button"
              onClick={() => setIsCompleted(false)}
              className="px-4 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-800 text-xs sm:text-sm font-semibold rounded-xl"
            >
              Xem lại từng câu
            </button>
            <button
              type="button"
              onClick={handleResetQuiz}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-semibold rounded-xl"
            >
              Làm lại từ đầu
            </button>
          </div>
        </div>
      ) : (
        currentQuestion && (
          <div className="space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs font-semibold text-sky-800">
                {currentQuestion.unitTitle} · Câu {currentQuestion.number} / {questions.length}
              </span>
              <button
                type="button"
                onClick={() =>
                  setShowHint((prev) => ({
                    ...prev,
                    [currentQuestion.id]: !prev[currentQuestion.id],
                  }))
                }
                className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5"
              >
                <HelpCircle className="w-3.5 h-3.5 text-amber-600" />
                <span>{showHint[currentQuestion.id] ? 'Ẩn gợi ý' : 'Hiện gợi ý'}</span>
              </button>
            </div>

            {showHint[currentQuestion.id] && (
              <div className="bg-amber-50/80 border border-amber-200 rounded-xl p-4 text-xs sm:text-sm text-amber-950 space-y-1">
                <div className="font-bold text-amber-900">Gợi ý (Dịch nghĩa & Cấu trúc):</div>
                <div>{currentQuestion.hintVi}</div>
              </div>
            )}

            <div className="text-base sm:text-lg font-bold text-slate-900">
              {currentQuestion.stem}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {currentQuestion.options.map((opt) => {
                const isSelected = chosenForCurrent === opt.label;
                const isCorrectOption = isLocked && currentQuestion.correctAnswer === opt.label;
                const isWrongOption = isLocked && isSelected && currentQuestion.correctAnswer !== opt.label;

                return (
                  <button
                    key={opt.label}
                    type="button"
                    disabled={isLocked}
                    onClick={() => handleSelectOption(opt.label)}
                    className={`text-left p-4 rounded-xl border transition-colors flex items-center justify-between gap-3 ${
                      isCorrectOption
                        ? 'bg-emerald-50 border-emerald-600 text-emerald-950 font-semibold'
                        : isWrongOption
                        ? 'bg-rose-50 border-rose-500 text-rose-950 font-semibold'
                        : 'bg-white border-slate-200 hover:bg-sky-50/50 hover:border-sky-300 text-slate-800'
                    }`}
                  >
                    <span className="text-sm sm:text-base">
                      <strong className="mr-2">{opt.label}.</strong>
                      {opt.text}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* If user selected wrong option -> show immediate explanation and Next button */}
            {isLocked && chosenForCurrent !== currentQuestion.correctAnswer && (
              <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 space-y-2">
                <div className="text-sm sm:text-base font-bold text-rose-900 flex items-center gap-2">
                  <XCircle className="w-5 h-5 text-rose-600 shrink-0" />
                  <span>
                    Chưa chính xác! Đáp án đúng là: {currentQuestion.correctAnswer}
                  </span>
                </div>
                <div className="text-xs sm:text-sm text-slate-800 leading-relaxed">
                  {currentQuestion.explanationVi}
                </div>
                <div className="pt-2">
                  {currentIndex < questions.length - 1 ? (
                    <button
                      type="button"
                      onClick={() =>
                        setCurrentIndex((prev) => Math.min(questions.length - 1, prev + 1))
                      }
                      className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs sm:text-sm font-semibold rounded-xl transition-colors"
                    >
                      Đã hiểu – Câu tiếp theo
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setIsCompleted(true)}
                      className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs sm:text-sm font-semibold rounded-xl transition-colors"
                    >
                      Đã hiểu – Xem tổng kết 15 câu
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* If user is reviewing an already-correct question */}
            {isLocked && chosenForCurrent === currentQuestion.correctAnswer && (
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 space-y-1.5">
                <div className="text-sm font-bold text-emerald-900 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Chính xác! (Đáp án {currentQuestion.correctAnswer})</span>
                </div>
                <div className="text-xs sm:text-sm text-slate-700">
                  {currentQuestion.explanationVi}
                </div>
              </div>
            )}

            {/* Prev / Next Navigation */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-4">
              <button
                type="button"
                disabled={currentIndex === 0}
                onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
                className="px-3.5 py-2 bg-white border border-slate-300 hover:bg-slate-50 disabled:opacity-40 disabled:pointer-events-none text-slate-800 text-xs sm:text-sm font-semibold rounded-xl flex items-center gap-1.5"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Câu trước</span>
              </button>

              <span className="text-xs text-slate-500 font-mono tabular-nums">
                Chọn đúng sẽ tự động chuyển sang câu tiếp theo
              </span>

              <button
                type="button"
                disabled={currentIndex >= questions.length - 1}
                onClick={() =>
                  setCurrentIndex((prev) => Math.min(questions.length - 1, prev + 1))
                }
                className="px-3.5 py-2 bg-white border border-slate-300 hover:bg-slate-50 disabled:opacity-40 disabled:pointer-events-none text-slate-800 text-xs sm:text-sm font-semibold rounded-xl flex items-center gap-1.5"
              >
                <span>Câu tiếp theo</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )
      )}
    </div>
  );
};
