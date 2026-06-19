'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

const links = [
  { href: '/', label: 'Home' },
  { href: '/calculator', label: 'Calculator' },
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/actions', label: 'Actions' },
  { href: '/coach', label: 'AI Coach' },
];

export default function Navbar() {
  const pathname = usePathname();
  return (
    <nav
      className="fixed top-0 left-0 right-0 z-50 glass"
      style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}
    >
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 font-bold text-lg">
          <span className="text-2xl">🌿</span>
          <span className="gradient-text">EcoMind AI</span>
        </Link>
        <div className="hidden md:flex items-center gap-1">
          {links.map(l => (
            <Link
              key={l.href}
              href={l.href}
              className={cn(
                'px-4 py-2 rounded-lg text-sm font-medium transition-all',
                pathname === l.href
                  ? 'bg-emerald-500/20 text-emerald-400'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
              )}
            >
              {l.label}
            </Link>
          ))}
        </div>
        <div className="md:hidden flex gap-2">
          {links.slice(1).map(l => (
            <Link
              key={l.href}
              href={l.href}
              className={cn(
                'px-2 py-1 rounded text-xs',
                pathname === l.href ? 'text-emerald-400' : 'text-slate-500'
              )}
            >
              {l.label}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
}
