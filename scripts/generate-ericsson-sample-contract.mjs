import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const lines = [
  "SAMPLE DOCUMENT — FOR DEMONSTRATION ONLY",
  "Not a binding agreement. Fictional template for UI testing.",
  "",
  "MASTER SERVICES AGREEMENT",
  "Network Equipment & Software Support",
  "",
  "Between: Verizon Communications Inc. (\"Verizon\")",
  "And: Telefonaktiebolaget LM Ericsson (\"Ericsson\")",
  "",
  "Agreement No.: VZ-NE-ERIC-2025-7701",
  "Effective: January 1, 2025   Expiration: December 31, 2028",
  "",
  "1. SCOPE",
  "Ericsson shall supply maintenance, software support, and field services for RAN, transport,",
  "and core network elements identified in Exhibit A (Network Elements).",
  "",
  "2. AVAILABILITY & PERFORMANCE SLA",
  "2.1 Critical RAN availability (per market month): 99.98% for Ericsson-attributed outages.",
  "2.2 P1 technical assistance center response: 15 minutes; P2: 30 minutes (24x7).",
  "2.3 Software defect critical patch delivery: within 72 hours of verified reproduction,",
  "or interim workaround acceptable to Verizon NE within 24 hours.",
  "",
  "3. SERVICE CREDITS & CHARGEBACK REMEDIES",
  "3.1 Monthly availability shortfall: service credit equal to 3% of monthly support fees per",
  "0.01% below SLA, capped at 50% of monthly fees, for vendor-root-cause incidents.",
  "3.2 Repeated outage (same NE class, same failure signature within 90 days): Verizon may",
  "invoice documented labor, reroute, and customer-impact costs at $12,500 per commenced hour,",
  "maximum $1,200,000 per rolling incident, subject to Exhibit C caps.",
  "3.3 Failure to meet patch delivery in §2.3: liquidated amount of $85,000 per business day",
  "of delay after the 72-hour window, plus expedite costs actually incurred.",
  "",
  "4. EVIDENCE & DISPUTE",
  "Invoices under §3 require: trouble ticket ID, RCA summary, timestamps, and correlation to",
  "Ericsson change records or defect IDs where applicable. Disputes per Exhibit D.",
  "",
  "Authorized for sample / demo use only.",
];

async function main() {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const fontBold = await doc.embedFont(StandardFonts.HelveticaBold);

  const margin = 56;
  const lineHeight = 12;
  const pageWidth = 612;
  const pageHeight = 792;
  let page = doc.addPage([pageWidth, pageHeight]);
  let y = pageHeight - margin;
  const maxW = pageWidth - margin * 2;

  function newPage() {
    page = doc.addPage([pageWidth, pageHeight]);
    y = pageHeight - margin;
  }

  for (const text of lines) {
    if (!text.trim()) {
      y -= lineHeight * 0.5;
      continue;
    }
    const isHeader =
      text.startsWith("SAMPLE") ||
      text.startsWith("MASTER") ||
      text.startsWith("Between:") ||
      text.startsWith("Agreement") ||
      text.startsWith("Effective") ||
      /^[0-9]+\./.test(text);

    const size = text.startsWith("MASTER") ? 14 : isHeader ? 10 : 9;
    const f = text.startsWith("MASTER") ? fontBold : isHeader ? fontBold : font;
    const wrapped = wrapText(text, f, size, maxW);

    for (const wline of wrapped) {
      if (y < margin + lineHeight * 2) newPage();
      page.drawText(wline, {
        x: margin,
        y,
        size,
        font: f,
        color: rgb(0.08, 0.08, 0.1),
        maxWidth: maxW,
      });
      y -= size + 4;
    }
  }

  const outDir = path.join(__dirname, "..", "public", "samples");
  fs.mkdirSync(outDir, { recursive: true });
  const outPath = path.join(outDir, "ericsson-sample-contract.pdf");
  const pdfBytes = await doc.save();
  fs.writeFileSync(outPath, pdfBytes);
  console.log("Wrote", outPath);
}

function wrapText(text, font, size, maxWidth) {
  const words = text.split(/\s+/);
  const lines = [];
  let current = "";
  for (const word of words) {
    const test = current ? `${current} ${word}` : word;
    const width = font.widthOfTextAtSize(test, size);
    if (width > maxWidth && current) {
      lines.push(current);
      current = word;
    } else {
      current = test;
    }
  }
  if (current) lines.push(current);
  return lines.length ? lines : [text];
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
