"use client";

import { useMemo, useState } from "react";
import { useAppStore } from "@/stores/app-store";
import type { Chargeback, ChargebackStage } from "@/types";
import { formatUsd } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ChargebackDetailBody } from "@/components/pipeline/chargeback-detail-body";

const STAGES: ChargebackStage[] = [
  "draft",
  "review",
  "approved",
  "sent",
  "disputed",
  "paid",
];

const stageLabel: Record<ChargebackStage, string> = {
  draft: "Draft",
  review: "Review",
  approved: "Approved",
  sent: "Sent",
  disputed: "Disputed",
  paid: "Paid",
};

export function PipelineView() {
  const chargebacks = useAppStore((s) => s.chargebacks);
  const moveChargebackStage = useAppStore((s) => s.moveChargebackStage);
  const [selected, setSelected] = useState<Chargeback | null>(null);

  const byStage = useMemo(() => {
    const m = new Map<ChargebackStage, Chargeback[]>();
    for (const s of STAGES) m.set(s, []);
    for (const c of chargebacks) {
      const list = m.get(c.stage) ?? [];
      list.push(c);
      m.set(c.stage, list);
    }
    return m;
  }, [chargebacks]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Chargeback pipeline</h1>
        <p className="text-sm text-muted-foreground">
          Kanban by stage. Open a card for evidence, audit trail, and invoice preview.
        </p>
      </div>

      <div className="flex gap-3 overflow-x-auto pb-2">
        {STAGES.map((stage) => (
          <div
            key={stage}
            className="flex w-64 shrink-0 flex-col border border-border bg-card"
          >
            <div className="border-b border-border px-3 py-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {stageLabel[stage]}
              </p>
              <p className="text-[10px] text-muted-foreground">
                {(byStage.get(stage) ?? []).length} items
              </p>
            </div>
            <div className="flex flex-col gap-2 p-2">
              {(byStage.get(stage) ?? []).map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setSelected(c)}
                  className="border border-border bg-background p-3 text-left transition-colors hover:bg-muted/50"
                >
                  <p className="line-clamp-2 text-sm font-medium leading-snug">
                    {c.title}
                  </p>
                  <p className="mt-1 text-xs tabular-nums text-primary">
                    {formatUsd(c.totalAmount)}
                  </p>
                  <p className="mt-1 font-mono text-[10px] text-muted-foreground">
                    {c.invoiceNumber}
                  </p>
                </button>
              ))}
            </div>
            <div className="mt-auto border-t border-border p-2">
              <p className="text-[10px] text-muted-foreground">
                Move selected item in detail drawer
              </p>
            </div>
          </div>
        ))}
      </div>

      <Sheet open={Boolean(selected)} onOpenChange={(o) => !o && setSelected(null)}>
        <SheetContent className="flex w-full flex-col border-l border-border p-0 sm:max-w-lg">
          {selected && (
            <>
              <SheetHeader className="border-b border-border px-6 py-4 text-left">
                <SheetTitle className="pr-8 text-base font-semibold leading-snug">
                  {selected.title}
                </SheetTitle>
                <div className="flex flex-wrap gap-2 pt-2">
                  <Badge variant="outline" className="font-mono text-xs">
                    {selected.invoiceNumber}
                  </Badge>
                  <Badge className="text-xs capitalize">{selected.stage}</Badge>
                </div>
              </SheetHeader>
              <ScrollArea className="flex-1 px-6 py-4">
                <ChargebackDetailBody
                  chargeback={selected}
                  onMoveStage={(st) => {
                    moveChargebackStage(selected.id, st);
                    setSelected({ ...selected, stage: st });
                  }}
                />
              </ScrollArea>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
