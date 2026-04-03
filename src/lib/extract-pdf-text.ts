import { join } from "path";
import { pathToFileURL } from "url";
import pdfParse from "pdf-parse";

/**
 * Try pdf-parse first (fast). If it throws or yields almost no text, use Mozilla pdf.js
 * (newer spec / compression support — fixes many "Invalid PDF structure" vendor PDFs).
 */
export async function extractPdfText(buf: Buffer): Promise<string> {
  let fromLegacy = "";
  try {
    const data = await pdfParse(buf);
    fromLegacy = (data.text ?? "").trim();
  } catch {
    fromLegacy = "";
  }
  if (fromLegacy.length >= 40) {
    return fromLegacy;
  }

  let fromModern = "";
  try {
    fromModern = (await extractWithPdfJs(buf)).trim();
  } catch {
    fromModern = "";
  }
  if (fromModern.length >= 40) {
    return fromModern;
  }
  if (fromLegacy.length > 0) {
    return fromLegacy;
  }
  return fromModern;
}

async function extractWithPdfJs(buf: Buffer): Promise<string> {
  const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
  const { getDocument } = pdfjs;

  const data = Uint8Array.from(buf);
  const cMapUrl = pathToFileURL(join(process.cwd(), "node_modules/pdfjs-dist/cmaps")).href + "/";

  const loadingTask = getDocument({
    data,
    verbosity: 0,
    useSystemFonts: true,
    cMapUrl,
    cMapPacked: true,
    disableFontFace: true,
    isEvalSupported: false,
  });

  const pdf = await loadingTask.promise;
  const parts: string[] = [];

  try {
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      for (const item of content.items) {
        if (item && typeof item === "object" && "str" in item && typeof item.str === "string") {
          parts.push(item.str);
        }
      }
      parts.push("\n");
    }
  } finally {
    await pdf.destroy().catch(() => undefined);
  }

  return parts.join(" ").replace(/\s+/g, " ").trim();
}
