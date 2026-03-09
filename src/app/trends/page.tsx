import { formatTokens, formatCost, formatNumber } from "@/lib/format";
import { parseSearchParams, getDailyTrends } from "@/lib/filters";
import { FilterBar } from "@/components/FilterBar";
import { StatCard } from "@/components/StatCard";
import { DataTable } from "@/components/DataTable";
import { TrendsCharts } from "./trends-charts";

export const dynamic = "force-dynamic";

interface Props {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function TrendsPage({ searchParams }: Props) {
  const filters = parseSearchParams(await searchParams);

  // Default to last 30 days if no date range specified
  if (!filters.from) {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    filters.from = d.toISOString().split("T")[0];
  }
  if (!filters.to) {
    filters.to = new Date().toISOString().split("T")[0];
  }

  const days = await getDailyTrends(filters);

  // Extract available filter options from all days
  const allModels = new Set<string>();
  const allTeams = new Set<string>();
  const allApps = new Set<string>();
  if (days) {
    for (const d of days) {
      for (const m of Object.keys(d.summary.byModel)) allModels.add(m);
      for (const t of Object.keys(d.summary.byTeam)) allTeams.add(t);
      for (const a of Object.keys(d.summary.byApp)) allApps.add(a);
    }
  }

  if (!days || days.length === 0) {
    return (
      <div>
        <div className="dashrock-page-header">
          <h1 className="db-heading-2">Usage Trends</h1>
        </div>
        <FilterBar
          availableModels={[...allModels].sort()}
          availableTeams={[...allTeams].sort()}
          availableApps={[...allApps].sort()}
        />
        <div className="db-empty-state">
          <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>📈</div>
          <h2 className="db-heading-3">No trend data yet</h2>
          <p className="db-body">Select a date range with available data to view trends.</p>
        </div>
      </div>
    );
  }

  const totalInvocations = days.reduce((sum, d) => sum + d.summary.totalInvocations, 0);
  const totalCost = days.reduce((sum, d) => sum + d.summary.totalCost, 0);
  const totalTokens = days.reduce((sum, d) => sum + d.summary.totalInputTokens + d.summary.totalOutputTokens, 0);
  const avgDaily = totalInvocations / days.length;

  return (
    <div>
      <div className="dashrock-page-header">
        <h1 className="db-heading-2">Usage Trends</h1>
        <span className="db-badge">{days.length} days</span>
      </div>

      <FilterBar
        availableModels={[...allModels].sort()}
        availableTeams={[...allTeams].sort()}
        availableApps={[...allApps].sort()}
      />

      <div className="db-grid db-grid--4 db-gap-4" style={{ marginBottom: "1.5rem" }}>
        <StatCard label="Total Invocations" value={formatNumber(totalInvocations)} sub={`${days.length} days`} />
        <StatCard label="Total Cost" value={formatCost(totalCost)} sub="period total" />
        <StatCard label="Total Tokens" value={formatTokens(totalTokens)} sub={formatNumber(totalTokens)} />
        <StatCard label="Avg Daily Invocations" value={formatNumber(Math.round(avgDaily))} sub="per day" />
      </div>

      <TrendsCharts days={days} />

      <div className="db-card" style={{ marginTop: "1.5rem" }}>
        <div className="db-card__header">
          <h3 className="db-card__title">Daily Summary</h3>
        </div>
        <DataTable
          exportFilename="dashrock-daily-trends.csv"
          columns={[
            { key: "date", header: "Date", render: (r: { date: string; invocations: number; tokens: number; cost: number }) => <strong>{r.date}</strong>, csvValue: (r: { date: string }) => r.date },
            { key: "invocations", header: "Invocations", numeric: true, render: (r: { date: string; invocations: number; tokens: number; cost: number }) => formatNumber(r.invocations), csvValue: (r: { invocations: number }) => r.invocations },
            { key: "tokens", header: "Total Tokens", numeric: true, render: (r: { date: string; invocations: number; tokens: number; cost: number }) => formatTokens(r.tokens), csvValue: (r: { tokens: number }) => r.tokens },
            { key: "cost", header: "Cost", numeric: true, render: (r: { date: string; invocations: number; tokens: number; cost: number }) => formatCost(r.cost), csvValue: (r: { cost: number }) => r.cost },
          ]}
          rows={days.map((d) => ({
            date: d.date,
            invocations: d.summary.totalInvocations,
            tokens: d.summary.totalInputTokens + d.summary.totalOutputTokens,
            cost: d.summary.totalCost,
          })).reverse()}
        />
      </div>
    </div>
  );
}
