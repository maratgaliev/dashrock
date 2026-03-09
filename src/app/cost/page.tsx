import { formatCost, formatNumber, formatTokens } from "@/lib/format";
import { parseSearchParams, getFilteredData } from "@/lib/filters";
import { FilterBar } from "@/components/FilterBar";
import { EmptyState } from "@/components/EmptyState";
import { StatCard } from "@/components/StatCard";
import { DataTable } from "@/components/DataTable";
import { CostCharts } from "./cost-charts";

export const dynamic = "force-dynamic";

interface Props {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function CostPage({ searchParams }: Props) {
  const filters = parseSearchParams(await searchParams);
  const data = await getFilteredData(filters);

  if (data.emptyReason) {
    return <EmptyState reason={data.emptyReason} pageTitle="Cost Analysis" availableModels={data.availableModels} availableTeams={data.availableTeams} availableApps={data.availableApps} />;
  }

  const { summary: today, invocations: recentInvocations, availableModels, availableTeams, availableApps } = data;

  const avgCostPerRequest = today.totalInvocations > 0
    ? today.totalCost / today.totalInvocations : 0;

  const costByModel = Object.entries(today.byModel).sort((a, b) => b[1].cost - a[1].cost);
  const costByTeam = Object.entries(today.byTeam).sort((a, b) => b[1].cost - a[1].cost);

  const modelBreakdown = costByModel.map(([name, val]) => ({
    name,
    count: val.count,
    inputTokens: val.inputTokens,
    outputTokens: val.outputTokens,
    cost: val.cost,
    avgCost: val.count > 0 ? val.cost / val.count : 0,
  }));

  const highCostRequests = recentInvocations.filter((r) => r.costTotal > 0.01);

  return (
    <div>
      <div className="dashrock-page-header">
        <h1 className="db-heading-2">Cost Analysis</h1>
      </div>

      <FilterBar availableModels={availableModels} availableTeams={availableTeams} availableApps={availableApps} />

      {highCostRequests.length > 5 && (
        <div className="db-alert db-alert--warning" style={{ marginBottom: "1.5rem" }}>
          <strong>{highCostRequests.length} high-cost requests</strong> detected (over $0.01 each).
          Consider using lighter models for simple tasks.
        </div>
      )}

      <div className="db-grid db-grid--4 db-gap-4" style={{ marginBottom: "1.5rem" }}>
        <StatCard label="Total Cost" value={formatCost(today.totalCost)} trend="up" sub="estimated" />
        <StatCard label="Avg Cost / Request" value={formatCost(avgCostPerRequest)} />
        <StatCard
          label="Most Expensive Model"
          value={costByModel[0]?.[0] || "-"}
          sub={costByModel[0] ? formatCost(costByModel[0][1].cost) : ""}
        />
        <StatCard
          label="Top Spending Team"
          value={costByTeam[0]?.[0] || "-"}
          sub={costByTeam[0] ? formatCost(costByTeam[0][1].cost) : ""}
        />
      </div>

      <CostCharts invocations={recentInvocations} summary={today} />

      <div className="db-card" style={{ marginTop: "1.5rem" }}>
        <div className="db-card__header">
          <h3 className="db-card__title">Model Cost Breakdown</h3>
        </div>
        <DataTable
          exportFilename="dashrock-cost-breakdown.csv"
          columns={[
            {
              key: "model",
              header: "Model",
              render: (r: typeof modelBreakdown[0]) => (
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <div className="db-avatar db-avatar--sm" style={{ fontSize: "0.6rem" }}>{r.name.slice(0, 3)}</div>
                  <span className="db-chip">{r.name}</span>
                </div>
              ),
              csvValue: (r: typeof modelBreakdown[0]) => r.name,
            },
            { key: "invocations", header: "Invocations", numeric: true, render: (r: typeof modelBreakdown[0]) => formatNumber(r.count), csvValue: (r: typeof modelBreakdown[0]) => r.count },
            { key: "input", header: "Input Tokens", numeric: true, render: (r: typeof modelBreakdown[0]) => formatTokens(r.inputTokens), csvValue: (r: typeof modelBreakdown[0]) => r.inputTokens },
            { key: "output", header: "Output Tokens", numeric: true, render: (r: typeof modelBreakdown[0]) => formatTokens(r.outputTokens), csvValue: (r: typeof modelBreakdown[0]) => r.outputTokens },
            { key: "total", header: "Total Cost", numeric: true, render: (r: typeof modelBreakdown[0]) => <strong>{formatCost(r.cost)}</strong>, csvValue: (r: typeof modelBreakdown[0]) => r.cost },
            { key: "avg", header: "Avg Cost/Req", numeric: true, render: (r: typeof modelBreakdown[0]) => formatCost(r.avgCost), csvValue: (r: typeof modelBreakdown[0]) => r.avgCost },
            {
              key: "share",
              header: "Cost Share",
              render: (r: typeof modelBreakdown[0]) => {
                const pct = today.totalCost > 0 ? (r.cost / today.totalCost) * 100 : 0;
                return (
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <div className="db-progress" style={{ width: "80px" }}>
                      <div className="db-progress__bar" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="db-caption">{pct.toFixed(0)}%</span>
                  </div>
                );
              },
              csvValue: (r: typeof modelBreakdown[0]) => today.totalCost > 0 ? `${((r.cost / today.totalCost) * 100).toFixed(1)}%` : "0%",
            },
          ]}
          rows={modelBreakdown}
        />
      </div>
    </div>
  );
}
