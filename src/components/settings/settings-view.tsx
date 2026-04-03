"use client";

import { useEffect, useState } from "react";
import Papa from "papaparse";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useAppStore } from "@/stores/app-store";
import { formatDate } from "@/lib/format";
import { SignOutButton } from "@/components/auth/sign-out-button";

export function SettingsView() {
  const auditLog = useAppStore((s) => s.auditLog);
  const tickets = useAppStore((s) => s.tickets);
  const contracts = useAppStore((s) => s.contracts);
  const chargebacks = useAppStore((s) => s.chargebacks);
  const resetAll = useAppStore((s) => s.resetAll);

  const [health, setHealth] = useState<{ openaiConfigured: boolean } | null>(null);
  const [testMsg, setTestMsg] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/health")
      .then((r) => r.json())
      .then((j) => setHealth({ openaiConfigured: Boolean(j.openaiConfigured) }))
      .catch(() => setHealth({ openaiConfigured: false }));
  }, []);

  function exportJson() {
    const blob = new Blob(
      [
        JSON.stringify(
          { tickets, contracts, chargebacks, auditLog, exportedAt: new Date().toISOString() },
          null,
          2
        ),
      ],
      { type: "application/json" }
    );
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `ne-chargeback-export-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  function exportCsv() {
    const rows = tickets.map((t) => ({
      id: t.id,
      title: t.title,
      severity: t.severity,
      status: t.status,
      region: t.region,
      downtimeMinutes: t.downtimeMinutes,
      openedAt: t.openedAt,
      hasRca: t.rca ? "yes" : "no",
    }));
    const csv = Papa.unparse(rows);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `tickets-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  async function testOpenAI() {
    setTestMsg(null);
    try {
      const res = await fetch("/api/ai/parse-ticket", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rawText: "P2 outage: Nokia 1830 pump laser failed on span LAX-PHX, 67 min impact, West region.",
        }),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error ?? "Request failed");
      setTestMsg(`OK — parsed title: ${String(j.title ?? "").slice(0, 80)}`);
    } catch (e) {
      setTestMsg(e instanceof Error ? e.message : "Failed");
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground">
          OpenAI is configured server-side only. Vercel: set{" "}
          <code className="rounded-sm border border-border bg-muted px-1 font-mono text-xs">
            OPENAI_API_KEY
          </code>
          . Local: <code className="font-mono text-xs">.env.local</code>.
        </p>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <Card className="border-border shadow-none">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">OpenAI</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <p>
              Status:{" "}
              {health === null ? (
                <span className="text-muted-foreground">Checking…</span>
              ) : health.openaiConfigured ? (
                <span className="font-medium text-primary">Key configured (server)</span>
              ) : (
                <span className="font-medium text-destructive">Not configured</span>
              )}
            </p>
            <Button size="sm" variant="secondary" className="rounded-sm" onClick={testOpenAI}>
              Test parse endpoint
            </Button>
            {testMsg && (
              <p className="text-xs text-muted-foreground">{testMsg}</p>
            )}
          </CardContent>
        </Card>

        <Card className="border-border shadow-none">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Data</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            <Button size="sm" variant="outline" className="rounded-sm" onClick={exportJson}>
              Export JSON
            </Button>
            <Button size="sm" variant="outline" className="rounded-sm" onClick={exportCsv}>
              Export tickets CSV
            </Button>
            <Button
              size="sm"
              variant="destructive"
              className="rounded-sm"
              onClick={() => {
                if (
                  window.confirm(
                    "Reset all local data and reload seed dataset?"
                  )
                ) {
                  resetAll();
                }
              }}
            >
              Reset & re-seed
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card className="border-border shadow-none">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold">Session</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          <p className="mb-3">End your session on this device.</p>
          <SignOutButton variant="secondary" />
        </CardContent>
      </Card>

      <Card className="border-border shadow-none">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold">Audit log</CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[320px] rounded-sm border border-border">
            <ul className="divide-y divide-border p-0">
              {auditLog.map((e) => (
                <li key={e.id} className="px-3 py-2 text-sm">
                  <p className="font-medium">{e.action}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatDate(e.at)} · {e.entityType}
                    {e.entityId ? ` · ${e.entityId}` : ""}
                  </p>
                  {e.detail && (
                    <p className="mt-1 text-xs text-muted-foreground">{e.detail}</p>
                  )}
                </li>
              ))}
            </ul>
          </ScrollArea>
        </CardContent>
      </Card>

      <Separator />
      <p className="text-xs text-muted-foreground">
        This console stores data in your browser (localStorage). Do not store regulated data
        without organizational approval.
      </p>
    </div>
  );
}
