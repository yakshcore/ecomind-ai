import Anthropic from '@anthropic-ai/sdk';
import { NextRequest, NextResponse } from 'next/server';
import type { ChatMessage, UserProfile, CarbonBreakdown } from '@/lib/types';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

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

  const response = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 600,
    system: systemPrompt,
    messages: apiMessages,
  });

  const text = response.content[0].type === 'text' ? response.content[0].text : '';
  return NextResponse.json({ reply: text });
}
