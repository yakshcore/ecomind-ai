'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { loadState } from '@/lib/store';
import { getCarbonRating } from '@/lib/carbon-calculator';

const stats = [
  { value: '4.7t', label: 'Sustainable target per person by 2030' },
  { value: '16t', label: 'Average US carbon footprint per year' },
  { value: '50%', label: 'Reduction needed to meet climate goals' },
];

const features = [
  {
    icon: '🧮',
    title: 'Precision Calculator',
    desc: 'EPA-calibrated emission factors across transport, energy, food & shopping categories.',
  },
  {
    icon: '🤖',
    title: 'AI Personal Coach',
    desc: 'Claude AI analyzes your unique footprint and generates a personalized reduction roadmap.',
  },
  {
    icon: '📊',
    title: 'Live Dashboard',
    desc: 'Visualize your carbon breakdown, track monthly progress, and benchmark against global averages.',
  },
  {
    icon: '⚡',
    title: 'Action Center',
    desc: 'AI-ranked actions with quantified CO₂ savings — sorted by your biggest impact opportunities.',
  },
];

export default function HomePage() {
  const [hasProfile, setHasProfile] = useState(false);
  const [total, setTotal] = useState<number | null>(null);

  useEffect(() => {
    const state = loadState();
    if (state.profile && state.breakdown) {
      setHasProfile(true);
      setTotal(state.breakdown.total);
    }
  }, []);

  const rating = total ? getCarbonRating(total) : null;

  return (
    <div className="min-h-screen hero-bg">
      {/* Hero */}
      <section className="max-w-6xl mx-auto px-4 pt-20 pb-24 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass text-sm text-emerald-400 mb-8"
          style={{ border: '1px solid rgba(16,185,129,0.3)' }}>
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse inline-block" />
          Powered by Claude AI &mdash; Real Emission Factors
        </div>

        <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
          Know Your{' '}
          <span className="gradient-text">Carbon Story.</span>
          <br />
          Change It.
        </h1>

        <p className="text-xl text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed">
          EcoMind uses AI to turn your lifestyle data into a personalized climate action plan.
          Understand exactly where your emissions come from and what to do about it.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          {hasProfile ? (
            <>
              <Link
                href="/dashboard"
                className="px-8 py-4 rounded-xl font-semibold text-lg"
                style={{ background: 'linear-gradient(135deg, #10b981, #3b82f6)', color: '#fff' }}
              >
                View My Dashboard →
              </Link>
              {rating && (
                <div className="px-6 py-4 rounded-xl glass text-sm">
                  My footprint: <span className="font-bold" style={{ color: rating.color }}>{total}t CO₂e</span>
                  {' '}<span style={{ color: rating.color }}>({rating.label})</span>
                </div>
              )}
            </>
          ) : (
            <>
              <Link
                href="/calculator"
                className="px-8 py-4 rounded-xl font-semibold text-lg"
                style={{ background: 'linear-gradient(135deg, #10b981, #3b82f6)', color: '#fff' }}
              >
                Calculate My Footprint →
              </Link>
              <Link
                href="/dashboard"
                className="px-8 py-4 rounded-xl glass font-medium text-slate-300 hover:text-white"
              >
                View Demo Dashboard
              </Link>
            </>
          )}
        </div>
      </section>

      {/* Stats */}
      <section className="max-w-4xl mx-auto px-4 pb-20">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {stats.map(s => (
            <div key={s.value} className="glass rounded-2xl p-6 text-center">
              <div className="text-4xl font-bold gradient-text mb-2">{s.value}</div>
              <div className="text-sm text-slate-400">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="max-w-6xl mx-auto px-4 pb-24">
        <h2 className="text-3xl font-bold text-center mb-12">
          Everything you need to <span className="gradient-text">go carbon smart</span>
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {features.map(f => (
            <div key={f.title} className="glass rounded-2xl p-6 hover:border-emerald-500/30 transition-all"
              style={{ border: '1px solid rgba(255,255,255,0.08)' }}>
              <div className="text-3xl mb-4">{f.icon}</div>
              <h3 className="text-xl font-semibold text-white mb-2">{f.title}</h3>
              <p className="text-slate-400">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-2xl mx-auto px-4 pb-24 text-center">
        <div className="glass rounded-3xl p-10" style={{ border: '1px solid rgba(16,185,129,0.2)' }}>
          <div className="text-4xl mb-4">🌍</div>
          <h2 className="text-2xl font-bold mb-3">Your actions matter more than you think</h2>
          <p className="text-slate-400 mb-6">
            The average person can cut their footprint by 50% with targeted lifestyle changes.
            Find out where to start.
          </p>
          <Link
            href="/calculator"
            className="inline-block px-8 py-4 rounded-xl font-semibold"
            style={{ background: 'linear-gradient(135deg, #10b981, #3b82f6)', color: '#fff' }}
          >
            Start Free Assessment →
          </Link>
        </div>
      </section>
    </div>
  );
}
