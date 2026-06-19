import type { Metadata } from 'next';
import './globals.css';
import Navbar from '@/components/Navbar';

export const metadata: Metadata = {
  title: 'EcoMind AI — Carbon Footprint Intelligence',
  description: 'Understand, track, and reduce your carbon footprint with AI-powered personalized insights.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased" style={{ background: '#0a0f1e', color: '#e2e8f0' }}>
        <Navbar />
        <main className="pt-16">{children}</main>
      </body>
    </html>
  );
}
