import { NextResponse } from "next/server";
import { getOpenAI } from "@/lib/openai-server";

export async function GET() {
  const configured = Boolean(getOpenAI());
  return NextResponse.json({
    ok: true,
    openaiConfigured: configured,
  });
}
