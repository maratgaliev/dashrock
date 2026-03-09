import { formatTokens, formatNumber } from "@/lib/format";
import { parseSearchParams, getFilteredData } from "@/lib/filters";
import { FilterBar } from "@/components/FilterBar";
import { EmptyState } from "@/components/EmptyState";
import { StatCard } from "@/components/StatCard";
import { DataTable } from "@/components/DataTable";
import { UsageCharts } from "./usage-charts";
import type { InvocationRecord } from "@/lib/types";

export const dynamic = "force-dynamic";

interface Props {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function UsagePage({ searchParams }: Props) {
  const filters = parseSearchParams(await searchParams);
  const data = await getFilteredData(filters);

  if (data.emptyReason) {
    return <EmptyState reason={data.emptyReason} pageTitle="Token Usage" availableModels={data.availableModels} availableTeams={data.availableTeams} availableApps={data.availableApps} />;
  }

  const { summary: today, invocations: recentInvocations, availableModels, availableTeams, availableApps } = data;

  const avgInputTokens = today.totalInvocations > 0
    ? Math.round(today.totalInputTokens / today.totalInvocations) : 0;
  const avgOutputTokens = today.totalInvocations > 0
    ? Math.round(today.totalOutputTokens / today.totalInvocations) : 0;
  const totalTokens = today.totalInputTokens + today.totalOutputTokens;

  return (
    <div>
      <div className="dashrock-page-header">
        <h1 className="db-heading-2">Token Usage</h1>
      </div>

      <FilterBar availableModels={availableModels} availableTeams={availableTeams} availableApps={availableApps} />

      <div className="db-grid db-grid--4 db-gap-4" style={{ marginBottom: "1.5rem" }}>
        <StatCard label="Total Tokens" value={formatTokens(totalTokens)} sub={formatNumber(totalTokens)} />
        <StatCard label="Input Tokens" value={formatTokens(today.totalInputTokens)} sub={`${totalTokens > 0 ? ((today.totalInputTokens / totalTokens) * 100).toFixed(0) : 0}% of total`} />
        <StatCard label="Avg Input / Request" value={formatNumber(avgInputTokens)} sub="tokens" />
        <StatCard label="Avg Output / Request" value={formatNumber(avgOutputTokens)} sub="tokens" />
      </div>

      <UsageCharts invocations={recentInvocations} summary={today} />

      <div className="db-card" style={{ marginTop: "1.5rem" }}>
        <div className="db-card__header">
          <h3 className="db-card__title">Token Breakdown by Model</h3>
        </div>
        <DataTable
          exportFilename="dashrock-token-breakdown.csv"
          columns={[
            { key: "model", header: "Model", render: (r: { name: string; inputTokens: number; outputTokens: number; total: number; inputPct: number; count: number }) => <span className="db-chip">{r.name}</span>, csvValue: (r: { name: string }) => r.name },
            { key: "requests", header: "Requests", numeric: true, render: (r: { name: string; inputTokens: number; outputTokens: number; total: number; inputPct: number; count: number }) => formatNumber(r.count), csvValue: (r: { count: number }) => r.count },
            { key: "input", header: "Input Tokens", numeric: true, render: (r: { name: string; inputTokens: number; outputTokens: number; total: number; inputPct: number; count: number }) => formatTokens(r.inputTokens), csvValue: (r: { inputTokens: number }) => r.inputTokens },
            { key: "output", header: "Output Tokens", numeric: true, render: (r: { name: string; inputTokens: number; outputTokens: number; total: number; inputPct: number; count: number }) => formatTokens(r.outputTokens), csvValue: (r: { outputTokens: number }) => r.outputTokens },
            { key: "total", header: "Total", numeric: true, render: (r: { name: string; inputTokens: number; outputTokens: number; total: number; inputPct: number; count: number }) => <strong>{formatTokens(r.total)}</strong>, csvValue: (r: { total: number }) => r.total },
            {
              key: "ratio",
              header: "In / Out",
              render: (r: { name: string; inputTokens: number; outputTokens: number; total: number; inputPct: number; count: number }) => (
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", minWidth: "140px" }}>
                  <div className="db-progress" style={{ flex: 1 }}>
                    <div className="db-progress__bar" style={{ width: `${r.inputPct}%`, background: "#3b82f6" }} />
                  </div>
                  <span className="db-caption">{r.inputPct.toFixed(0)}%</span>
                </div>
              ),
              csvValue: (r: { inputPct: number }) => `${r.inputPct.toFixed(1)}%`,
            },
          ]}
          rows={Object.entries(today.byModel)
            .sort((a, b) => (b[1].inputTokens + b[1].outputTokens) - (a[1].inputTokens + a[1].outputTokens))
            .map(([name, val]) => {
              const total = val.inputTokens + val.outputTokens;
              return {
                name,
                count: val.count,
                inputTokens: val.inputTokens,
                outputTokens: val.outputTokens,
                total,
                inputPct: total > 0 ? (val.inputTokens / total) * 100 : 0,
              };
            })}
        />
      </div>

      <div className="db-card" style={{ marginTop: "1.5rem" }}>
        <div className="db-card__header">
          <h3 className="db-card__title">Request Detail</h3>
        </div>
        <DataTable<InvocationRecord>
          exportFilename="dashrock-request-detail.csv"
          columns={[
            { key: "time", header: "Time", render: (r) => new Date(r.timestamp).toLocaleTimeString(), csvValue: (r) => r.timestamp },
            { key: "model", header: "Model", render: (r) => <span className="db-chip">{r.modelName}</span>, csvValue: (r) => r.modelName },
            { key: "team", header: "Team", render: (r) => <span className="db-badge">{r.team}</span>, csvValue: (r) => r.team },
            { key: "app", header: "App", render: (r) => r.app, csvValue: (r) => r.app },
            { key: "input", header: "Input", numeric: true, render: (r) => formatNumber(r.inputTokens), csvValue: (r) => r.inputTokens },
            { key: "output", header: "Output", numeric: true, render: (r) => formatNumber(r.outputTokens), csvValue: (r) => r.outputTokens },
            { key: "ratio", header: "Out/In", numeric: true, render: (r) => r.inputTokens > 0 ? (r.outputTokens / r.inputTokens).toFixed(1) + "x" : "-" },
          ]}
          rows={recentInvocations.slice(-30).reverse()}
        />
      </div>
    </div>
  );
}
