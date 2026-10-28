/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { AlertTriangle } from 'lucide-react';
import {
  AppView,
  AttemptHistoryRecord,
  DraftSession,
  PracticeMode,
  StudyProgressState,
  UserSettings,
} from './types';
import {
  appendHistoryRecord,
  clearAllAppData,
  DEFAULT_STUDY_PROGRESS,
  DEFAULT_USER_SETTINGS,
  deleteDraftById,
  deleteHistoryById,
  loadDrafts,
  loadHistory,
  loadStudyProgress,
  loadUserSettings,
  saveStudyProgress,
  saveUserSettings,
  upsertDraft,
} from './utils/storage';
import { Navbar } from './components/Navbar';
import { HomeView } from './components/HomeView';
import { TheoryHubView } from './components/TheoryHubView';
import { FlashcardView } from './components/FlashcardView';
import { GrammarView } from './components/GrammarView';
import { SentenceStructuresView } from './components/SentenceStructuresView';
import { ExamPracticeView } from './components/ExamPracticeView';
import { DraftsView } from './components/DraftsView';
import { HistoryView } from './components/HistoryView';
import { StatisticsView } from './components/StatisticsView';
import { SettingsView } from './components/SettingsView';

export default function App() {
  const [currentView, setCurrentView] = useState<AppView>('home');
  const [drafts, setDrafts] = useState<DraftSession[]>([]);
  const [corruptedDraftWarning, setCorruptedDraftWarning] = useState<boolean>(false);
  const [history, setHistory] = useState<AttemptHistoryRecord[]>([]);
  const [progress, setProgress] = useState<StudyProgressState>(DEFAULT_STUDY_PROGRESS);
  const [settings, setSettings] = useState<UserSettings>(DEFAULT_USER_SETTINGS);
  const [storageErrorVi, setStorageErrorVi] = useState<string | null>(null);

  // Exam launch / resume state
  const [activeDraftToResume, setActiveDraftToResume] = useState<DraftSession | null>(null);
  const [directExamConfig, setDirectExamConfig] = useState<{
    examId: string;
    mode: PracticeMode;
  } | null>(null);

  useEffect(() => {
    const loadedDrafts = loadDrafts();
    setDrafts(loadedDrafts.drafts);
    setCorruptedDraftWarning(loadedDrafts.corrupted);
    setHistory(loadHistory());
    setProgress(loadStudyProgress());
    setSettings(loadUserSettings());
  }, []);

  // Track study time when in theory/flashcards/grammar/structures views
  useEffect(() => {
    const isTheoryActive =
      currentView === 'theory' ||
      currentView === 'flashcards' ||
      currentView === 'grammar' ||
      currentView === 'structures';
    if (!isTheoryActive) return;

    const timer = window.setInterval(() => {
      setProgress((prev) => {
        const next = { ...prev, totalStudySeconds: prev.totalStudySeconds + 5 };
        saveStudyProgress(next);
        return next;
      });
    }, 5000);

    return () => window.clearInterval(timer);
  }, [currentView]);

  const handleUpdateProgress = (updater: (prev: StudyProgressState) => StudyProgressState) => {
    setProgress((prev) => {
      const next = updater(prev);
      const res = saveStudyProgress(next);
      if (!res.ok && res.errorMessageVi) {
        setStorageErrorVi(res.errorMessageVi);
      }
      return next;
    });
  };

  const handleSaveDraft = (draft: DraftSession, _showToast: boolean) => {
    const res = upsertDraft(draft);
    if (!res.ok && res.errorMessageVi) {
      setStorageErrorVi(res.errorMessageVi);
    } else {
      setDrafts(loadDrafts().drafts);
    }
  };

  const handleDeleteDraft = (draftId: string) => {
    const res = deleteDraftById(draftId);
    if (!res.ok && res.errorMessageVi) {
      setStorageErrorVi(res.errorMessageVi);
    } else {
      setDrafts(loadDrafts().drafts);
    }
  };

  const handleResumeDraft = (draft: DraftSession) => {
    setDirectExamConfig(null);
    setActiveDraftToResume(draft);
    setCurrentView('exam');
  };

  const handleStartExamDirect = (examId: string, mode: PracticeMode) => {
    setActiveDraftToResume(null);
    setDirectExamConfig({ examId, mode });
    setCurrentView('exam');
  };

  const handleCompleteAttempt = (record: AttemptHistoryRecord, draftIdToClear?: string) => {
    const res = appendHistoryRecord(record);
    if (!res.ok && res.errorMessageVi) {
      setStorageErrorVi(res.errorMessageVi);
    } else {
      setHistory(loadHistory());
    }
    if (draftIdToClear) {
      deleteDraftById(draftIdToClear);
      setDrafts(loadDrafts().drafts);
    }
    setDirectExamConfig(null);
  };

  const handleDeleteHistoryItem = (recordId: string) => {
    const res = deleteHistoryById(recordId);
    if (!res.ok && res.errorMessageVi) {
      setStorageErrorVi(res.errorMessageVi);
    } else {
      setHistory(loadHistory());
    }
  };

  const handleUpdateSettings = (next: UserSettings) => {
    setSettings(next);
    const res = saveUserSettings(next);
    if (!res.ok && res.errorMessageVi) {
      setStorageErrorVi(res.errorMessageVi);
    }
  };

  const handleClearAllData = () => {
    const res = clearAllAppData();
    if (!res.ok && res.errorMessageVi) {
      setStorageErrorVi(res.errorMessageVi);
    } else {
      setDrafts([]);
      setHistory([]);
      setProgress(DEFAULT_STUDY_PROGRESS);
      setSettings(DEFAULT_USER_SETTINGS);
      setCorruptedDraftWarning(false);
    }
  };

  const handleNavigate = (view: AppView) => {
    if (view !== 'exam') {
      setDirectExamConfig(null);
    }
    setCurrentView(view);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div
      className={`min-h-screen flex flex-col bg-slate-50 text-slate-900 ${
        settings.fontSize === 'large' ? 'text-lg' : 'text-base'
      }`}
    >
      <Navbar
        currentView={currentView}
        onNavigate={handleNavigate}
        draftCount={drafts.length}
      />

      {storageErrorVi && (
        <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 pt-4">
          <div
            role="alert"
            className="bg-rose-50 border border-rose-200 rounded-xl p-4 text-xs sm:text-sm text-rose-900 flex items-center justify-between gap-4"
          >
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
              <span>{storageErrorVi}</span>
            </div>
            <button
              type="button"
              onClick={() => setStorageErrorVi(null)}
              className="text-xs font-semibold underline shrink-0"
            >
              Đóng cảnh báo
            </button>
          </div>
        </div>
      )}

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {currentView === 'home' && (
          <HomeView
            onNavigate={handleNavigate}
            onResumeDraft={handleResumeDraft}
            onStartExamDirect={handleStartExamDirect}
            drafts={drafts}
            history={history}
            progress={progress}
          />
        )}

        {currentView === 'theory' && (
          <TheoryHubView onNavigate={handleNavigate} progress={progress} />
        )}

        {currentView === 'flashcards' && (
          <FlashcardView
            onNavigate={handleNavigate}
            progress={progress}
            onUpdateProgress={handleUpdateProgress}
          />
        )}

        {currentView === 'grammar' && (
          <GrammarView
            onNavigate={handleNavigate}
            progress={progress}
            onUpdateProgress={handleUpdateProgress}
          />
        )}

        {currentView === 'structures' && (
          <SentenceStructuresView
            onNavigate={handleNavigate}
            progress={progress}
            onUpdateProgress={handleUpdateProgress}
          />
        )}

        {currentView === 'exam' && (
          <ExamPracticeView
            initialExamId={directExamConfig?.examId || null}
            initialMode={directExamConfig?.mode || null}
            activeDraftToResume={activeDraftToResume}
            onClearResumeDraft={() => setActiveDraftToResume(null)}
            onSaveDraft={handleSaveDraft}
            onDeleteDraft={handleDeleteDraft}
            onCompleteAttempt={handleCompleteAttempt}
            onNavigate={handleNavigate}
            autoSaveEnabled={settings.autoSaveDraft}
            showSourceNotes={settings.showSourceNotes}
          />
        )}

        {currentView === 'drafts' && (
          <DraftsView
            drafts={drafts}
            corruptedDraftWarning={corruptedDraftWarning}
            onResumeDraft={handleResumeDraft}
            onDeleteDraft={handleDeleteDraft}
            onNavigate={handleNavigate}
          />
        )}

        {currentView === 'history' && (
          <HistoryView
            history={history}
            onDeleteHistoryItem={handleDeleteHistoryItem}
            onNavigate={handleNavigate}
          />
        )}

        {currentView === 'stats' && (
          <StatisticsView
            history={history}
            progress={progress}
            onNavigate={handleNavigate}
          />
        )}

        {currentView === 'settings' && (
          <SettingsView
            settings={settings}
            onUpdateSettings={handleUpdateSettings}
            onClearAllData={handleClearAllData}
          />
        )}
      </main>

      <footer className="border-t border-slate-200 bg-white py-5 px-4 sm:px-6 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>
            ENGLISH MIDTERM I – ÔN TẬP VÀ LUYỆN ĐỀ · Nguồn dữ liệu: ĐỀ CƯƠNG + ĐỀ MẪU.pdf
          </span>
          <span>
            Lưu trữ cục bộ trên trình duyệt · Bảo toàn nguyên văn nội dung tài liệu gốc
          </span>
        </div>
      </footer>
    </div>
  );
}
