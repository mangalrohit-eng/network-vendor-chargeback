"use client";

import Link from "next/link";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAppStore } from "@/stores/app-store";
import { formatUsd } from "@/lib/format";
import type { ChargebackStage } from "@/types";

const STAGES: ChargebackStage[] = [
  "draft",
  "review",
  "approved",
  "sent",
  "disputed",
  "paid",
];

const COLORS = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
];

export function DashboardContent() {
  const tickets = useAppStore((s) => s.tickets);
  const contracts = useAppStore((s) => s.contracts);
  const chargebacks = useAppStore((s) => s.chargebacks);

  const analyzed = tickets.filter((t) => t.rca).length;
  const opp = tickets.filter(
    (t) => t.contractMatches && t.contractMatches.length > 0
  ).length;
  const pipelineUsd = chargebacks
    .filter((c) => c.stage !== "paid")
    .reduce((a, c) => a + c.totalAmount, 0);
  const recoveredUsd = chargebacks
    .filter((c) => c.stage === "paid")
    .reduce((a, c) => a + c.totalAmount, 0);

  const vendorMap = new Map<string, number>();
  for (const t of tickets) {
    const v =
      t.rca?.vendors?.[0]?.vendorName ??
      t.vendorHint ??
      t.contractMatches?.[0]?.vendorName ??
      "Unattributed";
    vendorMap.set(v, (vendorMap.get(v) ?? 0) + 1);
  }
  const vendorData = Array.from(vendorMap.entries()).map(([name, count]) => ({
    name,
    count,
  }));

  const stageMap = new Map<string, number>();
  for (const s of STAGES) stageMap.set(s, 0);
  for (const c of chargebacks) {
    stageMap.set(c.stage, (stageMap.get(c.stage) ?? 0) + 1);
  }
  const pipelineData = STAGES.map((s) => ({
    stage: s,
    count: stageMap.get(s) ?? 0,
  }));

  const pieData = pipelineData
    .filter((d) => d.count > 0)
    .map((d, i) => ({
      name: d.stage,
      value: d.count,
      fill: COLORS[i % COLORS.length],
    }));

  const nextSteps: { text: string; href: string }[] = [];
  if (contracts.length === 0) {
    nextSteps.push({
      text: "Add at least one vendor contract (upload a PDF or enter clauses manually).",
      href: "/contracts",
    });
  }
  const ticketsNeedingRca = tickets.filter((t) => !t.rca);
  if (ticketsNeedingRca.length > 0) {
    nextSteps.push({
      text: `Run AI analysis on ${ticketsNeedingRca.length} ticket${ticketsNeedingRca.length === 1 ? "" : "s"} that ${ticketsNeedingRca.length === 1 ? "has" : "have"} no RCA yet.`,
      href: "/tickets",
    });
  }
  const withMatches = tickets.filter(
    (t) => t.contractMatches && t.contractMatches.length > 0
  );
  const drafts = chargebacks.filter((c) => c.stage === "draft");
  if (withMatches.length > 0 && drafts.length > 0) {
    nextSteps.push({
      text: `${drafts.length} chargeback draft(s) in the pipeline — open the pipeline to advance stages or add more from ticket rows.`,
      href: "/pipeline",
    });
  } else if (withMatches.length > 0) {
    nextSteps.push({
      text: "Tickets with contract matches can create draft chargebacks from the Tickets table.",
      href: "/tickets",
    });
  }
  if (nextSteps.length === 0 && tickets.length > 0) {
    nextSteps.push({
      text: "Review pipeline totals and vendor attribution below, or open Tickets to add new incidents.",
      href: "/tickets",
    });
  }
  if (nextSteps.length === 0 && tickets.length === 0) {
    nextSteps.push({
      text: "Start by adding contracts, then intake a ticket on the Tickets page.",
      href: "/contracts",
    });
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Network failure intake, RCA coverage, and chargeback pipeline. Use the checklist below if
          you are unsure what to do next.
        </p>
      </div>

      {nextSteps.length > 0 && (
        <Card className="border-primary/20 bg-primary/5 shadow-none">
          <CardHeader className="pb-2 pt-4">
            <CardTitle className="text-sm font-semibold text-foreground">Suggested next steps</CardTitle>
          </CardHeader>
          <CardContent className="pb-4 pt-0">
            <ul className="list-disc space-y-2 pl-4 text-sm text-muted-foreground">
              {nextSteps.map((s, i) => (
                <li key={i}>
                  <Link
                    href={s.href}
                    className="font-medium text-foreground underline underline-offset-2 hover:text-primary"
                  >
                    {s.text}
                  </Link>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi
          title="Tickets analyzed"
          value={String(analyzed)}
          sub={`of ${tickets.length} total`}
        />
        <Kpi
          title="Chargeback opportunities"
          value={String(opp)}
          sub="Contract clause matches"
        />
        <Kpi
          title="In pipeline"
          value={formatUsd(pipelineUsd)}
          sub="Excluding paid"
        />
        <Kpi title="Recovered (paid)" value={formatUsd(recoveredUsd)} sub="Recorded in app" />
      </div>

      <div className="grid min-w-0 gap-3 lg:grid-cols-2">
        <Card className="min-w-0 border-border shadow-none">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">
              Failures by vendor (primary attribution)
            </CardTitle>
          </CardHeader>
          <CardContent className="h-[300px] min-h-[300px] min-w-0 pt-0">
            <ResponsiveContainer
              width="100%"
              height="100%"
              minHeight={280}
              minWidth={200}
              initialDimension={{ width: 520, height: 280 }}
            >
              <BarChart data={vendorData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{
                    borderRadius: 2,
                    border: "1px solid hsl(var(--border))",
                    boxShadow: "none",
                  }}
                />
                <Bar dataKey="count" fill="hsl(var(--primary))" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="min-w-0 border-border shadow-none">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">
              Chargeback pipeline status
            </CardTitle>
          </CardHeader>
          <CardContent className="h-[300px] min-h-[300px] min-w-0 pt-0">
            <ResponsiveContainer
              width="100%"
              height="100%"
              minHeight={280}
              minWidth={200}
              initialDimension={{ width: 520, height: 280 }}
            >
              <PieChart>
                <Pie
                  data={pieData.length ? pieData : [{ name: "none", value: 1, fill: "hsl(var(--muted))" }]}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={48}
                  outerRadius={88}
                  paddingAngle={2}
                >
                  {(pieData.length ? pieData : [{ name: "none", value: 1, fill: "hsl(var(--muted))" }]).map(
                    (e, i) => (
                      <Cell key={e.name + i} fill={e.fill} stroke="hsl(var(--border))" strokeWidth={1} />
                    )
                  )}
                </Pie>
                <Tooltip
                  contentStyle={{
                    borderRadius: 2,
                    border: "1px solid hsl(var(--border))",
                    boxShadow: "none",
                  }}
                />
                <Legend wrapperStyle={{ fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Kpi({
  title,
  value,
  sub,
}: {
  title: string;
  value: string;
  sub: string;
}) {
  return (
    <Card className="border-border shadow-none">
      <CardHeader className="pb-1 pt-4">
        <CardTitle className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="pb-4 pt-0">
        <p className="text-2xl font-semibold tabular-nums">{value}</p>
        <p className="text-xs text-muted-foreground">{sub}</p>
      </CardContent>
    </Card>
  );
}
