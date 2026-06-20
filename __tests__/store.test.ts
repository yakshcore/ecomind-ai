// Set up localStorage mock BEFORE any imports.
// The store functions check `typeof window === 'undefined'` at CALL TIME (inside function bodies),
// so mocking globalThis before the test code runs is sufficient.

const mockStorage: Record<string, string> = {};

const localStorageMock: Storage = {
  getItem: (key: string): string | null => mockStorage[key] ?? null,
  setItem: (key: string, value: string): void => { mockStorage[key] = value; },
  removeItem: (key: string): void => { delete mockStorage[key]; },
  clear: (): void => { Object.keys(mockStorage).forEach(k => delete mockStorage[k]); },
  length: 0,
  key: (_index: number): string | null => null,
};

Object.defineProperty(globalThis, 'window', { value: globalThis, writable: true, configurable: true });
Object.defineProperty(globalThis, 'localStorage', { value: localStorageMock, writable: true, configurable: true });

import {
  loadState,
  saveProfile,
  saveBreakdown,
  saveActions,
  toggleAction,
  saveAnalysis,
  clearAll,
  loadChat,
  saveChat,
} from '@/lib/store';
import type { UserProfile, CarbonBreakdown, Action } from '@/lib/types';

const mockProfile: UserProfile = {
  name: 'Test User',
  location: 'USA',
  transport: { carType: 'gasoline', carMilesPerWeek: 100, flightType: 'short', publicTransitMilesPerWeek: 10 },
  energy: { electricityKwhPerMonth: 900, naturalGasThermPerMonth: 50, heatingType: 'gas', householdSize: 2, homeSize: 'medium', renewableEnergy: false },
  food: { diet: 'average_meat', beefServingsPerWeek: 3, dairyServingsPerDay: 2, foodWaste: 'average', localFood: 'sometimes' },
  shopping: { clothingItemsPerMonth: 2, newElectronicsPerYear: 1, shoppingFrequency: 'average', recyclingHabits: 'moderate' },
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

const mockBreakdown: CarbonBreakdown = {
  transport: 3.5, energy: 2.8, food: 3.2, shopping: 1.4, total: 10.9,
};

const mockAction: Action = {
  id: 'action-1',
  category: 'transport',
  title: 'Switch to EV',
  description: 'Switch your gasoline car to electric.',
  annualSavingKg: 2800,
  difficulty: 'hard',
  completed: false,
  committed: false,
};

beforeEach(() => {
  localStorageMock.clear();
});

describe('loadState', () => {
  it('returns default state when localStorage is empty', () => {
    const state = loadState();
    expect(state.profile).toBeNull();
    expect(state.breakdown).toBeNull();
    expect(state.history).toEqual([]);
    expect(state.actions).toEqual([]);
  });
});

describe('saveProfile / loadState', () => {
  it('saves and retrieves a profile', () => {
    saveProfile(mockProfile);
    const state = loadState();
    expect(state.profile?.name).toBe('Test User');
    expect(state.profile?.location).toBe('USA');
  });

  it('does not overwrite other state fields when saving profile', () => {
    saveProfile(mockProfile);
    saveActions([mockAction]);
    saveProfile({ ...mockProfile, name: 'Updated' });
    const state = loadState();
    expect(state.profile?.name).toBe('Updated');
    expect(state.actions).toHaveLength(1);
  });
});

describe('saveBreakdown / loadState', () => {
  it('saves breakdown and adds a monthly history entry', () => {
    saveBreakdown(mockBreakdown);
    const state = loadState();
    expect(state.breakdown?.total).toBe(10.9);
    expect(state.history).toHaveLength(1);
    expect(state.history[0].total).toBe(10.9);
  });

  it('updates the existing monthly entry when saved in the same month', () => {
    saveBreakdown(mockBreakdown);
    saveBreakdown({ ...mockBreakdown, total: 9.5 });
    const state = loadState();
    expect(state.history).toHaveLength(1);
    expect(state.history[0].total).toBe(9.5);
  });
});

describe('saveActions / toggleAction', () => {
  it('saves and retrieves actions', () => {
    saveActions([mockAction]);
    const state = loadState();
    expect(state.actions).toHaveLength(1);
    expect(state.actions[0].id).toBe('action-1');
  });

  it('toggles completed status', () => {
    saveActions([mockAction]);
    const updated = toggleAction('action-1', 'completed');
    expect(updated[0].completed).toBe(true);
  });

  it('toggles committed status', () => {
    saveActions([mockAction]);
    const updated = toggleAction('action-1', 'committed');
    expect(updated[0].committed).toBe(true);
  });

  it('double-toggle reverts to original state', () => {
    saveActions([mockAction]);
    toggleAction('action-1', 'completed');
    const updated = toggleAction('action-1', 'completed');
    expect(updated[0].completed).toBe(false);
  });
});

describe('saveAnalysis', () => {
  it('persists the AI analysis text', () => {
    saveAnalysis('Your footprint is below average.');
    const state = loadState();
    expect(state.lastAnalysis).toBe('Your footprint is below average.');
  });
});

describe('clearAll', () => {
  it('clears all stored state', () => {
    saveProfile(mockProfile);
    saveBreakdown(mockBreakdown);
    clearAll();
    const state = loadState();
    expect(state.profile).toBeNull();
    expect(state.breakdown).toBeNull();
  });
});

describe('corrupt data recovery', () => {
  it('loadState falls back to default state when stored JSON is invalid', () => {
    localStorageMock.setItem('ecomind_state', '{not valid json');
    const state = loadState();
    expect(state.profile).toBeNull();
    expect(state.history).toEqual([]);
  });

  it('loadChat falls back to empty array when stored JSON is invalid', () => {
    localStorageMock.setItem('ecomind_chat', '{not valid json');
    expect(loadChat()).toEqual([]);
  });
});

describe('saveChat / loadChat', () => {
  it('returns empty array when no chat is stored', () => {
    expect(loadChat()).toEqual([]);
  });

  it('saves and retrieves chat messages', () => {
    const messages = [
      { role: 'user' as const, content: 'Hello', timestamp: '2026-01-01T00:00:00.000Z' },
      { role: 'assistant' as const, content: 'Hi there!', timestamp: '2026-01-01T00:00:01.000Z' },
    ];
    saveChat(messages);
    const loaded = loadChat();
    expect(loaded).toHaveLength(2);
    expect(loaded[0].content).toBe('Hello');
  });

  it('truncates to last 50 messages', () => {
    const messages = Array.from({ length: 60 }, (_, i) => ({
      role: 'user' as const,
      content: `Message ${i}`,
      timestamp: new Date().toISOString(),
    }));
    saveChat(messages);
    expect(loadChat()).toHaveLength(50);
  });
});
