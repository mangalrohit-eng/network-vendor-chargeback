"use client";

import dynamic from "next/dynamic";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatDate, formatUsd } from "@/lib/format";
import { useAppStore } from "@/stores/app-store";
import type { Chargeback, ChargebackStage } from "@/types";

const InvoicePdfActions = dynamic(
  () =>
    import("@/components/invoice/invoice-pdf-actions").then((m) => m.InvoicePdfActions),
  { ssr: false, loading: () => <p className="text-xs text-muted-foreground">Loading PDF…</p> }
);

const STAGES: ChargebackStage[] = [
  "draft",
  "review",
  "approved",
  "sent",
  "disputed",
  "paid",
];

export function ChargebackDetailBody({
  chargeback,
  onMoveStage,
}: {
  chargeback: Chargeback;
  onMoveStage: (s: ChargebackStage) => void;
}) {
  const tickets = useAppStore((s) => s.tickets);
  const contracts = useAppStore((s) => s.contracts);
  const ticket = tickets.find((t) => t.id === chargeback.ticketId);
  const contract = contracts.find((c) => c.id === chargeback.contractId);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <Select
          value={chargeback.stage}
          onValueChange={(v) => onMoveStage(v as ChargebackStage)}
        >
          <SelectTrigger className="h-9 w-[180px] rounded-sm">
            <SelectValue placeholder="Stage" />
          </SelectTrigger>
          <SelectContent>
            {STAGES.map((s) => (
              <SelectItem key={s} value={s}>
                {s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Amount
        </h3>
        <p className="text-xl font-semibold tabular-nums">{formatUsd(chargeback.totalAmount)}</p>
      </div>

      <div>
        <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Linked records
        </h3>
        <p className="mt-1 text-sm">
          Ticket:{" "}
          <span className="font-mono text-xs">{ticket?.title ?? chargeback.ticketId}</span>
        </p>
        <p className="text-sm">
          Contract:{" "}
          <span className="font-mono text-xs">
            {contract?.vendorName ?? chargeback.contractId} · {contract?.contractNumber}
          </span>
        </p>
      </div>

      <div>
        <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Evidence summary
        </h3>
        <p className="mt-1 text-sm text-muted-foreground">{chargeback.evidenceSummary}</p>
      </div>

      <Separator />

      <div>
        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Line items & legal basis
        </h3>
        <ul className="space-y-3">
          {chargeback.lineItems.map((li) => (
            <li
              key={li.id}
              className="border border-border bg-background p-3 text-sm"
            >
              <p className="font-medium">{li.description}</p>
              <p className="mt-1 text-xs text-muted-foreground">{li.clauseTitle}</p>
              <p className="mt-1 font-mono text-xs leading-relaxed">{li.legalBasis}</p>
              <p className="mt-2 text-sm font-semibold tabular-nums">{formatUsd(li.amount)}</p>
            </li>
          ))}
        </ul>
      </div>

      <Separator />

      <div>
        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Timeline / audit
        </h3>
        <ul className="space-y-2 text-sm">
          {chargeback.timeline.map((e) => (
            <li key={e.id} className="flex gap-2 border-l-2 border-primary pl-3">
              <div className="min-w-0 flex-1">
                <p className="font-medium">{e.action}</p>
                <p className="text-xs text-muted-foreground">
                  {e.actor} · {formatDate(e.at)}
                </p>
                {e.detail && (
                  <p className="mt-1 text-xs text-muted-foreground">{e.detail}</p>
                )}
              </div>
            </li>
          ))}
        </ul>
      </div>

      <Separator />

      <div>
        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Invoice (PDF)
        </h3>
        <InvoicePdfActions chargeback={chargeback} contract={contract} ticket={ticket} />
      </div>
    </div>
  );
}
