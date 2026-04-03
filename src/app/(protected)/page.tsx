import Link from "next/link";
import { ArrowRight, ChevronDown } from "lucide-react";
import { BrandLogos } from "@/components/brand/brand-logos";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

const FLOW_STEPS = [
  {
    step: "01",
    title: "Intake",
    body: "Record network failure tickets manually, by pasting raw incident text (AI extracts fields), or via CSV. Each ticket captures severity, region, and downtime.",
  },
  {
    step: "02",
    title: "RCA analysis",
    body: "Run AI root-cause analysis on demand. The model attributes accountability to equipment (manufacturer, model, failure mode) and vendors with confidence scores, streamed live in the UI.",
  },
  {
    step: "03",
    title: "Contract match",
    body: "After RCA, AI compares findings against your vendor contract library—SLA language and chargeback clauses—to flag triggered terms and estimated maximum recoverable amounts.",
  },
  {
    step: "04",
    title: "Chargeback pipeline",
    body: "Promote opportunities into a Kanban workflow: Draft through Review, Approved, Sent, Disputed, and Paid. Each chargeback stays linked to its source ticket and contract.",
  },
  {
    step: "05",
    title: "Invoice & recovery",
    body: "Generate client-side PDF invoices with Verizon letterhead, itemized charges, legal basis tied to specific clauses, and standard payment terms—ready for formal vendor proceedings.",
  },
] as const;

export default function WelcomePage() {
  return (
    <div className="mx-auto max-w-4xl space-y-10">
      <div className="space-y-6 border border-border bg-card p-8">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-4">
            <BrandLogos variant="welcome" withLinks />
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-primary">
                Verizon · Network Engineering · CTO Office
              </p>
              <h1 className="mt-2 text-3xl font-semibold tracking-tight text-foreground">
                Vendor Chargeback Console
              </h1>
              <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground">
                A single workspace to ingest failure tickets, produce defensible RCAs with vendor
                accountability, align outcomes to contract language, and manage chargebacks from
                draft through recovery—with AI running securely on the server.
              </p>
            </div>
          </div>
        </div>

        <Separator />

        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            What this application does
          </h2>
          <ul className="mt-4 grid gap-3 sm:grid-cols-2">
            <li className="border border-border bg-background px-4 py-3 text-sm leading-snug">
              Centralizes <strong className="font-medium text-foreground">failure intake</strong>{" "}
              so engineering and finance work from the same ticket record.
            </li>
            <li className="border border-border bg-background px-4 py-3 text-sm leading-snug">
              Accelerates <strong className="font-medium text-foreground">RCA documentation</strong>{" "}
              with structured equipment and vendor attribution.
            </li>
            <li className="border border-border bg-background px-4 py-3 text-sm leading-snug">
              Surfaces <strong className="font-medium text-foreground">chargeback opportunities</strong>{" "}
              by mapping RCAs to clause-level remedies in vendor agreements.
            </li>
            <li className="border border-border bg-background px-4 py-3 text-sm leading-snug">
              Supports <strong className="font-medium text-foreground">auditability</strong>{" "}
              via pipeline history, evidence summaries, and formal invoice artifacts.
            </li>
          </ul>
        </div>

        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            End-to-end flow
          </h2>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Data lives in your browser (localStorage) for this prototype—no separate database. OpenAI
            calls use your server key only; streaming updates the UI as analysis progresses.
          </p>
          <div className="mt-6 space-y-0">
            {FLOW_STEPS.map((item, i) => (
              <div key={item.step}>
                <Card className="border-border shadow-none">
                  <CardHeader className="flex flex-row items-center gap-4 space-y-0 pb-2 pt-4">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center border border-primary bg-primary text-xs font-bold text-primary-foreground">
                      {item.step}
                    </span>
                    <CardTitle className="text-base font-semibold">{item.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="pb-4 pt-0">
                    <p className="text-sm leading-relaxed text-muted-foreground">{item.body}</p>
                  </CardContent>
                </Card>
                {i < FLOW_STEPS.length - 1 && (
                  <div className="flex justify-center py-1 text-muted-foreground" aria-hidden>
                    <ChevronDown className="h-4 w-4" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 border-t border-border pt-6">
          <Button asChild className="rounded-sm">
            <Link href="/dashboard">
              Open dashboard
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
          <Button asChild variant="outline" className="rounded-sm">
            <Link href="/contracts">Add contracts</Link>
          </Button>
          <Button asChild variant="outline" className="rounded-sm">
            <Link href="/tickets">Go to tickets</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
