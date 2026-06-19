import Groq from 'groq-sdk';
import { NextRequest, NextResponse } from 'next/server';
import type { ChatMessage, UserProfile, CarbonBreakdown } from '@/lib/types';

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export async function POST(req: NextRequest) {
  const {
    messages,
    profile,
    breakdown,
  }: { messages: ChatMessage[]; profile: UserProfile | null; breakdown: CarbonBreakdown | null } =
    await req.json();

  const contextBlock = profile && breakdown
    ? `User context: ${profile.name} in ${profile.location}. Total footprint: ${breakdown.total}t CO2e/year (transport: ${breakdown.transport}t, energy: ${breakdown.energy}t, food: ${breakdown.food}t, shopping: ${breakdown.shopping}t). Diet: ${profile.food.diet}. Car: ${profile.transport.carType}.`
    : 'User has not yet completed their footprint assessment.';

  const systemPrompt = `You are EcoMind, a knowledgeable and friendly sustainability coach.
You help people understand and reduce their carbon footprint.
${contextBlock}
Keep responses concise (2-4 paragraphs max), practical, and specific to the user's situation when possible.
If you cite a statistic, make it relevant. Use markdown for readability.
Never be preachy. Be encouraging and solution-focused.`;

  const apiMessages = messages.map(m => ({
    role: m.role as 'user' | 'assistant',
    content: m.content,
  }));

  const response = await groq.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    messages: [
      { role: 'system', content: systemPrompt },
      ...apiMessages.slice(-10),
    ],
    max_tokens: 600,
    temperature: 0.7,
  });

  const text = response.choices[0]?.message?.content ?? '';
  return NextResponse.json({ reply: text });
}
