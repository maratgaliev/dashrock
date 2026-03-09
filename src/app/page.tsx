import { formatTokens, formatCost, formatNumber } from "@/lib/format";
import { parseSearchParams, getFilteredData } from "@/lib/filters";
import { FilterBar } from "@/components/FilterBar";
import { EmptyState } from "@/components/EmptyState";
import { StatCard } from "@/components/StatCard";
import { DataTable } from "@/components/DataTable";
import { OverviewCharts } from "./overview-charts";
import type { InvocationRecord } from "@/lib/types";

export const dynamic = "force-dynamic";

interface Props {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function OverviewPage({ searchParams }: Props) {
  const filters = parseSearchParams(await searchParams);
  const data = await getFilteredData(filters);

  if (data.emptyReason) {
    return <EmptyState reason={data.emptyReason} pageTitle="Overview" availableModels={data.availableModels} availableTeams={data.availableTeams} availableApps={data.availableApps} />;
  }

  const { summary: today, invocations: recentInvocations, lastUpdated, availableModels, availableTeams, availableApps, isDateRange } = data;
  const periodLabel = isDateRange ? `${filters.from} to ${filters.to}` : "today";

  return (
    <div>
      <div className="dashrock-page-header">
        <h1 className="db-heading-2"><span className="db-badge">Bedrock Analytics</span></h1>
        <span className="db-badge">Last updated: {new Date(lastUpdated).toLocaleString()}</span>
      </div>

      <FilterBar availableModels={availableModels} availableTeams={availableTeams} availableApps={availableApps} />

      <div className="db-grid db-grid--4 db-gap-4" style={{ marginBottom: "1.5rem" }}>
        <StatCard label="Total Invocations" value={formatNumber(today.totalInvocations)} trend="up" sub={periodLabel} />
        <StatCard label="Input Tokens" value={formatTokens(today.totalInputTokens)} sub={`${formatNumber(today.totalInputTokens)} total`} />
        <StatCard label="Output Tokens" value={formatTokens(today.totalOutputTokens)} sub={`${formatNumber(today.totalOutputTokens)} total`} />
        <StatCard label="Total Cost" value={formatCost(today.totalCost)} trend="neutral" sub={periodLabel} />
      </div>

      <OverviewCharts invocations={recentInvocations} summary={today} />

      <div className="db-card" style={{ marginTop: "1.5rem" }}>
        <div className="db-card__header">
          <h3 className="db-card__title">Recent Invocations</h3>
        </div>
        <DataTable<InvocationRecord>
          exportFilename="dashrock-invocations.csv"
          columns={[
            { key: "time", header: "Time", render: (r) => new Date(r.timestamp).toLocaleTimeString(), csvValue: (r) => r.timestamp },
            { key: "model", header: "Model", render: (r) => <span className="db-chip">{r.modelName}</span>, csvValue: (r) => r.modelName },
            { key: "team", header: "Team", render: (r) => <span className="db-badge">{r.team}</span>, csvValue: (r) => r.team },
            { key: "input", header: "Input Tokens", numeric: true, render: (r) => formatNumber(r.inputTokens), csvValue: (r) => r.inputTokens },
            { key: "output", header: "Output Tokens", numeric: true, render: (r) => formatNumber(r.outputTokens), csvValue: (r) => r.outputTokens },
            { key: "cost", header: "Cost", numeric: true, render: (r) => formatCost(r.costTotal), csvValue: (r) => r.costTotal },
            {
              key: "status",
              header: "Status",
              render: (r) => r.statusCode === 200
                ? <span className="db-badge db-badge--new">OK</span>
                : <span className="db-badge db-badge--error">{r.statusCode}</span>,
              csvValue: (r) => r.statusCode,
            },
          ]}
          rows={recentInvocations.slice(-20).reverse()}
        />
      </div>
    </div>
  );
}
