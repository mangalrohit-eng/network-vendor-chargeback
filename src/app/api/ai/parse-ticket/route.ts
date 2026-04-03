import { NextResponse } from "next/server";
import { requireOpenAI } from "@/lib/openai-server";

export const runtime = "nodejs";
export const maxDuration = 60;

const SCHEMA_HINT = `Return a single JSON object with keys:
title (string), description (string), severity ("P1"|"P2"|"P3"|"P4"), region (string, US telecom region like Northeast, Mid-Atlantic, Central, West, etc.), downtimeMinutes (number, estimate if unclear), vendorHint (string|null).`;

export async function POST(req: Request) {
  try {
    const { rawText } = (await req.json()) as { rawText?: string };
    if (!rawText?.trim()) {
      return NextResponse.json({ error: "rawText required" }, { status: 400 });
    }
    const openai = requireOpenAI();
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: `You parse raw network incident text for Verizon Network Engineering. ${SCHEMA_HINT} Use conservative severity; prefer P3 if ambiguous.`,
        },
        { role: "user", content: rawText.slice(0, 32000) },
      ],
      temperature: 0.2,
    });
    const text = completion.choices[0]?.message?.content;
    if (!text) {
      return NextResponse.json({ error: "Empty model response" }, { status: 502 });
    }
    const parsed = JSON.parse(text) as Record<string, unknown>;
    return NextResponse.json(parsed);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Parse failed";
    const status = msg.includes("OPENAI_API_KEY") ? 503 : 500;
    return NextResponse.json({ error: msg }, { status });
  }
}
