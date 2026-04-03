"use client";

import { useState } from "react";
import Link from "next/link";
import { FileUp, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAppStore } from "@/stores/app-store";
import { formatDate } from "@/lib/format";
import type { ContractClause, VendorContract } from "@/types";
import { newId } from "@/lib/id";

type AddContractFn = (
  c: Omit<VendorContract, "id" | "createdAt"> & { id?: string }
) => string;

const clauseTypes: ContractClause["type"][] = ["SLA", "CREDIT", "PENALTY", "OTHER"];

type ClauseDraft = { title: string; type: ContractClause["type"]; text: string };

function emptyClause(): ClauseDraft {
  return { title: "", type: "CREDIT", text: "" };
}

export function ContractsView() {
  const contracts = useAppStore((s) => s.contracts);
  const addContract = useAppStore((s) => s.addContract);
  const deleteContract = useAppStore((s) => s.deleteContract);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="max-w-2xl space-y-2">
          <h1 className="text-2xl font-semibold tracking-tight">Contracts</h1>
          <p className="text-sm text-muted-foreground">
            Build your vendor agreement library here. After you run RCA on a ticket, the app matches
            findings to these SLA summaries and chargeback clauses.
          </p>
        </div>
        <AddContractDialog onSave={addContract} />
      </div>

      <ol className="list-decimal space-y-1 border border-border bg-muted/20 px-6 py-3 text-sm text-muted-foreground">
        <li>
          Add each vendor agreement (upload a PDF to auto-extract clauses, or enter manually).
        </li>
        <li>
          Go to{" "}
          <Link href="/tickets" className="font-medium text-foreground underline underline-offset-2">
            Tickets
          </Link>{" "}
          and run <span className="font-medium text-foreground">Analyze</span> on an incident.
        </li>
        <li>
          Use{" "}
          <span className="font-medium text-foreground">New chargeback</span> on the ticket row when
          a contract match appears, then track it in{" "}
          <Link
            href="/pipeline"
            className="font-medium text-foreground underline underline-offset-2"
          >
            Chargeback pipeline
          </Link>
          .
        </li>
      </ol>

      <div className="space-y-4">
        {contracts.map((c) => (
          <div key={c.id} className="border border-border bg-card">
            <div className="flex flex-wrap items-start justify-between gap-2 border-b border-border px-4 py-3">
              <div>
                <p className="font-semibold">{c.vendorName}</p>
                <p className="text-xs text-muted-foreground">
                  {c.contractNumber} · Effective {c.effectiveFrom} → {c.effectiveTo}
                </p>
              </div>
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive"
                onClick={() => deleteContract(c.id)}
                aria-label="Delete contract"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
            <div className="px-4 py-3 text-sm text-muted-foreground">
              <p className="font-medium text-foreground">SLA summary</p>
              <p className="mt-1">{c.slaSummary}</p>
            </div>
            <div className="border-t border-border">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="w-[120px]">Type</TableHead>
                    <TableHead>Clause</TableHead>
                    <TableHead>Text</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {c.chargebackClauses.map((cl) => (
                    <TableRow key={cl.id}>
                      <TableCell className="align-top text-xs font-mono">{cl.type}</TableCell>
                      <TableCell className="align-top font-medium">{cl.title}</TableCell>
                      <TableCell className="align-top text-xs text-muted-foreground">
                        {cl.text}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <div className="border-t border-border px-4 py-2 text-[10px] text-muted-foreground">
              Added {formatDate(c.createdAt)}
            </div>
          </div>
        ))}
        {contracts.length === 0 && (
          <div className="border border-dashed border-border bg-muted/10 px-4 py-8 text-center text-sm text-muted-foreground">
            <p className="font-medium text-foreground">No contracts yet</p>
            <p className="mt-2 max-w-md mx-auto">
              Without agreements in this library, contract matching after RCA will not find chargeback
              opportunities. Use <span className="text-foreground">Add contract</span> and upload a
              PDF or paste clause text.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

type ExtractResponse = {
  vendorName: string;
  contractNumber: string;
  effectiveFrom: string;
  effectiveTo: string;
  slaSummary: string;
  chargebackClauses: Omit<ContractClause, "id">[];
  notes?: string;
};

function AddContractDialog({ onSave }: { onSave: AddContractFn }) {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<"manual" | "pdf">("pdf");
  const [vendorName, setVendorName] = useState("");
  const [contractNumber, setContractNumber] = useState("");
  const [effectiveFrom, setEffectiveFrom] = useState("");
  const [effectiveTo, setEffectiveTo] = useState("");
  const [slaSummary, setSlaSummary] = useState("");
  const [clauses, setClauses] = useState<ClauseDraft[]>([emptyClause()]);
  const [extractNotes, setExtractNotes] = useState<string | null>(null);

  const [pdfLoading, setPdfLoading] = useState(false);
  const [pdfError, setPdfError] = useState<string | null>(null);

  function resetForm() {
    setVendorName("");
    setContractNumber("");
    setEffectiveFrom("");
    setEffectiveTo("");
    setSlaSummary("");
    setClauses([emptyClause()]);
    setExtractNotes(null);
    setPdfError(null);
  }

  function applyExtract(data: ExtractResponse) {
    setVendorName(data.vendorName);
    setContractNumber(data.contractNumber);
    setEffectiveFrom(data.effectiveFrom);
    setEffectiveTo(data.effectiveTo);
    setSlaSummary(data.slaSummary);
    setClauses(
      data.chargebackClauses.length
        ? data.chargebackClauses.map((c) => ({
            title: c.title,
            type: c.type,
            text: c.text,
          }))
        : [emptyClause()]
    );
    setExtractNotes(data.notes ?? null);
    setTab("manual");
  }

  async function extractFromPdf(file: File) {
    setPdfLoading(true);
    setPdfError(null);
    setExtractNotes(null);
    try {
      const fd = new FormData();
      fd.set("file", file);
      const res = await fetch("/api/ai/extract-contract", {
        method: "POST",
        body: fd,
        credentials: "same-origin",
      });
      const rawText = await res.text();
      let j: ExtractResponse & { error?: string; detail?: string };
      try {
        j = JSON.parse(rawText) as ExtractResponse & { error?: string; detail?: string };
      } catch {
        throw new Error(
          res.status === 401 || res.status === 403
            ? "Session expired or not signed in. Refresh the page and log in again, then retry the upload."
            : `Server returned a non-JSON response (${res.status}). Try again, or use a smaller text-based PDF.`
        );
      }
      if (!res.ok) {
        const hint = j.detail ? ` ${j.detail}` : "";
        throw new Error((j.error ?? "Extraction failed") + hint);
      }
      applyExtract(j);
    } catch (e) {
      setPdfError(e instanceof Error ? e.message : "Extraction failed");
    } finally {
      setPdfLoading(false);
    }
  }

  function submit() {
    if (!vendorName.trim() || !contractNumber.trim()) return;
    const built: ContractClause[] = clauses
      .map((cl) => ({
        id: newId(),
        title: cl.title.trim(),
        type: cl.type,
        text: cl.text.trim(),
      }))
      .filter((cl) => cl.title || cl.text);

    onSave({
      vendorName: vendorName.trim(),
      contractNumber: contractNumber.trim(),
      effectiveFrom: effectiveFrom.trim() || new Date().toISOString().slice(0, 10),
      effectiveTo: effectiveTo.trim() || new Date().toISOString().slice(0, 10),
      slaSummary: slaSummary.trim() || "—",
      chargebackClauses:
        built.length > 0
          ? built
          : [
              {
                id: newId(),
                title: "General remedy",
                type: "OTHER",
                text: "See master agreement for remedies.",
              },
            ],
    });
    resetForm();
    setOpen(false);
  }

  function updateClause(i: number, patch: Partial<ClauseDraft>) {
    setClauses((rows) => rows.map((r, j) => (j === i ? { ...r, ...patch } : r)));
  }

  function removeClause(i: number) {
    setClauses((rows) => (rows.length <= 1 ? rows : rows.filter((_, j) => j !== i)));
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        setOpen(v);
        if (v) {
          resetForm();
          setTab("pdf");
        } else {
          resetForm();
        }
      }}
    >
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="h-4 w-4" />
          Add contract
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto border-border shadow-none sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-base font-semibold">New vendor contract</DialogTitle>
        </DialogHeader>

        <Tabs value={tab} onValueChange={(v) => setTab(v as "manual" | "pdf")} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="pdf" className="text-xs sm:text-sm">
              From PDF
            </TabsTrigger>
            <TabsTrigger value="manual" className="text-xs sm:text-sm">
              Details & clauses
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pdf" className="mt-4 space-y-3">
            <p className="text-xs text-muted-foreground leading-relaxed">
              Upload a text-based PDF (not a scan). We extract text on the server, then use AI to
              suggest vendor name, dates, an SLA summary, and chargeback-relevant clauses. Review
              everything on the next tab before saving.
            </p>
            <div className="rounded-sm border border-dashed border-border bg-muted/20 px-4 py-6 text-center">
              <input
                type="file"
                accept="application/pdf,.pdf"
                className="sr-only"
                id="contract-pdf"
                disabled={pdfLoading}
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  e.target.value = "";
                  if (f) void extractFromPdf(f);
                }}
              />
              <label htmlFor="contract-pdf" className="cursor-pointer">
                <span className="inline-flex items-center gap-2 text-sm font-medium text-foreground">
                  <FileUp className="h-4 w-4" />
                  {pdfLoading ? "Extracting…" : "Choose PDF file"}
                </span>
                <p className="mt-2 text-xs text-muted-foreground">Maximum size 12 MB</p>
              </label>
            </div>
            {pdfError && (
              <p className="border border-destructive/50 bg-destructive/5 px-3 py-2 text-sm text-destructive">
                {pdfError}
              </p>
            )}
            {extractNotes && (
              <p className="text-xs text-muted-foreground">
                <span className="font-medium text-foreground">Model notes: </span>
                {extractNotes}
              </p>
            )}
            <Button
              type="button"
              variant="secondary"
              size="sm"
              className="w-full"
              onClick={() => setTab("manual")}
            >
              Skip PDF — enter manually
            </Button>
          </TabsContent>

          <TabsContent value="manual" className="mt-4 space-y-3">
            {extractNotes && (
              <p className="text-xs text-muted-foreground">
                <span className="font-medium text-foreground">Extraction notes: </span>
                {extractNotes}
              </p>
            )}
            <div className="grid gap-3">
              <div className="grid gap-1.5">
                <Label>Vendor</Label>
                <Input
                  value={vendorName}
                  onChange={(e) => setVendorName(e.target.value)}
                  placeholder="e.g. Acme Optical Systems"
                  className="rounded-sm"
                />
              </div>
              <div className="grid gap-1.5">
                <Label>Contract number</Label>
                <Input
                  value={contractNumber}
                  onChange={(e) => setContractNumber(e.target.value)}
                  placeholder="MSA / agreement ID"
                  className="rounded-sm"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="grid gap-1.5">
                  <Label>Effective from</Label>
                  <Input
                    type="date"
                    value={effectiveFrom}
                    onChange={(e) => setEffectiveFrom(e.target.value)}
                    className="rounded-sm"
                  />
                </div>
                <div className="grid gap-1.5">
                  <Label>Effective to</Label>
                  <Input
                    type="date"
                    value={effectiveTo}
                    onChange={(e) => setEffectiveTo(e.target.value)}
                    className="rounded-sm"
                  />
                </div>
              </div>
              <div className="grid gap-1.5">
                <Label>SLA summary</Label>
                <Textarea
                  value={slaSummary}
                  onChange={(e) => setSlaSummary(e.target.value)}
                  rows={3}
                  placeholder="Uptime targets, credits, response times…"
                  className="rounded-sm"
                />
              </div>

              <div className="flex items-center justify-between pt-1">
                <p className="text-xs font-medium text-muted-foreground">Chargeback clauses</p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs"
                  onClick={() => setClauses((r) => [...r, emptyClause()])}
                >
                  Add clause
                </Button>
              </div>

              <div className="max-h-[220px] space-y-3 overflow-y-auto pr-1">
                {clauses.map((cl, i) => (
                  <div
                    key={i}
                    className="space-y-2 rounded-sm border border-border bg-muted/10 p-3"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <Label className="text-xs">Clause {i + 1}</Label>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs text-muted-foreground hover:text-destructive"
                        onClick={() => removeClause(i)}
                        disabled={clauses.length <= 1}
                      >
                        Remove
                      </Button>
                    </div>
                    <div className="grid gap-2">
                      <Select
                        value={cl.type}
                        onValueChange={(v) =>
                          updateClause(i, { type: v as ContractClause["type"] })
                        }
                      >
                        <SelectTrigger className="h-8 rounded-sm text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {clauseTypes.map((t) => (
                            <SelectItem key={t} value={t}>
                              {t}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Input
                        value={cl.title}
                        onChange={(e) => updateClause(i, { title: e.target.value })}
                        placeholder="Section title"
                        className="rounded-sm text-sm"
                      />
                      <Textarea
                        value={cl.text}
                        onChange={(e) => updateClause(i, { text: e.target.value })}
                        rows={3}
                        placeholder="Clause language (verbatim or summary)"
                        className="rounded-sm text-xs"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={!vendorName.trim() || !contractNumber.trim()}>
            Save contract
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
