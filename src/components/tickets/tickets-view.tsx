"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import Papa from "papaparse";
import {
  Plus,
  Upload,
  ClipboardPaste,
  Sparkles,
  Trash2,
  Download,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAppStore, buildChargebackFromTicket } from "@/stores/app-store";
import { formatDate } from "@/lib/format";
import type { TicketSeverity, TicketStatus } from "@/types";
import { RcaAnalyzeDialog } from "@/components/tickets/rca-analyze-dialog";

const severities: TicketSeverity[] = ["P1", "P2", "P3", "P4"];

export function TicketsView() {
  const tickets = useAppStore((s) => s.tickets);
  const addTicket = useAppStore((s) => s.addTicket);
  const deleteTicket = useAppStore((s) => s.deleteTicket);
  const addChargeback = useAppStore((s) => s.addChargeback);
  const contracts = useAppStore((s) => s.contracts);

  const [analyzeTicketId, setAnalyzeTicketId] = useState<string | null>(null);
  const analyzeTicket = useMemo(
    () => tickets.find((t) => t.id === analyzeTicketId) ?? null,
    [tickets, analyzeTicketId]
  );

  const [csvError, setCsvError] = useState<string | null>(null);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="max-w-2xl space-y-2">
          <h1 className="text-2xl font-semibold tracking-tight">Tickets</h1>
          <p className="text-sm text-muted-foreground">
            Intake network failures, run AI root-cause analysis, then create chargeback drafts when
            the app finds matching contract clauses.
          </p>
          <ol className="list-decimal space-y-0.5 pl-4 text-xs text-muted-foreground">
            <li>
              Add a row (manual, paste incident text, or{" "}
              <span className="text-foreground">CSV upload</span>).
            </li>
            <li>
              Click <span className="font-medium text-foreground">Analyze</span> — RCA runs first,
              then contract matching uses your{" "}
              <Link href="/contracts" className="underline underline-offset-2 text-foreground">
                Contracts
              </Link>{" "}
              library.
            </li>
            <li>
              When matches appear, use{" "}
              <span className="font-medium text-foreground">New chargeback</span> to push a draft
              into the pipeline.
            </li>
          </ol>
          <p className="text-[11px] leading-snug text-muted-foreground">
            CSV columns (header row):{" "}
            <code className="rounded-sm bg-muted px-1 font-mono text-[10px]">
              title, description, severity, region, downtimeMinutes, vendorHint
            </code>
            . Sample file: 50 rows covering Nokia, Ciena, Cisco, and Ericsson (
            <a
              href="/samples/sample-tickets.csv"
              download="sample-tickets.csv"
              className="font-medium text-foreground underline underline-offset-2"
            >
              download sample-tickets.csv
            </a>
            ).
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <ManualTicketDialog onSave={addTicket} />
          <PasteTicketDialog onSave={addTicket} />
          <label className="inline-flex cursor-pointer">
            <input
              type="file"
              accept=".csv,text/csv"
              className="sr-only"
              onChange={(e) => {
                const f = e.target.files?.[0];
                e.target.value = "";
                if (!f) return;
                setCsvError(null);
                Papa.parse(f, {
                  header: true,
                  skipEmptyLines: true,
                  complete: (res) => {
                    const rows = res.data as Record<string, string>[];
                    let n = 0;
                    for (const row of rows) {
                      const title = row.title?.trim();
                      if (!title) continue;
                      addTicket({
                        title,
                        description: row.description?.trim() || "",
                        severity: (row.severity as TicketSeverity) || "P3",
                        status: "open",
                        region: row.region?.trim() || "Unknown",
                        downtimeMinutes: Number(row.downtimeMinutes) || 0,
                        vendorHint: row.vendorHint?.trim(),
                      });
                      n++;
                    }
                    if (n === 0) setCsvError("No valid rows (need title column).");
                  },
                  error: (err) => setCsvError(err.message),
                });
              }}
            />
            <Button variant="outline" size="sm" asChild>
              <span>
                <Upload className="h-4 w-4" />
                CSV upload
              </span>
            </Button>
          </label>
          <Button variant="outline" size="sm" asChild>
            <a href="/samples/sample-tickets.csv" download="sample-tickets.csv">
              <Download className="h-4 w-4" />
              Sample CSV
            </a>
          </Button>
        </div>
      </div>

      {csvError && (
        <p className="border border-destructive/50 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          {csvError}
        </p>
      )}

      <div className="border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-[200px]">Title</TableHead>
              <TableHead>Severity</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Region</TableHead>
              <TableHead className="text-right">Downtime (m)</TableHead>
              <TableHead>Opened</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tickets.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground">
                  No tickets. Add manually, paste incident text, or upload CSV.
                </TableCell>
              </TableRow>
            ) : (
              tickets.map((t) => (
                <TableRow key={t.id}>
                  <TableCell className="max-w-[220px] truncate font-medium">
                    {t.title}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="font-mono text-xs">
                      {t.severity}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={t.status} />
                  </TableCell>
                  <TableCell className="text-muted-foreground">{t.region}</TableCell>
                  <TableCell className="text-right tabular-nums">
                    {t.downtimeMinutes}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {formatDate(t.openedAt)}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        size="sm"
                        variant="secondary"
                        className="h-8"
                        onClick={() => setAnalyzeTicketId(t.id)}
                      >
                        <Sparkles className="h-3.5 w-3.5" />
                        Analyze
                      </Button>
                      {t.contractMatches?.map((m) => {
                        const c = contracts.find((x) => x.id === m.contractId);
                        if (!c) return null;
                        return (
                          <Button
                            key={m.contractId}
                            size="sm"
                            variant="outline"
                            className="h-8"
                            title={`Create draft chargeback with ${c.vendorName}`}
                            onClick={() => {
                              const draft = buildChargebackFromTicket(t, c, m);
                              addChargeback(draft);
                            }}
                          >
                            New chargeback
                          </Button>
                        );
                      })}
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        onClick={() => deleteTicket(t.id)}
                        aria-label="Delete ticket"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <RcaAnalyzeDialog
        ticket={analyzeTicket}
        open={Boolean(analyzeTicketId)}
        onOpenChange={(v) => {
          if (!v) setAnalyzeTicketId(null);
        }}
      />
    </div>
  );
}

function StatusBadge({ status }: { status: TicketStatus }) {
  const variant =
    status === "chargeback_candidate"
      ? "default"
      : status === "analyzed"
        ? "secondary"
        : status === "analyzing"
          ? "outline"
          : "outline";
  return (
    <Badge variant={variant} className="text-xs capitalize">
      {status.replace(/_/g, " ")}
    </Badge>
  );
}

type NewTicketInput = {
  title: string;
  description: string;
  severity: TicketSeverity;
  status: "open";
  region: string;
  downtimeMinutes: number;
  vendorHint?: string;
};

function ManualTicketDialog({
  onSave,
}: {
  onSave: (t: NewTicketInput) => string;
}) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [severity, setSeverity] = useState<TicketSeverity>("P3");
  const [region, setRegion] = useState("Northeast");
  const [downtime, setDowntime] = useState("0");
  const [vendorHint, setVendorHint] = useState("");

  function submit() {
    if (!title.trim()) return;
    onSave({
      title: title.trim(),
      description: description.trim(),
      severity,
      status: "open",
      region: region.trim() || "Unknown",
      downtimeMinutes: Number(downtime) || 0,
      vendorHint: vendorHint.trim() || undefined,
    });
    setTitle("");
    setDescription("");
    setSeverity("P3");
    setRegion("Northeast");
    setDowntime("0");
    setVendorHint("");
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="h-4 w-4" />
          Add ticket
        </Button>
      </DialogTrigger>
      <DialogContent className="border-border shadow-none sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-base font-semibold">New ticket</DialogTitle>
        </DialogHeader>
        <div className="grid gap-3 py-1">
          <div className="grid gap-1.5">
            <Label htmlFor="t-title">Title</Label>
            <Input
              id="t-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="rounded-sm"
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="t-desc">Description</Label>
            <Textarea
              id="t-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="rounded-sm"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label>Severity</Label>
              <Select value={severity} onValueChange={(v) => setSeverity(v as TicketSeverity)}>
                <SelectTrigger className="rounded-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {severities.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="t-dt">Downtime (min)</Label>
              <Input
                id="t-dt"
                type="number"
                min={0}
                value={downtime}
                onChange={(e) => setDowntime(e.target.value)}
                className="rounded-sm"
              />
            </div>
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="t-region">Region</Label>
            <Input
              id="t-region"
              value={region}
              onChange={(e) => setRegion(e.target.value)}
              className="rounded-sm"
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="t-vendor">Vendor hint (optional)</Label>
            <Input
              id="t-vendor"
              value={vendorHint}
              onChange={(e) => setVendorHint(e.target.value)}
              className="rounded-sm"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={!title.trim()}>
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function PasteTicketDialog({
  onSave,
}: {
  onSave: (t: NewTicketInput & { rawIncidentText?: string }) => string;
}) {
  const [open, setOpen] = useState(false);
  const [raw, setRaw] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function parse() {
    if (!raw.trim()) return;
    setLoading(true);
    setErr(null);
    try {
      const res = await fetch("/api/ai/parse-ticket", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rawText: raw }),
      });
      const j = (await res.json()) as Record<string, unknown>;
      if (!res.ok) throw new Error((j.error as string) ?? "Parse failed");
      const sev = (j.severity as string) ?? "P3";
      onSave({
        title: String(j.title ?? "Incident"),
        description: String(j.description ?? raw.slice(0, 2000)),
        severity: (severities.includes(sev as TicketSeverity) ? sev : "P3") as TicketSeverity,
        status: "open",
        region: String(j.region ?? "Unknown"),
        downtimeMinutes: Number(j.downtimeMinutes) || 0,
        vendorHint: j.vendorHint ? String(j.vendorHint) : undefined,
        rawIncidentText: raw,
      });
      setRaw("");
      setOpen(false);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Parse failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          <ClipboardPaste className="h-4 w-4" />
          Paste incident
        </Button>
      </DialogTrigger>
      <DialogContent className="border-border shadow-none sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-base font-semibold">
            Parse raw incident text
          </DialogTitle>
        </DialogHeader>
        <Textarea
          value={raw}
          onChange={(e) => setRaw(e.target.value)}
          rows={10}
          placeholder="Paste alarm narrative, bridge notes, or trouble ticket body…"
          className="rounded-sm font-mono text-xs"
        />
        {err && (
          <p className="text-sm text-destructive">{err}</p>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={parse} disabled={loading || !raw.trim()}>
            {loading ? "Parsing…" : "Parse with AI"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
