/**
 * Generates public/samples/ericsson-sample-contract.pdf (text-based, extractable).
 * Run: node scripts/generate-ericsson-sample-contract.mjs
 */
import { writeFileSync, mkdirSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const outDir = join(root, "public", "samples");
const outFile = join(outDir, "ericsson-sample-contract.pdf");

const CONTENT = `
MASTER SERVICES AGREEMENT (FICTIONAL SAMPLE FOR DEMO / TESTING ONLY)

Contract reference: VZ-NE-ERI-2025-7701
Effective date: January 1, 2025
Expiration date: December 31, 2028

Between Verizon Communications Inc. ("Customer") and Telefonaktiebolaget LM Ericsson
("Supplier") for network engineering products and services in the Northeast and
affiliated regions.

1. PURPOSE
Supplier will provide radio access network software, transport products, and
professional services as described in applicable Statements of Work. This sample
document is synthetic and not a real legal agreement.

2. SERVICE LEVEL AVAILABILITY (SLA)
2.1 Core network elements covered under this MSA shall maintain a monthly
availability of 99.985% for packet core UPF and SMF functions measured at the
demarcation points listed in Exhibit A.
2.2 RAN intelligent controller (RIC) platform availability shall be 99.95% monthly
excluding scheduled maintenance windows published at least seven (7) days in advance.
2.3 If availability in any calendar month falls below the stated target, Customer may
claim service credits per Section 3.

3. SERVICE CREDITS
3.1 For each full 0.01% below the SLA in Section 2.1, Customer may apply a credit
equal to 1.25% of the monthly recurring charges for the affected SKU pool, not to
exceed 15% of such charges in any month.
3.2 For RIC failures exceeding four (4) hours of cumulative impact in a rolling
thirty-day period attributable to Supplier software defects, Customer may invoice
Supplier for documented incremental labor and third-party costs at actuals, capped at
USD 250,000 per incident.
3.3 Credits must be requested within sixty (60) days of month-end and supported by
measurement logs from Customer's OSS and trouble ticket identifiers.

4. LIQUIDATED DAMAGES (PENALTY)
4.1 If Supplier fails to meet critical incident response times (Severity 1: 30
minutes to join bridge; Severity 2: 60 minutes) on more than two occasions in a
quarter, and root cause is attributed to Supplier per the joint RCA, Customer may
assess liquidated damages of USD 25,000 per qualifying miss, up to USD 200,000 per
quarter, as a reasonable estimate of harm and not as a penalty where prohibited.

5. HARDWARE REMEDIES
5.1 Field replaceable units with demonstrated failure rates above 0.12% per quarter
versus installed base may trigger a corrective action plan. If not remedied within
ninety (90) days, Customer may seek price adjustments or replacement units at
Supplier expense for affected batches identified by serial number ranges.

6. SOFTWARE DEFECTS
6.1 Repeat occurrences of the same defect class within one hundred eighty (180) days
on production releases designated as generally available shall entitle Customer to
expedited patch delivery within fourteen (14) days or a mitigation plan acceptable
to Customer's CTO office.
6.2 If no acceptable mitigation is provided, Customer may withhold up to 10% of
monthly software license fees for affected products until resolution.

7. LIABILITY
7.1 Except for fraud, death, or personal injury caused by negligence, each party's
aggregate liability under this agreement shall not exceed the fees paid by Customer
to Supplier in the twelve (12) months preceding the claim; however, the cap shall not
apply to indemnity obligations for third-party IP infringement or breach of data
protection commitments.

8. GENERAL
8.1 Governing law: State of New York. Disputes subject to confidential arbitration.
8.2 Entire agreement; amendments in writing. Electronic signatures permitted.

Exhibit A (summary): Measurement points include SNMP reachability, synthetic probes
from regional test agents, and OSS incident correlation IDs tied to Supplier CPE and
software releases.

END OF SAMPLE DOCUMENT
`.trim();

function wrapLine(line, maxChars) {
  const words = line.split(/\s+/);
  const rows = [];
  let cur = "";
  for (const w of words) {
    const next = cur ? `${cur} ${w}` : w;
    if (next.length <= maxChars) cur = next;
    else {
      if (cur) rows.push(cur);
      cur = w.length > maxChars ? w.slice(0, maxChars) : w;
    }
  }
  if (cur) rows.push(cur);
  return rows;
}

function allLines(text, maxChars) {
  const out = [];
  for (const para of text.split(/\n\n/)) {
    for (const raw of para.split("\n")) {
      const t = raw.trim();
      if (!t) continue;
      out.push(...wrapLine(t, maxChars));
    }
    out.push("");
  }
  return out;
}

async function main() {
  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const lines = allLines(CONTENT, 82);
  const fontSize = 9;
  const lineHeight = fontSize * 1.25;
  const margin = 50;
  const pageWidth = 612;
  const pageHeight = 792;
  const bottom = margin;
  let page = pdfDoc.addPage([pageWidth, pageHeight]);
  let y = pageHeight - margin;

  for (const line of lines) {
    if (y < bottom + lineHeight) {
      page = pdfDoc.addPage([pageWidth, pageHeight]);
      y = pageHeight - margin;
    }
    const isHeading =
      line.startsWith("MASTER SERVICES") ||
      (line.length > 0 && line.length < 60 && /^[0-9]+\./.test(line));
    page.drawText(line || " ", {
      x: margin,
      y,
      size: fontSize,
      font: isHeading ? fontBold : font,
      color: rgb(0, 0, 0),
      maxWidth: pageWidth - 2 * margin,
    });
    y -= lineHeight;
  }

  mkdirSync(outDir, { recursive: true });
  const bytes = await pdfDoc.save();
  writeFileSync(outFile, bytes);
  console.log("Wrote", outFile, `(${bytes.length} bytes)`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
