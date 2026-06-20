'use client';
import { useEffect } from 'react';
import Link from 'next/link';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Application error:', error.digest ?? error.message);
  }, [error]);

  return (
    <div className="min-h-screen hero-bg flex items-center justify-center px-4">
      <div className="glass rounded-2xl p-8 text-center max-w-md w-full"
        style={{ border: '1px solid rgba(239,68,68,0.2)' }}
        role="alert"
        aria-live="assertive">
        <div className="text-5xl mb-4" aria-hidden="true">⚠️</div>
        <h1 className="text-xl font-bold mb-2">Something went wrong</h1>
        <p className="text-slate-400 text-sm mb-6">
          An unexpected error occurred. Your data is safe — it&apos;s stored locally on your device.
        </p>
        <div className="flex gap-3 justify-center">
          <button
            onClick={reset}
            className="px-5 py-2.5 rounded-xl text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            style={{ background: 'linear-gradient(135deg, #10b981, #3b82f6)' }}
          >
            Try again
          </button>
          <Link
            href="/"
            className="px-5 py-2.5 rounded-xl text-sm font-medium text-slate-300 hover:text-white"
            style={{ border: '1px solid rgba(255,255,255,0.12)' }}
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}
