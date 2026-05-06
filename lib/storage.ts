import { HistoryEntry, QuizSession } from '@/types';

const HISTORY_KEY = 'ka_history';
const SESSION_KEY = 'ka_current_session';

export function getHistory(): HistoryEntry[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveHistoryEntry(entry: HistoryEntry): boolean {
  const history = getHistory();
  if (history.some(h => h.id === entry.id)) return false;
  history.unshift(entry);
  localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
  return true;
}

export function getHistoryByTopic(topicId: string): HistoryEntry[] {
  return getHistory().filter(e => e.topicId === topicId);
}

export function saveCurrentSession(session: Partial<QuizSession>): void {
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

export function getCurrentSession(): Partial<QuizSession> | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}
