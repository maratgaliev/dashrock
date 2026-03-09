"use client";

import { LineChart } from "@/components/charts/LineChart";
import { BarChartJS } from "@/components/charts/BarChartJS";
import { formatCost, formatTokens } from "@/lib/format";
import type { DailySummary } from "@/lib/types";

interface Props {
  days: { date: string; summary: DailySummary }[];
}

export function TrendsCharts({ days }: Props) {
  const labels = days.map((d) => d.date.slice(5)); // MM-DD
  const invocations = days.map((d) => d.summary.totalInvocations);
  const costs = days.map((d) => d.summary.totalCost);
  const inputTokens = days.map((d) => d.summary.totalInputTokens);
  const outputTokens = days.map((d) => d.summary.totalOutputTokens);

  // Cost by team over time - aggregate across all days
  const allTeams = new Set<string>();
  for (const d of days) {
    for (const team of Object.keys(d.summary.byTeam)) allTeams.add(team);
  }
  const teamNames = [...allTeams].sort();
  const teamTotals = teamNames.map((team) =>
    days.reduce((sum, d) => sum + (d.summary.byTeam[team]?.cost || 0), 0)
  );

  return (
    <>
      <div className="db-grid db-grid--2 db-gap-4" style={{ marginBottom: "1.5rem" }}>
        <div className="db-card">
          <div className="db-card__header">
            <h3 className="db-card__title">Daily Invocations</h3>
          </div>
          <LineChart
            labels={labels}
            datasets={[{ label: "Invocations", data: invocations, color: "#3b82f6" }]}
          />
        </div>
        <div className="db-card">
          <div className="db-card__header">
            <h3 className="db-card__title">Daily Cost</h3>
          </div>
          <LineChart
            labels={labels}
            datasets={[{ label: "Cost ($)", data: costs, color: "#eab308" }]}
            yFormat={formatCost}
          />
        </div>
      </div>

      <div className="db-grid db-grid--2 db-gap-4">
        <div className="db-card">
          <div className="db-card__header">
            <h3 className="db-card__title">Daily Token Usage</h3>
          </div>
          <LineChart
            labels={labels}
            datasets={[
              { label: "Input Tokens", data: inputTokens, color: "#3b82f6" },
              { label: "Output Tokens", data: outputTokens, color: "#22c55e" },
            ]}
            yFormat={formatTokens}
          />
        </div>
        <div className="db-card">
          <div className="db-card__header">
            <h3 className="db-card__title">Cost by Team (Period Total)</h3>
          </div>
          <BarChartJS
            labels={teamNames}
            datasets={[{ label: "Cost", data: teamTotals, color: "#ef4444" }]}
            horizontal
            yFormat={formatCost}
          />
        </div>
      </div>
    </>
  );
}
