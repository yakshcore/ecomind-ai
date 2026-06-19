'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend, ReferenceLine,
} from 'recharts';
import { loadState } from '@/lib/store';
import { getCarbonRating, getEquivalences, GLOBAL_AVERAGES } from '@/lib/carbon-calculator';
import type { AppState } from '@/lib/types';
import { categoryColor, categoryEmoji, monthLabel } from '@/lib/utils';
import ReactMarkdown from 'react-markdown';

// Demo data used when no profile exists
const DEMO: AppState = {
  profile: {
    name: 'Demo User', location: 'United States',
    transport: { carType: 'gasoline', carMilesPerWeek: 150, flightsPerYear: 3, flightType: 'mixed', publicTransitMilesPerWeek: 10 },
    energy: { electricityKwhPerMonth: 900, naturalGasThermPerMonth: 60, heatingType: 'gas', householdSize: 2, homeSize: 'medium', renewableEnergy: false },
    food: { diet: 'average_meat', beefServingsPerWeek: 4, dairyServingsPerDay: 2, foodWaste: 'average', localFood: 'sometimes' },
    shopping: { clothingItemsPerMonth: 3, newElectronicsPerYear: 2, shoppingFrequency: 'average', recyclingHabits: 'moderate' },
    createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
  },
  breakdown: { transport: 5.2, energy: 3.1, food: 3.3, shopping: 1.8, total: 13.4 },
  history: [
    { month: '2026-01', total: 14.2, transport: 5.6, energy: 3.8, food: 3.3, shopping: 1.5 },
    { month: '2026-02', total: 13.8, transport: 5.4, energy: 3.5, food: 3.3, shopping: 1.6 },
    { month: '2026-03', total: 13.6, transport: 5.3, energy: 3.3, food: 3.3, shopping: 1.7 },
    { month: '2026-04', total: 13.5, transport: 5.2, energy: 3.2, food: 3.3, shopping: 1.8 },
    { month: '2026-05', total: 13.4, transport: 5.2, energy: 3.1, food: 3.3, shopping: 1.8 },
  ],
  actions: [],
  goals: { targetReductionPercent: 50, targetYear: 2030 },
  lastAnalysis: null,
};

const CATS = ['transport', 'energy', 'food', 'shopping'] as const;

export default function DashboardPage() {
  const [state, setState] = useState<AppState>(DEMO);
  const [isDemo, setIsDemo] = useState(true);
  const [analysis, setAnalysis] = useState('');
  const [loadingAnalysis, setLoadingAnalysis] = useState(false);
  const [analysisError, setAnalysisError] = useState('');

  useEffect(() => {
    const loaded = loadState();
    if (loaded.profile && loaded.breakdown) {
      setState(loaded);
      setIsDemo(false);
      if (loaded.lastAnalysis) setAnalysis(loaded.lastAnalysis);
    }
  }, []);

  const { breakdown, profile, history } = state;
  if (!breakdown || !profile) return null;

  const rating = getCarbonRating(breakdown.total);
  const eq = getEquivalences(breakdown.total);

  const pieData = CATS.map(c => ({
    name: c.charAt(0).toUpperCase() + c.slice(1),
    value: breakdown[c],
    color: categoryColor(c),
  }));

  const barData = history.map(h => ({
    month: monthLabel(h.month),
    transport: h.transport, energy: h.energy, food: h.food, shopping: h.shopping,
    total: h.total,
  }));

  const benchmarks = [
    { label: 'Your footprint', value: breakdown.total, color: rating.color },
    { label: 'US Average', value: GLOBAL_AVERAGES.usa, color: '#64748b' },
    { label: 'EU Average', value: GLOBAL_AVERAGES.eu, color: '#64748b' },
    { label: 'World Average', value: GLOBAL_AVERAGES.world, color: '#64748b' },
    { label: '2030 Target', value: 4.7, color: '#10b981' },
    { label: 'Paris 1.5°C', value: 2.0, color: '#059669' },
  ];

  async function handleAnalyze() {
    setLoadingAnalysis(true);
    setAnalysisError('');
    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profile, breakdown }),
      });
      const data = await res.json();
      setAnalysis(data.analysis);
      const { saveAnalysis } = await import('@/lib/store');
      saveAnalysis(data.analysis);
    } catch {
      setAnalysisError('Failed to load AI analysis. Check your API key configuration.');
    } finally {
      setLoadingAnalysis(false);
    }
  }

  return (
    <div className="min-h-screen hero-bg py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {isDemo && (
          <div className="mb-6 px-4 py-3 rounded-xl text-sm text-amber-400 text-center"
            style={{ background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.2)' }}>
            Viewing demo data. <Link href="/calculator" className="underline font-medium">Complete your assessment →</Link>
          </div>
        )}

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold">{profile.name}&apos;s Carbon Dashboard</h1>
            <p className="text-slate-400 mt-1">{profile.location} &bull; Updated {new Date(profile.updatedAt).toLocaleDateString()}</p>
          </div>
          <div className="flex gap-3">
            <Link href="/actions"
              className="px-5 py-2.5 rounded-xl text-sm font-medium text-white"
              style={{ background: 'linear-gradient(135deg, #10b981, #3b82f6)' }}>
              View Action Plan →
            </Link>
            <Link href="/calculator"
              className="px-5 py-2.5 rounded-xl text-sm font-medium text-slate-300"
              style={{ border: '1px solid rgba(255,255,255,0.12)' }}>
              Recalculate
            </Link>
          </div>
        </div>

        {/* Score Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="glass rounded-2xl p-5 col-span-2 md:col-span-1">
            <div className="text-sm text-slate-400 mb-1">Annual Footprint</div>
            <div className="text-3xl font-bold" style={{ color: rating.color }}>{breakdown.total}t</div>
            <div className="text-xs mt-1" style={{ color: rating.color }}>{rating.label}</div>
          </div>
          {CATS.map(c => (
            <div key={c} className="glass rounded-2xl p-5">
              <div className="text-sm text-slate-400 mb-1">{categoryEmoji(c)} {c.charAt(0).toUpperCase() + c.slice(1)}</div>
              <div className="text-2xl font-bold text-white">{breakdown[c]}t</div>
              <div className="text-xs text-slate-500 mt-1">{((breakdown[c] / breakdown.total) * 100).toFixed(0)}% of total</div>
            </div>
          ))}
        </div>

        {/* Equivalences */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { icon: '🌳', value: eq.treesNeeded.toLocaleString(), label: 'trees to offset annually' },
            { icon: '🚗', value: `${(eq.milesDriven / 1000).toFixed(0)}K`, label: 'gas-car miles equivalent' },
            { icon: '✈️', value: eq.flightsNYtoLA, label: 'NY↔LA flights equivalent' },
            { icon: '📱', value: `${(eq.smartphoneCharges / 1000).toFixed(0)}K`, label: 'smartphone charges' },
          ].map(e => (
            <div key={e.label} className="glass rounded-2xl p-4 text-center">
              <div className="text-2xl mb-1">{e.icon}</div>
              <div className="text-xl font-bold text-white">{e.value}</div>
              <div className="text-xs text-slate-400 mt-1">{e.label}</div>
            </div>
          ))}
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Pie Chart */}
          <div className="glass rounded-2xl p-6">
            <h3 className="text-lg font-semibold mb-4">Emissions by Category</h3>
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={100}
                  paddingAngle={3} dataKey="value">
                  {pieData.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ background: '#1a1f3e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, color: '#e2e8f0' }}
                  formatter={(v) => [`${v}t CO₂e`, '']}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex flex-wrap gap-3 justify-center mt-2">
              {pieData.map(d => (
                <div key={d.name} className="flex items-center gap-2 text-xs">
                  <span className="w-3 h-3 rounded-full inline-block" style={{ background: d.color }} />
                  <span className="text-slate-300">{d.name}: {d.value}t</span>
                </div>
              ))}
            </div>
          </div>

          {/* Bar Chart */}
          <div className="glass rounded-2xl p-6">
            <h3 className="text-lg font-semibold mb-4">Monthly Trend</h3>
            {barData.length > 0 ? (
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={barData} margin={{ top: 0, right: 0, bottom: 0, left: -20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="month" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                  <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} />
                  <Tooltip contentStyle={{ background: '#1a1f3e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, color: '#e2e8f0' }} />
                  <Legend wrapperStyle={{ fontSize: 11, color: '#94a3b8' }} />
                  {CATS.map(c => (
                    <Bar key={c} dataKey={c} stackId="a" fill={categoryColor(c)} />
                  ))}
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-60 flex items-center justify-center text-slate-500 text-sm">
                Track monthly to see trends
              </div>
            )}
          </div>
        </div>

        {/* Benchmark */}
        <div className="glass rounded-2xl p-6 mb-8">
          <h3 className="text-lg font-semibold mb-4">How You Compare</h3>
          <div className="space-y-3">
            {benchmarks.map(b => {
              const max = GLOBAL_AVERAGES.usa * 1.1;
              const pct = Math.min((b.value / max) * 100, 100);
              return (
                <div key={b.label} className="flex items-center gap-4">
                  <div className="w-32 text-sm text-slate-400 text-right shrink-0">{b.label}</div>
                  <div className="flex-1 h-7 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.05)' }}>
                    <div className="h-full rounded-full flex items-center pl-3 text-xs font-medium text-white"
                      style={{ width: `${pct}%`, background: b.color, minWidth: 50 }}>
                      {b.value}t
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          <p className="text-xs text-slate-500 mt-4">
            The Paris Agreement 1.5°C pathway requires ~2t CO₂e per person by 2030.
          </p>
        </div>

        {/* AI Analysis */}
        <div className="glass rounded-2xl p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">🤖 AI Personalized Analysis</h3>
            <button
              onClick={handleAnalyze}
              disabled={loadingAnalysis}
              className="px-5 py-2 rounded-xl text-sm font-medium text-white disabled:opacity-50"
              style={{ background: 'linear-gradient(135deg, #10b981, #3b82f6)' }}
            >
              {loadingAnalysis ? 'Analyzing...' : analysis ? 'Refresh Analysis' : 'Generate Analysis'}
            </button>
          </div>

          {analysisError && (
            <p className="text-red-400 text-sm mb-3">{analysisError}</p>
          )}

          {loadingAnalysis && (
            <div className="flex items-center gap-3 py-8 justify-center">
              <div className="w-5 h-5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
              <span className="text-slate-400">Claude is analyzing your footprint...</span>
            </div>
          )}

          {analysis && !loadingAnalysis && (
            <div className="prose-dark">
              <ReactMarkdown>{analysis}</ReactMarkdown>
            </div>
          )}

          {!analysis && !loadingAnalysis && (
            <p className="text-slate-500 text-sm">
              Click &ldquo;Generate Analysis&rdquo; to get Claude AI&apos;s personalized insights on your footprint.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
