import {
  AttemptHistoryRecord,
  DraftSession,
  StudyProgressState,
  UserSettings,
} from '../types';

const STORAGE_KEYS = {
  DRAFTS: 'eng_midterm1_drafts_v1',
  HISTORY: 'eng_midterm1_history_v1',
  PROGRESS: 'eng_midterm1_progress_v1',
  SETTINGS: 'eng_midterm1_settings_v1',
};

export const DEFAULT_STUDY_PROGRESS: StudyProgressState = {
  vocabStatus: {},
  viewedVocabIds: [],
  lastVocabUnitFilter: 'all',
  lastVocabIndex: 0,
  reviewedGrammarIds: [],
  reviewedStructureIds: [],
  totalStudySeconds: 0,
};

export const DEFAULT_USER_SETTINGS: UserSettings = {
  fontSize: 'normal',
  autoSaveDraft: true,
  showSourceNotes: true,
};

export interface StorageSaveResult {
  ok: boolean;
  errorMessageVi?: string;
}

function safeWriteJson<T>(key: string, value: T): StorageSaveResult {
  try {
    const serialized = JSON.stringify(value);
    window.localStorage.setItem(key, serialized);
    return { ok: true };
  } catch (err) {
    console.error(`Lỗi lưu trữ tại khóa ${key}:`, err);
    return {
      ok: false,
      errorMessageVi:
        'Không thể lưu dữ liệu vào bộ nhớ trình duyệt (có thể do dung lượng lưu trữ đã đầy hoặc trình duyệt chặn bộ nhớ cục bộ).',
    };
  }
}

function safeReadJson<T>(key: string, fallback: T): { data: T; corrupted: boolean } {
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return { data: fallback, corrupted: false };
    const parsed = JSON.parse(raw) as T;
    if (parsed === null || typeof parsed !== 'object') {
      return { data: fallback, corrupted: true };
    }
    return { data: parsed, corrupted: false };
  } catch (err) {
    console.error(`Lỗi đọc dữ liệu tại khóa ${key}:`, err);
    return { data: fallback, corrupted: true };
  }
}

export function loadDrafts(): { drafts: DraftSession[]; corrupted: boolean } {
  const res = safeReadJson<DraftSession[]>(STORAGE_KEYS.DRAFTS, []);
  if (!Array.isArray(res.data)) {
    return { drafts: [], corrupted: true };
  }
  // Validate essential draft properties so corrupted entries don't crash recovery
  const validDrafts = res.data.filter(
    (d) =>
      d &&
      typeof d.id === 'string' &&
      typeof d.examId === 'string' &&
      (d.mode === 'practice' || d.mode === 'mock') &&
      typeof d.currentQuestionIndex === 'number' &&
      d.selectedAnswers &&
      typeof d.selectedAnswers === 'object'
  );
  return {
    drafts: validDrafts,
    corrupted: res.corrupted || validDrafts.length !== res.data.length,
  };
}

export function saveDrafts(drafts: DraftSession[]): StorageSaveResult {
  return safeWriteJson(STORAGE_KEYS.DRAFTS, drafts);
}

export function upsertDraft(draft: DraftSession): StorageSaveResult {
  const { drafts } = loadDrafts();
  const idx = drafts.findIndex((d) => d.id === draft.id);
  const updated = [...drafts];
  if (idx >= 0) {
    updated[idx] = draft;
  } else {
    updated.unshift(draft);
  }
  return saveDrafts(updated);
}

export function deleteDraftById(draftId: string): StorageSaveResult {
  const { drafts } = loadDrafts();
  const filtered = drafts.filter((d) => d.id !== draftId);
  return saveDrafts(filtered);
}

export function loadHistory(): AttemptHistoryRecord[] {
  const res = safeReadJson<AttemptHistoryRecord[]>(STORAGE_KEYS.HISTORY, []);
  if (!Array.isArray(res.data)) return [];
  return res.data;
}

export function saveHistory(records: AttemptHistoryRecord[]): StorageSaveResult {
  return safeWriteJson(STORAGE_KEYS.HISTORY, records);
}

export function appendHistoryRecord(record: AttemptHistoryRecord): StorageSaveResult {
  const current = loadHistory();
  // Always create a distinct new record at the top, never overwrite previous attempts
  return saveHistory([record, ...current]);
}

export function deleteHistoryById(recordId: string): StorageSaveResult {
  const current = loadHistory();
  return saveHistory(current.filter((r) => r.id !== recordId));
}

export function loadStudyProgress(): StudyProgressState {
  const res = safeReadJson<StudyProgressState>(STORAGE_KEYS.PROGRESS, DEFAULT_STUDY_PROGRESS);
  return {
    ...DEFAULT_STUDY_PROGRESS,
    ...res.data,
    vocabStatus: res.data?.vocabStatus || {},
    viewedVocabIds: Array.isArray(res.data?.viewedVocabIds) ? res.data.viewedVocabIds : [],
    reviewedGrammarIds: Array.isArray(res.data?.reviewedGrammarIds)
      ? res.data.reviewedGrammarIds
      : [],
    reviewedStructureIds: Array.isArray(res.data?.reviewedStructureIds)
      ? res.data.reviewedStructureIds
      : [],
  };
}

export function saveStudyProgress(progress: StudyProgressState): StorageSaveResult {
  return safeWriteJson(STORAGE_KEYS.PROGRESS, progress);
}

export function loadUserSettings(): UserSettings {
  const res = safeReadJson<UserSettings>(STORAGE_KEYS.SETTINGS, DEFAULT_USER_SETTINGS);
  return {
    ...DEFAULT_USER_SETTINGS,
    ...res.data,
  };
}

export function saveUserSettings(settings: UserSettings): StorageSaveResult {
  return safeWriteJson(STORAGE_KEYS.SETTINGS, settings);
}

export function clearAllAppData(): StorageSaveResult {
  try {
    window.localStorage.removeItem(STORAGE_KEYS.DRAFTS);
    window.localStorage.removeItem(STORAGE_KEYS.HISTORY);
    window.localStorage.removeItem(STORAGE_KEYS.PROGRESS);
    window.localStorage.removeItem(STORAGE_KEYS.SETTINGS);
    return { ok: true };
  } catch (err) {
    console.error('Lỗi xóa dữ liệu:', err);
    return {
      ok: false,
      errorMessageVi: 'Không thể xóa dữ liệu trong bộ nhớ trình duyệt.',
    };
  }
}

export interface BackupPayload {
  appName: string;
  exportedAt: string;
  drafts: DraftSession[];
  history: AttemptHistoryRecord[];
  progress: StudyProgressState;
  settings: UserSettings;
}

export function createBackupPayload(): BackupPayload {
  return {
    appName: 'ENGLISH MIDTERM I – ÔN TẬP VÀ LUYỆN ĐỀ',
    exportedAt: new Date().toISOString(),
    drafts: loadDrafts().drafts,
    history: loadHistory(),
    progress: loadStudyProgress(),
    settings: loadUserSettings(),
  };
}
