"use client";

import { LineChart } from "@/components/charts/LineChart";
import { DoughnutChart } from "@/components/charts/DoughnutChart";
import { formatTokens, formatCost } from "@/lib/format";
import type { InvocationRecord, DailySummary } from "@/lib/types";

interface Props {
  invocations: InvocationRecord[];
  summary: DailySummary;
}

export function OverviewCharts({ invocations, summary }: Props) {
  // Group invocations by hour for time series
  const hourlyData: Record<string, { count: number; tokens: number; cost: number }> = {};
  for (let h = 0; h < 24; h++) {
    const key = `${h.toString().padStart(2, "0")}:00`;
    hourlyData[key] = { count: 0, tokens: 0, cost: 0 };
  }
  for (const inv of invocations) {
    const hour = new Date(inv.timestamp).getHours();
    const key = `${hour.toString().padStart(2, "0")}:00`;
    if (hourlyData[key]) {
      hourlyData[key].count++;
      hourlyData[key].tokens += inv.inputTokens + inv.outputTokens;
      hourlyData[key].cost += inv.costTotal;
    }
  }

  const hours = Object.keys(hourlyData);
  const invocationCounts = hours.map((h) => hourlyData[h].count);
  const tokenCounts = hours.map((h) => hourlyData[h].tokens);

  // Model distribution for doughnut
  const modelEntries = Object.entries(summary.byModel).sort((a, b) => b[1].count - a[1].count);
  const modelLabels = modelEntries.map(([name]) => name);
  const modelCounts = modelEntries.map(([, val]) => val.count);

  // Cost distribution for doughnut
  const teamEntries = Object.entries(summary.byTeam).sort((a, b) => b[1].cost - a[1].cost);
  const teamLabels = teamEntries.map(([name]) => name);
  const teamCosts = teamEntries.map(([, val]) => val.cost);

  return (
    <>
      <div className="db-grid db-grid--2 db-gap-4" style={{ marginBottom: "1.5rem" }}>
        <div className="db-card">
          <div className="db-card__header">
            <h3 className="db-card__title">Invocations Over Time</h3>
          </div>
          <LineChart
            labels={hours}
            datasets={[{ label: "Invocations", data: invocationCounts, color: "#3b82f6" }]}
          />
        </div>
        <div className="db-card">
          <div className="db-card__header">
            <h3 className="db-card__title">Token Usage Over Time</h3>
          </div>
          <LineChart
            labels={hours}
            datasets={[{ label: "Tokens", data: tokenCounts, color: "#22c55e" }]}
            yFormat={formatTokens}
          />
        </div>
      </div>

      <div className="db-grid db-grid--2 db-gap-4">
        <div className="db-card">
          <div className="db-card__header">
            <h3 className="db-card__title">Model Distribution</h3>
          </div>
          <DoughnutChart labels={modelLabels} data={modelCounts} />
        </div>
        <div className="db-card">
          <div className="db-card__header">
            <h3 className="db-card__title">Cost by Team</h3>
          </div>
          <DoughnutChart labels={teamLabels} data={teamCosts} formatValue={formatCost} />
        </div>
      </div>
    </>
  );
}
