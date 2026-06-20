import Groq from "groq-sdk";
import { NextRequest, NextResponse } from "next/server";
import type { ChatMessage, UserProfile, CarbonBreakdown } from "@/lib/types";

function getGroq() { return new Groq({ apiKey: process.env.GROQ_API_KEY }); }

const ALLOWED_ROLES = new Set(["user", "assistant"]);

function sanitizeMessages(messages: unknown[]): Array<{ role: "user" | "assistant"; content: string }> {
  return messages
    .filter(
      (m): m is { role: string; content: string } =>
        !!m &&
        typeof m === "object" &&
        typeof (m as Record<string, unknown>).role === "string" &&
        typeof (m as Record<string, unknown>).content === "string" &&
        ALLOWED_ROLES.has((m as Record<string, unknown>).role as string)
    )
    .slice(-20)
    .map((m) => ({
      role: m.role as "user" | "assistant",
      content: String(m.content).slice(0, 2000),
    }));
}

export async function POST(req: NextRequest) {
  try {
    if (!process.env.GROQ_API_KEY) {
      return NextResponse.json({ error: "AI service not configured" }, { status: 503 });
    }

    const body = await req.json().catch(() => null);
    if (!body || !Array.isArray(body.messages)) {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }

    const messages: ChatMessage[] = body.messages;
    const profile: UserProfile | null = body.profile ?? null;
    const breakdown: CarbonBreakdown | null = body.breakdown ?? null;

    const sanitized = sanitizeMessages(messages);
    if (sanitized.length === 0) {
      return NextResponse.json({ error: "No valid messages" }, { status: 400 });
    }

    const contextBlock =
      profile && breakdown
        ? `User context: ${String(profile.name).slice(0, 50)} in ${String(profile.location).slice(0, 100)}. Total footprint: ${breakdown.total}t CO2e/year (transport: ${breakdown.transport}t, energy: ${breakdown.energy}t, food: ${breakdown.food}t, shopping: ${breakdown.shopping}t). Diet: ${profile.food.diet}. Car: ${profile.transport.carType}.`
        : "User has not yet completed their footprint assessment.";

    const systemPrompt = `You are EcoMind, a knowledgeable and friendly sustainability coach.
You help people understand and reduce their carbon footprint.
${contextBlock}
Keep responses concise (2-4 paragraphs max), practical, and specific to the user's situation when possible.
If you cite a statistic, make it relevant. Use markdown for readability.
Never be preachy. Be encouraging and solution-focused.`;

    const response = await getGroq().chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [{ role: "system", content: systemPrompt }, ...sanitized],
      max_tokens: 600,
      temperature: 0.7,
    });

    const text = response.choices[0]?.message?.content ?? "";
    return NextResponse.json({ reply: text });
  } catch (err) {
    console.error("Chat error:", err);
    return NextResponse.json({ error: "Failed to get response" }, { status: 500 });
  }
}
