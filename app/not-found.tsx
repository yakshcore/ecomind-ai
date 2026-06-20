import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen hero-bg flex items-center justify-center px-4">
      <div className="glass rounded-2xl p-8 text-center max-w-md w-full"
        style={{ border: '1px solid rgba(255,255,255,0.08)' }}>
        <div className="text-5xl mb-4" aria-hidden="true">🌱</div>
        <h1 className="text-xl font-bold mb-2">Page not found</h1>
        <p className="text-slate-400 text-sm mb-6">
          The page you&apos;re looking for doesn&apos;t exist. Let&apos;s get you back on track.
        </p>
        <div className="flex gap-3 justify-center">
          <Link
            href="/calculator"
            className="px-5 py-2.5 rounded-xl text-sm font-medium text-white"
            style={{ background: 'linear-gradient(135deg, #10b981, #3b82f6)' }}
          >
            Calculate My Footprint
          </Link>
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
