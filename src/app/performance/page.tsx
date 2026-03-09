import { formatNumber, formatTokens } from "@/lib/format";
import { parseSearchParams, getFilteredData } from "@/lib/filters";
import { FilterBar } from "@/components/FilterBar";
import { EmptyState } from "@/components/EmptyState";
import { StatCard } from "@/components/StatCard";
import { DataTable } from "@/components/DataTable";
import { PerformanceCharts } from "./performance-charts";
import type { InvocationRecord } from "@/lib/types";

export const dynamic = "force-dynamic";

function computePercentile(sorted: number[], p: number): number {
  if (sorted.length === 0) return 0;
  const idx = Math.ceil((p / 100) * sorted.length) - 1;
  return sorted[Math.max(0, idx)];
}

interface Props {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function PerformancePage({ searchParams }: Props) {
  const filters = parseSearchParams(await searchParams);
  const data = await getFilteredData(filters);

  if (data.emptyReason) {
    return <EmptyState reason={data.emptyReason} pageTitle="Performance" availableModels={data.availableModels} availableTeams={data.availableTeams} availableApps={data.availableApps} />;
  }

  const { summary: today, invocations: recentInvocations, availableModels, availableTeams, availableApps } = data;

  const latencies = recentInvocations
    .filter((r) => r.latencyMs !== null)
    .map((r) => r.latencyMs!)
    .sort((a, b) => a - b);

  const p50 = computePercentile(latencies, 50);
  const p95 = computePercentile(latencies, 95);
  const p99 = computePercentile(latencies, 99);

  const errors = recentInvocations.filter((r) => r.statusCode !== 200);
  const errorRate = recentInvocations.length > 0
    ? ((errors.length / recentInvocations.length) * 100).toFixed(1) : "0.0";

  const largeRequests = [...recentInvocations]
    .sort((a, b) => (b.inputTokens + b.outputTokens) - (a.inputTokens + a.outputTokens))
    .slice(0, 10);

  return (
    <div>
      <div className="dashrock-page-header">
        <h1 className="db-heading-2">Performance</h1>
      </div>

      <FilterBar availableModels={availableModels} availableTeams={availableTeams} availableApps={availableApps} />

      {errors.length > 0 && (
        <div className="db-alert db-alert--error" style={{ marginBottom: "1.5rem" }}>
          <strong>{errors.length} errors</strong> detected in recent requests.
          {errors.some((e) => e.statusCode === 429) && " Includes throttling (429) responses."}
        </div>
      )}

      {parseFloat(errorRate) === 0 && (
        <div className="db-alert db-alert--success" style={{ marginBottom: "1.5rem" }}>
          All recent requests completed successfully. No errors detected.
        </div>
      )}

      <div className="db-grid db-grid--4 db-gap-4" style={{ marginBottom: "1.5rem" }}>
        <StatCard label="Latency (p50)" value={`${p50}ms`} trend="neutral" sub="median" />
        <StatCard label="Latency (p95)" value={`${p95}ms`} sub="95th percentile" />
        <StatCard label="Latency (p99)" value={`${p99}ms`} sub="99th percentile" />
        <StatCard
          label="Error Rate"
          value={`${errorRate}%`}
          trend={parseFloat(errorRate) > 5 ? "down" : "up"}
          sub={`${errors.length} / ${recentInvocations.length} requests`}
        />
      </div>

      <PerformanceCharts invocations={recentInvocations} summary={today} />

      <div className="db-card" style={{ marginTop: "1.5rem" }}>
        <div className="db-card__header">
          <h3 className="db-card__title">Largest Requests — Token Waste Analysis</h3>
        </div>
        <DataTable<InvocationRecord>
          exportFilename="dashrock-large-requests.csv"
          columns={[
            { key: "time", header: "Time", render: (r) => new Date(r.timestamp).toLocaleTimeString(), csvValue: (r) => r.timestamp },
            { key: "model", header: "Model", render: (r) => <span className="db-chip">{r.modelName}</span>, csvValue: (r) => r.modelName },
            { key: "team", header: "Team", render: (r) => <span className="db-badge">{r.team}</span>, csvValue: (r) => r.team },
            { key: "input", header: "Input", numeric: true, render: (r) => formatNumber(r.inputTokens), csvValue: (r) => r.inputTokens },
            { key: "output", header: "Output", numeric: true, render: (r) => formatNumber(r.outputTokens), csvValue: (r) => r.outputTokens },
            { key: "total", header: "Total", numeric: true, render: (r) => <strong>{formatTokens(r.inputTokens + r.outputTokens)}</strong>, csvValue: (r) => r.inputTokens + r.outputTokens },
            {
              key: "latency",
              header: "Latency",
              numeric: true,
              render: (r) => r.latencyMs ? `${r.latencyMs}ms` : "-",
              csvValue: (r) => r.latencyMs ?? "",
            },
            {
              key: "status",
              header: "Status",
              render: (r) => r.statusCode === 200
                ? <span className="db-badge db-badge--new">OK</span>
                : <span className="db-badge db-badge--error">{r.statusCode}</span>,
              csvValue: (r) => r.statusCode,
            },
          ]}
          rows={largeRequests}
        />
      </div>

      {errors.length > 0 && (
        <div className="db-card" style={{ marginTop: "1.5rem" }}>
          <div className="db-card__header">
            <h3 className="db-card__title">Error Details</h3>
          </div>
          <DataTable<InvocationRecord>
            exportFilename="dashrock-errors.csv"
            columns={[
              { key: "time", header: "Time", render: (r) => new Date(r.timestamp).toLocaleTimeString(), csvValue: (r) => r.timestamp },
              { key: "model", header: "Model", render: (r) => <span className="db-chip">{r.modelName}</span>, csvValue: (r) => r.modelName },
              { key: "status", header: "Status Code", render: (r) => <span className="db-badge db-badge--error">{r.statusCode}</span>, csvValue: (r) => r.statusCode },
              { key: "team", header: "Team", render: (r) => r.team, csvValue: (r) => r.team },
              { key: "app", header: "App", render: (r) => r.app, csvValue: (r) => r.app },
            ]}
            rows={errors}
          />
        </div>
      )}
    </div>
  );
}
