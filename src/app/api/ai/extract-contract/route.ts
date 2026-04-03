import { extractPdfText } from "@/lib/extract-pdf-text";
import { requireOpenAI } from "@/lib/openai-server";
import type { ContractClause } from "@/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 120;

const MAX_BYTES = 12 * 1024 * 1024;
const MAX_TEXT_CHARS = 90_000;

const CLAUSE_TYPES = ["SLA", "CREDIT", "PENALTY", "OTHER"] as const;

function normalizeClauseType(t: string): ContractClause["type"] {
  const u = String(t || "").toUpperCase();
  return (CLAUSE_TYPES as readonly string[]).includes(u)
    ? (u as ContractClause["type"])
    : "OTHER";
}

function jsonError(message: string, status: number, detail?: string) {
  return Response.json(
    {
      error: message,
      ...(process.env.NODE_ENV === "development" && detail ? { detail } : {}),
    },
    { status, headers: { "Content-Type": "application/json; charset=utf-8" } }
  );
}

export async function POST(req: Request) {
  try {
    const ct = req.headers.get("content-type") || "";
    if (!ct.includes("multipart/form-data")) {
      return jsonError(
        'Send multipart/form-data with a PDF in the "file" field.',
        400
      );
    }

    let form: FormData;
    try {
      form = await req.formData();
    } catch (e) {
      const detail = e instanceof Error ? e.message : String(e);
      return jsonError("Could not read upload (body may be too large or corrupted).", 400, detail);
    }

    const file = form.get("file");
    if (!(file instanceof Blob)) {
      return jsonError('Missing "file" field.', 400);
    }

    if (file.size > MAX_BYTES) {
      return jsonError("PDF is too large (maximum 12 MB).", 400);
    }

    const name = file instanceof File ? file.name : "upload.pdf";
    const mime = file.type || "";
    if (mime && mime !== "application/pdf" && !name.toLowerCase().endsWith(".pdf")) {
      return jsonError("Only PDF files are supported.", 400);
    }

    let text = "";
    try {
      const buf = Buffer.from(await file.arrayBuffer());
      text = await extractPdfText(buf);
    } catch (parseErr) {
      const detail = parseErr instanceof Error ? parseErr.message : String(parseErr);
      return jsonError(
        "Could not read this PDF. It may be encrypted, corrupted, or use features the parser does not support. Try exporting a text-based PDF or another copy.",
        422,
        detail
      );
    }

    if (text.length < 40) {
      return jsonError(
        "Almost no text was extracted. The PDF may be image-only (scanned); use a text-based PDF or OCR first.",
        422
      );
    }

    const excerpt =
      text.length > MAX_TEXT_CHARS
        ? `${text.slice(0, MAX_TEXT_CHARS)}\n\n[Document truncated for analysis…]`
        : text;

    try {
      const openai = requireOpenAI();
      const completion = await openai.chat.completions.create({
        model: "gpt-4o",
        temperature: 0.1,
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content: `You extract structured vendor agreement data for a telecom network chargeback console. Respond with one JSON object only, keys:
- vendorName: string (primary vendor/supplier; best effort)
- contractNumber: string (agreement/MSA/SOW ID, or "Unknown")
- effectiveFrom: string YYYY-MM-DD or ""
- effectiveTo: string YYYY-MM-DD or ""
- slaSummary: string (concise paragraph: uptime targets, service credits, response/restoration if stated)
- chargebackClauses: array of { "title": string, "type": "SLA"|"CREDIT"|"PENALTY"|"OTHER", "text": string } — include clauses relevant to service level remedies, credits, penalties, liquidated damages, indemnity, or liability caps that could support a vendor chargeback. Use section headings in title. Prefer 4–12 items on long agreements; omit boilerplate-only pages.
- notes: string optional (extraction caveats)

If a date is ambiguous, leave "". Normalize type to exactly SLA, CREDIT, PENALTY, or OTHER.`,
          },
          { role: "user", content: excerpt },
        ],
      });

      const raw = completion.choices[0]?.message?.content;
      if (!raw) {
        return jsonError("Model returned no content", 500);
      }

      let parsed: Record<string, unknown>;
      try {
        parsed = JSON.parse(raw) as Record<string, unknown>;
      } catch {
        return jsonError("Model returned invalid JSON. Try again.", 500);
      }

      const clausesRaw = Array.isArray(parsed.chargebackClauses) ? parsed.chargebackClauses : [];

      const chargebackClauses = clausesRaw
        .map((row) => {
          if (!row || typeof row !== "object") return null;
          const r = row as Record<string, unknown>;
          const title = String(r.title ?? "").trim();
          const clauseText = String(r.text ?? "").trim();
          if (!title && !clauseText) return null;
          return {
            title: title || "Clause",
            type: normalizeClauseType(String(r.type)),
            text: clauseText || title,
          };
        })
        .filter(Boolean) as Omit<ContractClause, "id">[];

      const today = new Date().toISOString().slice(0, 10);
      const body = {
        vendorName: String(parsed.vendorName ?? "").trim() || "Unknown vendor",
        contractNumber: String(parsed.contractNumber ?? "").trim() || "Unknown",
        effectiveFrom: String(parsed.effectiveFrom ?? "").trim() || today,
        effectiveTo: String(parsed.effectiveTo ?? "").trim() || today,
        slaSummary: String(parsed.slaSummary ?? "").trim() || "—",
        chargebackClauses:
          chargebackClauses.length > 0
            ? chargebackClauses
            : [
                {
                  title: "General remedies",
                  type: "OTHER" as const,
                  text: "No specific clauses identified; review document manually.",
                },
              ],
        notes: parsed.notes != null ? String(parsed.notes) : undefined,
      };

      return Response.json(body, {
        headers: {
          "Cache-Control": "no-store",
          "Content-Type": "application/json; charset=utf-8",
        },
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Extraction failed";
      const status = msg.includes("OPENAI_API_KEY") ? 503 : 500;
      return jsonError(msg, status);
    }
  } catch (unexpected) {
    const detail = unexpected instanceof Error ? unexpected.message : String(unexpected);
    console.error("[extract-contract]", unexpected);
    return jsonError(
      "Unexpected server error while processing the upload.",
      500,
      detail
    );
  }
}
