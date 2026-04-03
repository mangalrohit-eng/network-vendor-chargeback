import { requireOpenAI } from "@/lib/openai-server";

export const runtime = "nodejs";
export const maxDuration = 120;

export async function POST(req: Request) {
  let ticket: {
    title?: string;
    description?: string;
    region?: string;
    severity?: string;
    downtimeMinutes?: number;
    vendorHint?: string;
    rawIncidentText?: string;
  };
  try {
    ticket = (await req.json()) as typeof ticket;
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), { status: 400 });
  }

  try {
    const openai = requireOpenAI();
    const body = JSON.stringify(ticket, null, 2);
    const stream = await openai.chat.completions.create({
      model: "gpt-4o",
      stream: true,
      temperature: 0.25,
      messages: [
        {
          role: "system",
          content: `You are a Verizon Network Engineering principal architect. Produce a rigorous root-cause analysis as JSON only (no markdown fences).
The JSON must match this TypeScript shape:
{
  "rootCause": string,
  "contributingFactors": string[],
  "equipment": { "manufacturer": string, "model": string, "assetTag"?: string, "failureMode": string, "confidence": number }[],
  "vendors": { "vendorName": string, "role": string, "confidence": number, "rationale": string }[],
  "narrative": string
}
confidence is 0-1. Attribute accountability to specific OEMs where evidence supports it. If unknown, use lower confidence and state assumptions in narrative.`,
        },
        {
          role: "user",
          content: `Analyze this incident and output ONLY the JSON object:\n${body}`,
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
        } catch (err) {
          controller.enqueue(
            encoder.encode(
              `\n{"error":${JSON.stringify(err instanceof Error ? err.message : "stream error")}}`
            )
          );
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
    const msg = e instanceof Error ? e.message : "RCA failed";
    const status = msg.includes("OPENAI_API_KEY") ? 503 : 500;
    return new Response(JSON.stringify({ error: msg }), {
      status,
      headers: { "Content-Type": "application/json" },
    });
  }
}
