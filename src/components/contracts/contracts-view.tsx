"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
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
import { useAppStore } from "@/stores/app-store";
import { formatDate } from "@/lib/format";
import type { ContractClause, VendorContract } from "@/types";
import { newId } from "@/lib/id";

type AddContractFn = (
  c: Omit<VendorContract, "id" | "createdAt"> & { id?: string }
) => string;

export function ContractsView() {
  const contracts = useAppStore((s) => s.contracts);
  const addContract = useAppStore((s) => s.addContract);
  const deleteContract = useAppStore((s) => s.deleteContract);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Contracts</h1>
          <p className="text-sm text-muted-foreground">
            SLA summaries and chargeback clauses used for AI matching after RCA.
          </p>
        </div>
        <AddContractDialog onSave={addContract} />
      </div>

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
                    <TableHead className="w-[140px]">Type</TableHead>
                    <TableHead>Clause</TableHead>
                    <TableHead>Text</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {c.chargebackClauses.map((cl) => (
                    <TableRow key={cl.id}>
                      <TableCell className="align-top text-xs font-mono">
                        {cl.type}
                      </TableCell>
                      <TableCell className="align-top font-medium">
                        {cl.title}
                      </TableCell>
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
          <p className="text-sm text-muted-foreground">No contracts. Add one to enable matching.</p>
        )}
      </div>
    </div>
  );
}

function AddContractDialog({ onSave }: { onSave: AddContractFn }) {
  const [open, setOpen] = useState(false);
  const [vendorName, setVendorName] = useState("");
  const [contractNumber, setContractNumber] = useState("");
  const [effectiveFrom, setEffectiveFrom] = useState("");
  const [effectiveTo, setEffectiveTo] = useState("");
  const [slaSummary, setSlaSummary] = useState("");
  const [clauseTitle, setClauseTitle] = useState("");
  const [clauseText, setClauseText] = useState("");

  function submit() {
    if (!vendorName.trim() || !contractNumber.trim()) return;
    const clauses: ContractClause[] = [];
    if (clauseTitle.trim() && clauseText.trim()) {
      clauses.push({
        id: newId(),
        title: clauseTitle.trim(),
        type: "CREDIT",
        text: clauseText.trim(),
      });
    }
    onSave({
      vendorName: vendorName.trim(),
      contractNumber: contractNumber.trim(),
      effectiveFrom: effectiveFrom.trim() || new Date().toISOString().slice(0, 10),
      effectiveTo: effectiveTo.trim() || new Date().toISOString().slice(0, 10),
      slaSummary: slaSummary.trim() || "—",
      chargebackClauses:
        clauses.length > 0
          ? clauses
          : [
              {
                id: newId(),
                title: "General remedy",
                type: "OTHER",
                text: "See master agreement for remedies.",
              },
            ],
    });
    setVendorName("");
    setContractNumber("");
    setEffectiveFrom("");
    setEffectiveTo("");
    setSlaSummary("");
    setClauseTitle("");
    setClauseText("");
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
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
        <div className="grid gap-3">
          <div className="grid gap-1.5">
            <Label>Vendor</Label>
            <Input
              value={vendorName}
              onChange={(e) => setVendorName(e.target.value)}
              className="rounded-sm"
            />
          </div>
          <div className="grid gap-1.5">
            <Label>Contract number</Label>
            <Input
              value={contractNumber}
              onChange={(e) => setContractNumber(e.target.value)}
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
              className="rounded-sm"
            />
          </div>
          <p className="text-xs font-medium text-muted-foreground">
            Primary chargeback clause (add more later via export/edit in a future release)
          </p>
          <div className="grid gap-1.5">
            <Label>Clause title</Label>
            <Input
              value={clauseTitle}
              onChange={(e) => setClauseTitle(e.target.value)}
              className="rounded-sm"
            />
          </div>
          <div className="grid gap-1.5">
            <Label>Clause text</Label>
            <Textarea
              value={clauseText}
              onChange={(e) => setClauseText(e.target.value)}
              rows={4}
              className="rounded-sm"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={!vendorName.trim() || !contractNumber.trim()}>
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
