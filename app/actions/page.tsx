'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { loadState, saveActions, toggleAction } from '@/lib/store';
import type { Action, AppState } from '@/lib/types';
import { categoryColor, categoryEmoji, cn, difficultyColor } from '@/lib/utils';

const DEMO_ACTIONS: Action[] = [
  { id: '1', category: 'transport', title: 'Switch to an electric vehicle', description: 'Switching from your gasoline car to an EV would cut your transport emissions by ~60%.', annualSavingKg: 2800, difficulty: 'hard', completed: false, committed: false },
  { id: '2', category: 'food', title: 'Cut beef to once per week', description: 'Reducing beef from 4 to 1 serving/week saves roughly 450kg CO₂e — one of the highest-ROI diet changes.', annualSavingKg: 450, difficulty: 'medium', completed: false, committed: true },
  { id: '3', category: 'energy', title: 'Switch to a green energy plan', description: 'Many utilities offer 100% renewable plans. This alone cuts your electricity emissions by ~85%.', annualSavingKg: 700, difficulty: 'easy', completed: false, committed: false },
  { id: '4', category: 'transport', title: 'Work from home 2 days/week', description: 'Two WFH days reduces your commute miles by 40%, saving over 600kg CO₂e annually.', annualSavingKg: 620, difficulty: 'medium', completed: true, committed: false },
  { id: '5', category: 'food', title: 'Try Meatless Mondays', description: 'One meat-free day per week saves ~350kg CO₂e/year with minimal lifestyle change.', annualSavingKg: 350, difficulty: 'easy', completed: false, committed: false },
  { id: '6', category: 'energy', title: 'Lower thermostat by 2°F in winter', description: 'Each degree reduction saves ~3% on heating. At 2°F, you save ~80kg CO₂e from your gas usage.', annualSavingKg: 80, difficulty: 'easy', completed: false, committed: false },
  { id: '7', category: 'shopping', title: 'Buy secondhand clothing', description: 'Switching half your clothing purchases to thrift / resale cuts your fashion footprint by 50%.', annualSavingKg: 180, difficulty: 'easy', completed: false, committed: false },
  { id: '8', category: 'transport', title: 'Take trains instead of short flights', description: 'A short domestic flight emits 10x more CO₂ than the equivalent train journey.', annualSavingKg: 400, difficulty: 'medium', completed: false, committed: false },
  { id: '9', category: 'food', title: 'Reduce food waste by 50%', description: 'Planning meals and using leftovers can cut your food waste emissions significantly.', annualSavingKg: 120, difficulty: 'easy', completed: false, committed: false },
  { id: '10', category: 'energy', title: 'Install LED lights throughout home', description: 'LEDs use 75% less energy than incandescent bulbs. Full home switch saves ~50kg CO₂e/year.', annualSavingKg: 50, difficulty: 'easy', completed: false, committed: false },
  { id: '11', category: 'shopping', title: 'Keep electronics 2 extra years', description: 'Manufacturing is the biggest carbon cost of devices. Extending life from 3→5 years halves the impact.', annualSavingKg: 150, difficulty: 'medium', completed: false, committed: false },
  { id: '12', category: 'energy', title: 'Upgrade to a heat pump', description: 'Heat pumps are 3x more efficient than gas heating. This is your biggest single energy upgrade.', annualSavingKg: 900, difficulty: 'hard', completed: false, committed: false },
];

export default function ActionsPage() {
  const [actions, setActions] = useState<Action[]>([]);
  const [state, setState] = useState<AppState | null>(null);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<'all' | 'committed' | 'completed'>('all');
  const [catFilter, setCatFilter] = useState<string>('all');
  const [loadError, setLoadError] = useState('');
  const [isDemo, setIsDemo] = useState(false);

  useEffect(() => {
    const s = loadState();
    setState(s);
    if (s.actions && s.actions.length > 0) {
      setActions(s.actions);
    } else if (!s.profile) {
      setActions(DEMO_ACTIONS);
      setIsDemo(true);
    }
  }, []);

  async function generateActions() {
    if (!state?.profile || !state?.breakdown) return;
    setLoading(true);
    setLoadError('');
    try {
      const res = await fetch('/api/actions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profile: state.profile, breakdown: state.breakdown }),
      });
      const data = await res.json();
      setActions(data.actions);
      saveActions(data.actions);
    } catch {
      setLoadError('Failed to generate actions. Check your API key.');
    } finally {
      setLoading(false);
    }
  }

  function handleToggle(id: string, field: 'completed' | 'committed') {
    if (isDemo) {
      setActions(prev => prev.map(a => a.id === id ? { ...a, [field]: !a[field] } : a));
      return;
    }
    const updated = toggleAction(id, field);
    setActions(updated);
  }

  const sorted = [...actions].sort((a, b) => b.annualSavingKg - a.annualSavingKg);

  const filtered = sorted.filter(a => {
    if (filter === 'committed' && !a.committed) return false;
    if (filter === 'completed' && !a.completed) return false;
    if (catFilter !== 'all' && a.category !== catFilter) return false;
    return true;
  });

  const totalCommittedSaving = actions.filter(a => a.committed).reduce((s, a) => s + a.annualSavingKg, 0);
  const totalCompletedSaving = actions.filter(a => a.completed).reduce((s, a) => s + a.annualSavingKg, 0);
  const completedCount = actions.filter(a => a.completed).length;

  return (
    <div className="min-h-screen hero-bg py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {isDemo && (
          <div className="mb-6 px-4 py-3 rounded-xl text-sm text-amber-400 text-center"
            style={{ background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.2)' }}>
            Demo actions shown. <Link href="/calculator" className="underline font-medium">Complete your assessment for personalized AI actions →</Link>
          </div>
        )}

        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold">Action Center</h1>
            <p className="text-slate-400 mt-1">AI-ranked actions sorted by your biggest impact</p>
          </div>
          {state?.profile && (
            <button
              onClick={generateActions}
              disabled={loading}
              className="px-5 py-2.5 rounded-xl text-sm font-medium text-white disabled:opacity-50"
              style={{ background: 'linear-gradient(135deg, #10b981, #3b82f6)' }}
            >
              {loading ? 'Generating...' : actions.length ? 'Refresh AI Actions' : 'Generate My Actions'}
            </button>
          )}
        </div>

        {loadError && <p className="text-red-400 text-sm mb-4">{loadError}</p>}

        {/* Impact Summary */}
        {actions.length > 0 && (
          <div className="grid grid-cols-3 gap-4 mb-8">
            <div className="glass rounded-2xl p-4 text-center">
              <div className="text-2xl font-bold text-emerald-400">{(totalCommittedSaving / 1000).toFixed(2)}t</div>
              <div className="text-xs text-slate-400 mt-1">Committed savings</div>
            </div>
            <div className="glass rounded-2xl p-4 text-center">
              <div className="text-2xl font-bold text-blue-400">{(totalCompletedSaving / 1000).toFixed(2)}t</div>
              <div className="text-xs text-slate-400 mt-1">Completed savings</div>
            </div>
            <div className="glass rounded-2xl p-4 text-center">
              <div className="text-2xl font-bold text-white">{completedCount}/{actions.length}</div>
              <div className="text-xs text-slate-400 mt-1">Actions completed</div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="flex flex-wrap gap-2 mb-6">
          {['all', 'committed', 'completed'].map(f => (
            <button key={f} onClick={() => setFilter(f as typeof filter)}
              className={cn('px-4 py-2 rounded-xl text-sm font-medium transition-all',
                filter === f ? 'bg-emerald-500/20 text-emerald-400' : 'glass text-slate-400 hover:text-slate-200')}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
          <div className="ml-auto flex gap-2">
            {['all', 'transport', 'energy', 'food', 'shopping'].map(c => (
              <button key={c} onClick={() => setCatFilter(c)}
                className={cn('px-3 py-2 rounded-xl text-xs font-medium transition-all',
                  catFilter === c ? 'text-white' : 'glass text-slate-500 hover:text-slate-300')}
                style={catFilter === c ? { background: categoryColor(c) } : {}}>
                {c === 'all' ? 'All' : categoryEmoji(c)}
              </button>
            ))}
          </div>
        </div>

        {/* Action Cards */}
        {loading ? (
          <div className="flex items-center justify-center py-16 gap-3">
            <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
            <span className="text-slate-400">Claude is generating personalized actions...</span>
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map((action, i) => (
              <div
                key={action.id}
                className={cn('glass rounded-2xl p-5 transition-all', action.completed && 'opacity-60')}
                style={{ border: `1px solid ${action.committed ? 'rgba(16,185,129,0.3)' : 'rgba(255,255,255,0.08)'}` }}
              >
                <div className="flex items-start gap-4">
                  <div className="text-2xl shrink-0 pt-0.5">
                    {action.completed ? '✅' : categoryEmoji(action.category)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 flex-wrap mb-1">
                      <span className="font-semibold text-white">{i + 1}. {action.title}</span>
                      <span className={cn('text-xs font-medium', difficultyColor(action.difficulty))}>
                        {action.difficulty}
                      </span>
                    </div>
                    <p className="text-slate-400 text-sm mb-3">{action.description}</p>
                    <div className="flex items-center gap-4 flex-wrap">
                      <span className="text-emerald-400 text-sm font-semibold">
                        Saves {action.annualSavingKg >= 1000
                          ? `${(action.annualSavingKg / 1000).toFixed(1)}t`
                          : `${action.annualSavingKg}kg`} CO₂/yr
                      </span>
                      <div className="flex gap-2 ml-auto">
                        <button
                          onClick={() => handleToggle(action.id, 'committed')}
                          className={cn('px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
                            action.committed
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                              : 'glass text-slate-400 hover:text-slate-200')}
                        >
                          {action.committed ? '★ Committed' : '☆ Commit'}
                        </button>
                        <button
                          onClick={() => handleToggle(action.id, 'completed')}
                          className={cn('px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
                            action.completed
                              ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                              : 'glass text-slate-400 hover:text-slate-200')}
                        >
                          {action.completed ? '✓ Done' : 'Mark Done'}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {filtered.length === 0 && !loading && (
          <div className="text-center py-12 text-slate-500">
            No actions match the current filter.
          </div>
        )}
      </div>
    </div>
  );
}
