'use client';
import { useEffect, useRef, useState } from 'react';
import { loadState, loadChat, saveChat } from '@/lib/store';
import type { ChatMessage, UserProfile, CarbonBreakdown } from '@/lib/types';
import ReactMarkdown from 'react-markdown';

const SUGGESTIONS = [
  'What are my biggest opportunities to reduce my footprint?',
  'How does my diet compare to a vegan lifestyle for CO₂?',
  'Is an electric car worth it for my driving patterns?',
  'What easy changes can I make this week?',
  'How much would solar panels help me?',
  'Explain carbon offsets — are they worth buying?',
];

export default function CoachPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [breakdown, setBreakdown] = useState<CarbonBreakdown | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const state = loadState();
    setProfile(state.profile);
    setBreakdown(state.breakdown);
    const history = loadChat();
    if (history.length > 0) {
      setMessages(history);
    } else {
      const welcome: ChatMessage = {
        role: 'assistant',
        content: state.profile
          ? `Hi ${state.profile.name}! I'm EcoMind, your AI sustainability coach. I've reviewed your carbon footprint of **${state.breakdown?.total}t CO₂e/year** and I'm here to help you reduce it. What would you like to explore?`
          : `Hi! I'm EcoMind, your AI sustainability coach. I can help you understand carbon footprints, suggest reduction strategies, and answer climate questions. [Complete your assessment](/calculator) to get personalized advice, or ask me anything!`,
        timestamp: new Date().toISOString(),
      };
      setMessages([welcome]);
    }
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function sendMessage(text: string) {
    if (!text.trim() || loading) return;

    const userMsg: ChatMessage = { role: 'user', content: text, timestamp: new Date().toISOString() };
    const updated = [...messages, userMsg];
    setMessages(updated);
    setInput('');
    setLoading(true);

    try {
      const apiMessages = updated.filter(m => m.role !== 'assistant' || updated.indexOf(m) > 0);
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: apiMessages.slice(-10),
          profile,
          breakdown,
        }),
      });
      const data = await res.json();
      const reply: ChatMessage = {
        role: 'assistant',
        content: data.reply,
        timestamp: new Date().toISOString(),
      };
      const withReply = [...updated, reply];
      setMessages(withReply);
      saveChat(withReply);
    } catch {
      const err: ChatMessage = {
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please check your API key configuration.',
        timestamp: new Date().toISOString(),
      };
      setMessages(prev => [...prev, err]);
    } finally {
      setLoading(false);
    }
  }

  function clearChat() {
    const welcome: ChatMessage = {
      role: 'assistant',
      content: profile
        ? `Hi ${profile.name}! Fresh start. What would you like to know about reducing your ${breakdown?.total}t footprint?`
        : `Hi! I'm EcoMind. Ask me anything about carbon footprints and sustainability.`,
      timestamp: new Date().toISOString(),
    };
    setMessages([welcome]);
    saveChat([welcome]);
  }

  return (
    <div className="min-h-screen hero-bg flex flex-col" style={{ maxHeight: 'calc(100vh - 64px)' }}>
      <div className="max-w-3xl mx-auto w-full flex flex-col h-full px-4 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full flex items-center justify-center text-xl"
              style={{ background: 'linear-gradient(135deg, #10b981, #3b82f6)' }}>
              🌿
            </div>
            <div>
              <h1 className="font-bold text-lg">EcoMind AI Coach</h1>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse inline-block" />
                <span className="text-xs text-emerald-400">Online</span>
                {profile && <span className="text-xs text-slate-500">• Knows your {breakdown?.total}t profile</span>}
              </div>
            </div>
          </div>
          <button onClick={clearChat} className="text-xs text-slate-500 hover:text-slate-300 px-3 py-1.5 rounded-lg glass">
            Clear chat
          </button>
        </div>

        {/* Suggestions (only when few messages) */}
        {messages.length <= 1 && (
          <div className="mb-4 shrink-0">
            <p className="text-xs text-slate-500 mb-2">Suggested questions:</p>
            <div className="flex flex-wrap gap-2">
              {SUGGESTIONS.map(s => (
                <button
                  key={s}
                  onClick={() => sendMessage(s)}
                  className="px-3 py-2 rounded-xl text-xs text-slate-300 hover:text-white transition-all glass hover:border-emerald-500/30"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Messages */}
        <div className="flex-1 overflow-y-auto space-y-4 mb-4 pr-1" role="log" aria-label="Chat messages" aria-live="polite" aria-relevant="additions">
          {messages.map((msg, i) => (
            <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm shrink-0 ${
                msg.role === 'assistant'
                  ? ''
                  : 'bg-blue-600'
              }`} style={msg.role === 'assistant' ? { background: 'linear-gradient(135deg, #10b981, #3b82f6)' } : {}}>
                {msg.role === 'assistant' ? '🌿' : '👤'}
              </div>
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm ${
                  msg.role === 'user'
                    ? 'bg-blue-600 text-white rounded-tr-sm'
                    : 'glass rounded-tl-sm'
                }`}
              >
                {msg.role === 'assistant' ? (
                  <div className="prose-dark text-sm">
                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                  </div>
                ) : (
                  <p>{msg.content}</p>
                )}
                <p className="text-xs mt-1 opacity-40">
                  {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex gap-3" role="status" aria-label="EcoMind is thinking">
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm"
                style={{ background: 'linear-gradient(135deg, #10b981, #3b82f6)' }} aria-hidden="true">🌿</div>
              <div className="glass rounded-2xl rounded-tl-sm px-4 py-3">
                <div className="flex gap-1.5 items-center h-5" aria-hidden="true">
                  {[0, 1, 2].map(i => (
                    <span key={i} className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce inline-block"
                      style={{ animationDelay: `${i * 0.15}s` }} />
                  ))}
                </div>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="shrink-0">
          <form onSubmit={e => { e.preventDefault(); sendMessage(input); }}
            className="flex gap-3" aria-label="Send a message to EcoMind AI">
            <label htmlFor="chat-input" className="sr-only">Ask EcoMind anything about your carbon footprint</label>
            <input
              id="chat-input"
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Ask EcoMind anything about your carbon footprint..."
              className="flex-1 px-4 py-3 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)' }}
              disabled={loading}
              aria-disabled={loading}
              autoComplete="off"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              aria-label="Send message"
              aria-busy={loading}
              className="px-5 py-3 rounded-xl font-medium text-sm text-white disabled:opacity-40 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              style={{ background: 'linear-gradient(135deg, #10b981, #3b82f6)' }}
            >
              Send →
            </button>
          </form>
          <p className="text-xs text-slate-600 text-center mt-2">
            Powered by Groq AI (llama-3.3-70b-versatile) &mdash; responses may not be 100% accurate
          </p>
        </div>
      </div>
    </div>
  );
}
