import Groq from 'groq-sdk';
import { NextRequest, NextResponse } from 'next/server';
import type { UserProfile, CarbonBreakdown, Action } from '@/lib/types';

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export async function POST(req: NextRequest) {
  const { profile, breakdown }: { profile: UserProfile; breakdown: CarbonBreakdown } = await req.json();

  const prompt = `Based on this user's carbon footprint data, generate exactly 12 personalized action recommendations.

Profile: ${profile.name}, ${profile.location}
Footprint: ${breakdown.total}t total (transport: ${breakdown.transport}t, energy: ${breakdown.energy}t, food: ${breakdown.food}t, shopping: ${breakdown.shopping}t)
Car type: ${profile.transport.carType}, miles/week: ${profile.transport.carMilesPerWeek}
Diet: ${profile.food.diet}, beef/week: ${profile.food.beefServingsPerWeek}
Electricity: ${profile.energy.electricityKwhPerMonth} kWh/month, renewable: ${profile.energy.renewableEnergy}
Shopping: ${profile.shopping.shoppingFrequency}, recycling: ${profile.shopping.recyclingHabits}

Return ONLY a valid JSON array of exactly 12 actions. Each action must have:
- id: unique string
- category: one of "transport", "energy", "food", "shopping"
- title: short action title (max 8 words)
- description: specific, actionable description (1-2 sentences, reference their actual data)
- annualSavingKg: realistic estimated annual CO2e saving in kg (integer)
- difficulty: "easy", "medium", or "hard"

Prioritize actions that address the user's highest-emission categories first.
Make the descriptions specific to their profile (mention their actual car type, diet, kWh usage, etc.).
Include a mix: at least 5 easy, 4 medium, 3 hard.

Return ONLY the JSON array with no markdown fences, no explanation, no other text.`;

  const response = await groq.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    messages: [{ role: 'user', content: prompt }],
    max_tokens: 2000,
    temperature: 0.4,
  });

  const text = response.choices[0]?.message?.content ?? '[]';

  let actions: Omit<Action, 'completed' | 'committed'>[] = [];
  try {
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    actions = jsonMatch ? JSON.parse(jsonMatch[0]) : [];
  } catch {
    actions = [];
  }

  const fullActions: Action[] = actions.map(a => ({
    ...a,
    completed: false,
    committed: false,
  }));

  return NextResponse.json({ actions: fullActions });
}
