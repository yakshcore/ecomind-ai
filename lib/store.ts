'use client';
import type { AppState, UserProfile, CarbonBreakdown, MonthlyEntry, Action, ChatMessage } from './types';

const KEY = 'ecomind_state';
const CHAT_KEY = 'ecomind_chat';

const defaultState: AppState = {
  profile: null,
  breakdown: null,
  history: [],
  actions: [],
  goals: { targetReductionPercent: 50, targetYear: 2030 },
  lastAnalysis: null,
};

export function loadState(): AppState {
  if (typeof window === 'undefined') return defaultState;
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? { ...defaultState, ...JSON.parse(raw) } : defaultState;
  } catch {
    return defaultState;
  }
}

export function saveState(state: Partial<AppState>) {
  if (typeof window === 'undefined') return;
  const current = loadState();
  localStorage.setItem(KEY, JSON.stringify({ ...current, ...state }));
}

export function saveProfile(profile: UserProfile) {
  saveState({ profile });
}

export function saveBreakdown(breakdown: CarbonBreakdown) {
  const state = loadState();
  const month = new Date().toISOString().slice(0, 7);
  const existing = state.history.findIndex(h => h.month === month);
  const entry: MonthlyEntry = {
    month,
    total: breakdown.total,
    transport: breakdown.transport,
    energy: breakdown.energy,
    food: breakdown.food,
    shopping: breakdown.shopping,
  };
  const history =
    existing >= 0
      ? state.history.map((h, i) => (i === existing ? entry : h))
      : [...state.history, entry].slice(-12);
  saveState({ breakdown, history });
}

export function saveActions(actions: Action[]) {
  saveState({ actions });
}

export function toggleAction(id: string, field: 'completed' | 'committed') {
  const state = loadState();
  const actions = state.actions.map(a =>
    a.id === id ? { ...a, [field]: !a[field] } : a
  );
  saveState({ actions });
  return actions;
}

export function saveAnalysis(text: string) {
  saveState({ lastAnalysis: text });
}

export function loadChat(): ChatMessage[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(CHAT_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveChat(messages: ChatMessage[]) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(CHAT_KEY, JSON.stringify(messages.slice(-50)));
}

export function clearAll() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(KEY);
  localStorage.removeItem(CHAT_KEY);
}
