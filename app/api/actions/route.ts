import Groq from "groq-sdk";
import { NextRequest, NextResponse } from "next/server";
import type { UserProfile, CarbonBreakdown, Action } from "@/lib/types";

function getGroq() { return new Groq({ apiKey: process.env.GROQ_API_KEY }); }

function isValidBreakdown(b: unknown): b is CarbonBreakdown {
  if (!b || typeof b !== "object") return false;
  const bd = b as Record<string, unknown>;
  return (
    typeof bd.total === "number" &&
    typeof bd.transport === "number" &&
    typeof bd.energy === "number" &&
    typeof bd.food === "number" &&
    typeof bd.shopping === "number" &&
    bd.total > 0 &&
    bd.total < 1000
  );
}

export async function POST(req: NextRequest) {
  try {
    if (!process.env.GROQ_API_KEY) {
      return NextResponse.json({ error: "AI service not configured" }, { status: 503 });
    }

    const body = await req.json().catch(() => null);
    if (!body) {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }

    const { profile, breakdown } = body;
    if (!profile || typeof profile !== "object" || !isValidBreakdown(breakdown)) {
      return NextResponse.json({ error: "Invalid profile or breakdown data" }, { status: 400 });
    }

    const p = profile as UserProfile;

    const prompt = `Based on this user's carbon footprint data, generate exactly 12 personalized action recommendations.

Profile: ${String(p.name).slice(0, 50)}, ${String(p.location).slice(0, 100)}
Footprint: ${breakdown.total}t total (transport: ${breakdown.transport}t, energy: ${breakdown.energy}t, food: ${breakdown.food}t, shopping: ${breakdown.shopping}t)
Car type: ${p.transport.carType}, miles/week: ${p.transport.carMilesPerWeek}
Diet: ${p.food.diet}, beef/week: ${p.food.beefServingsPerWeek}
Electricity: ${p.energy.electricityKwhPerMonth} kWh/month, renewable: ${p.energy.renewableEnergy}
Shopping: ${p.shopping.shoppingFrequency}, recycling: ${p.shopping.recyclingHabits}

Return ONLY a valid JSON array of exactly 12 actions. Each action must have:
- id: unique string
- category: one of "transport", "energy", "food", "shopping"
- title: short action title (max 8 words)
- description: specific, actionable description (1-2 sentences, reference their actual data)
- annualSavingKg: realistic estimated annual CO2e saving in kg (integer)
- difficulty: "easy", "medium", or "hard"

Prioritize actions that address the user's highest-emission categories first.
Make the descriptions specific to their profile.
Include a mix: at least 5 easy, 4 medium, 3 hard.

Return ONLY the JSON array with no markdown fences, no explanation, no other text.`;

    const response = await getGroq().chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 2000,
      temperature: 0.4,
    });

    const text = response.choices[0]?.message?.content ?? "[]";

    let actions: Omit<Action, "completed" | "committed">[] = [];
    try {
      const jsonMatch = text.match(/\[[\s\S]*\]/);
      actions = jsonMatch ? JSON.parse(jsonMatch[0]) : [];
    } catch {
      actions = [];
    }

    const fullActions: Action[] = actions
      .filter(
        (a) =>
          a &&
          typeof a.id === "string" &&
          typeof a.title === "string" &&
          typeof a.annualSavingKg === "number" &&
          ["transport", "energy", "food", "shopping"].includes(a.category) &&
          ["easy", "medium", "hard"].includes(a.difficulty)
      )
      .map((a) => ({ ...a, completed: false, committed: false }));

    return NextResponse.json({ actions: fullActions });
  } catch (err) {
    console.error("Actions error:", err);
    return NextResponse.json({ error: "Failed to generate actions" }, { status: 500 });
  }
}
