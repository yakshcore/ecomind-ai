import Anthropic from '@anthropic-ai/sdk';
import { NextRequest, NextResponse } from 'next/server';
import type { UserProfile, CarbonBreakdown } from '@/lib/types';
import { GLOBAL_AVERAGES, getEquivalences } from '@/lib/carbon-calculator';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(req: NextRequest) {
  const { profile, breakdown }: { profile: UserProfile; breakdown: CarbonBreakdown } = await req.json();

  const eq = getEquivalences(breakdown.total);
  const percentVsUSA = (((breakdown.total - GLOBAL_AVERAGES.usa) / GLOBAL_AVERAGES.usa) * 100).toFixed(1);
  const percentVsWorld = (((breakdown.total - GLOBAL_AVERAGES.world) / GLOBAL_AVERAGES.world) * 100).toFixed(1);

  const systemPrompt = `You are EcoMind, an expert carbon footprint analyst and sustainability coach.
You combine deep knowledge of climate science, behavioral psychology, and sustainable living.
Your analysis is data-driven, specific, actionable, and encouraging — never preachy or guilt-inducing.
You speak directly to the individual, referencing their specific data points.
Always format your response in clean markdown with clear sections.`;

  const userPrompt = `Analyze this person's carbon footprint and provide a deeply personalized report.

**User Profile:**
- Name: ${profile.name}
- Location: ${profile.location}

**Annual Carbon Footprint Breakdown:**
- Total: ${breakdown.total} tonnes CO2e
- Transport: ${breakdown.transport} tonnes (${((breakdown.transport / breakdown.total) * 100).toFixed(1)}%)
- Home Energy: ${breakdown.energy} tonnes (${((breakdown.energy / breakdown.total) * 100).toFixed(1)}%)
- Food & Diet: ${breakdown.food} tonnes (${((breakdown.food / breakdown.total) * 100).toFixed(1)}%)
- Shopping: ${breakdown.shopping} tonnes (${((breakdown.shopping / breakdown.total) * 100).toFixed(1)}%)

**Context:**
- vs US average (${GLOBAL_AVERAGES.usa}t): ${percentVsUSA}%
- vs world average (${GLOBAL_AVERAGES.world}t): ${percentVsWorld}%
- Equivalent to ${eq.treesNeeded} trees needed to offset annually
- Equivalent to driving ${eq.milesDriven.toLocaleString()} miles in a gas car

**Lifestyle Details:**
- Transport: ${profile.transport.carType} car, ${profile.transport.carMilesPerWeek} miles/week, ${profile.transport.flightsPerYear} flights/year
- Diet: ${profile.food.diet} (${profile.food.beefServingsPerWeek} beef servings/week)
- Energy: ${profile.energy.electricityKwhPerMonth} kWh/month electricity, renewable: ${profile.energy.renewableEnergy}
- Shopping: ${profile.shopping.shoppingFrequency} frequency, recycling: ${profile.shopping.recyclingHabits}

Provide a comprehensive analysis with:
1. **Your Carbon Story** — a 2-3 sentence personalized narrative about ${profile.name}'s unique footprint pattern
2. **Key Wins** — 2-3 things they're already doing right (be specific to their data)
3. **Biggest Opportunities** — their top 3 reduction opportunities with estimated annual savings in tonnes
4. **Quick Wins This Week** — 3 actions they can start immediately (low-effort, moderate impact)
5. **High-Impact Changes** — 2 lifestyle changes with the biggest long-term impact for their profile
6. **Your 2030 Path** — if they implement your top recommendations, what could their footprint look like by 2030?

Keep the tone warm, specific, and energizing. Use the person's name naturally. Reference their actual numbers.`;

  const message = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1500,
    messages: [{ role: 'user', content: userPrompt }],
    system: systemPrompt,
  });

  const text = message.content[0].type === 'text' ? message.content[0].text : '';
  return NextResponse.json({ analysis: text });
}
