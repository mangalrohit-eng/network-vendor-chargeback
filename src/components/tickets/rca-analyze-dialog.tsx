"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { useAppStore } from "@/stores/app-store";
import type { ContractMatchResult, RCAAnalysis, Ticket } from "@/types";

type Phase = "idle" | "rca" | "match" | "done" | "error";

export function RcaAnalyzeDialog({
  ticket,
  open,
  onOpenChange,
}: {
  ticket: Ticket | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const contracts = useAppStore((s) => s.contracts);
  const updateTicket = useAppStore((s) => s.updateTicket);
  const [phase, setPhase] = useState<Phase>("idle");
  const [streamText, setStreamText] = useState("");
  const [error, setError] = useState<string | null>(null);

  const reset = useCallback(() => {
    setPhase("idle");
    setStreamText("");
    setError(null);
  }, []);

  useEffect(() => {
    if (open) reset();
  }, [open, ticket?.id, reset]);

  const run = useCallback(async () => {
    if (!ticket) return;
    setError(null);
    setStreamText("");
    setPhase("rca");
    updateTicket(ticket.id, { status: "analyzing" });

    try {
      const res = await fetch("/api/ai/rca", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: ticket.title,
          description: ticket.description,
          region: ticket.region,
          severity: ticket.severity,
          downtimeMinutes: ticket.downtimeMinutes,
          vendorHint: ticket.vendorHint,
          rawIncidentText: ticket.rawIncidentText,
        }),
      });

      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error((j as { error?: string }).error ?? res.statusText);
      }

      const reader = res.body?.getReader();
      const dec = new TextDecoder();
      let acc = "";
      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          acc += dec.decode(value, { stream: true });
          setStreamText(acc);
        }
      }

      let rca: RCAAnalysis;
      try {
        const parsed = JSON.parse(acc) as RCAAnalysis;
        rca = {
          ...parsed,
          analyzedAt: new Date().toISOString(),
        };
      } catch {
        throw new Error("Model did not return valid RCA JSON. Check OpenAI configuration.");
      }

      setPhase("match");
      setStreamText((prev) => prev + "\n\n--- Matching contracts ---\n");

      const mRes = await fetch("/api/ai/match-contracts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ticket: {
            id: ticket.id,
            title: ticket.title,
            description: ticket.description,
            region: ticket.region,
            severity: ticket.severity,
            downtimeMinutes: ticket.downtimeMinutes,
          },
          rca,
          contracts: contracts.map((c) => ({
            id: c.id,
            vendorName: c.vendorName,
            contractNumber: c.contractNumber,
            slaSummary: c.slaSummary,
            chargebackClauses: c.chargebackClauses,
          })),
        }),
      });

      if (!mRes.ok) {
        const j = await mRes.json().catch(() => ({}));
        throw new Error((j as { error?: string }).error ?? mRes.statusText);
      }

      const mReader = mRes.body?.getReader();
      let mAcc = "";
      if (mReader) {
        while (true) {
          const { done, value } = await mReader.read();
          if (done) break;
          mAcc += dec.decode(value, { stream: true });
          setStreamText(acc + "\n\n--- Matching contracts ---\n" + mAcc);
        }
      }

      let matches: ContractMatchResult[];
      try {
        matches = JSON.parse(mAcc) as ContractMatchResult[];
        if (!Array.isArray(matches)) throw new Error("not array");
      } catch {
        throw new Error("Contract match response was not valid JSON array.");
      }

      const status =
        matches.length > 0 ? "chargeback_candidate" : "analyzed";
      updateTicket(ticket.id, {
        rca,
        contractMatches: matches,
        status,
      });
      setPhase("done");
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Analysis failed";
      setError(msg);
      setPhase("error");
      updateTicket(ticket.id, { status: "open" });
    }
  }, [ticket, contracts, updateTicket]);

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) reset();
        onOpenChange(v);
      }}
    >
      <DialogContent className="max-h-[85vh] max-w-2xl border-border shadow-none">
        <DialogHeader>
          <DialogTitle className="text-base font-semibold">
            RCA analysis — {ticket?.title ?? ""}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          {contracts.length === 0 && (
            <p className="border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-muted-foreground">
              You have no contracts in the library. RCA will still run, but contract matching cannot
              find chargeback clauses until you add agreements on the Contracts page.
            </p>
          )}
          <div className="flex gap-2">
            <Button
              type="button"
              size="sm"
              onClick={run}
              disabled={!ticket || phase === "rca" || phase === "match"}
            >
              {phase === "idle" || phase === "error" || phase === "done"
                ? "Run analysis"
                : "Running…"}
            </Button>
            {(phase === "done" || phase === "error") && (
              <Button type="button" size="sm" variant="outline" onClick={reset}>
                Reset view
              </Button>
            )}
          </div>
          {(phase === "rca" || phase === "match") && (
            <Progress value={phase === "rca" ? 45 : 88} className="h-1" />
          )}
          {error && (
            <p className="border border-destructive/50 bg-destructive/5 px-3 py-2 text-sm text-destructive">
              {error}
            </p>
          )}
          <ScrollArea className="h-[340px] w-full rounded-sm border border-border">
            <pre className="whitespace-pre-wrap break-words p-3 font-mono text-xs leading-relaxed">
              {streamText ||
                "Output from the model appears here. Click Run analysis to stream RCA JSON, then contract matches."}
            </pre>
          </ScrollArea>
          {phase === "done" && (
            <p className="text-xs text-muted-foreground">
              Results saved to the ticket. Create chargebacks from the ticket row or Pipeline.
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
