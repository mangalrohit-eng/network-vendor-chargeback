import { requireOpenAI } from "@/lib/openai-server";

export const runtime = "nodejs";
export const maxDuration = 120;

export async function POST(req: Request) {
  let payload: {
    ticket?: Record<string, unknown>;
    rca?: Record<string, unknown>;
    contracts?: Array<{
      id: string;
      vendorName: string;
      contractNumber: string;
      slaSummary: string;
      chargebackClauses: Array<{
        id: string;
        title: string;
        type: string;
        text: string;
      }>;
    }>;
  };
  try {
    payload = (await req.json()) as typeof payload;
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), { status: 400 });
  }

  if (!payload.ticket || !payload.rca || !payload.contracts?.length) {
    return new Response(
      JSON.stringify({ error: "ticket, rca, and contracts required" }),
      { status: 400 }
    );
  }

  try {
    const openai = requireOpenAI();
    const stream = await openai.chat.completions.create({
      model: "gpt-4o",
      stream: true,
      temperature: 0.2,
      messages: [
        {
          role: "system",
          content: `You are legal-technical counsel for Verizon vendor chargebacks. Given an RCA JSON and contract library JSON, output a single JSON array (no markdown) where each element matches:
{
  "contractId": string,
  "vendorName": string,
  "triggeredClauses": { "clauseId": string, "clauseTitle": string, "reason": string, "maxRecoverableUsd": number }[],
  "totalMaxRecoverableUsd": number,
  "summary": string
}
Estimate maxRecoverableUsd conservatively from clause language (use 0 if no good faith basis). Only include contracts/clauses with plausible linkage to the RCA.`,
        },
        {
          role: "user",
          content: JSON.stringify(
            { ticket: payload.ticket, rca: payload.rca, contracts: payload.contracts },
            null,
            2
          ).slice(0, 48000),
        },
      ],
    });

    const encoder = new TextEncoder();
    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const part of stream) {
            const t = part.choices[0]?.delta?.content;
            if (t) controller.enqueue(encoder.encode(t));
          }
        } finally {
          controller.close();
        }
      },
    });

    return new Response(readable, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-store",
      },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Match failed";
    const status = msg.includes("OPENAI_API_KEY") ? 503 : 500;
    return new Response(JSON.stringify({ error: msg }), {
      status,
      headers: { "Content-Type": "application/json" },
    });
  }
}
