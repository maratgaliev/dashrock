"use client";

import { LineChart } from "@/components/charts/LineChart";
import { BarChartJS } from "@/components/charts/BarChartJS";
import { DoughnutChart } from "@/components/charts/DoughnutChart";
import { formatCost } from "@/lib/format";
import type { InvocationRecord, DailySummary } from "@/lib/types";

interface Props {
  invocations: InvocationRecord[];
  summary: DailySummary;
}

export function CostCharts({ invocations, summary }: Props) {
  // Hourly cost trend
  const hourlyCost: Record<string, number> = {};
  for (let h = 0; h < 24; h++) {
    hourlyCost[`${h.toString().padStart(2, "0")}:00`] = 0;
  }
  for (const inv of invocations) {
    const hour = new Date(inv.timestamp).getHours();
    const key = `${hour.toString().padStart(2, "0")}:00`;
    hourlyCost[key] = (hourlyCost[key] || 0) + inv.costTotal;
  }
  const hours = Object.keys(hourlyCost);

  // Cost by team - bar chart
  const teamEntries = Object.entries(summary.byTeam).sort((a, b) => b[1].cost - a[1].cost);

  // Cost by app - doughnut
  const appEntries = Object.entries(summary.byApp).sort((a, b) => b[1].cost - a[1].cost);

  return (
    <>
      <div className="db-grid db-grid--3 db-gap-4">
        <div className="db-card">
          <div className="db-card__header">
            <h3 className="db-card__title">Cost Over Time</h3>
          </div>
          <LineChart
            labels={hours}
            datasets={[{ label: "Cost ($)", data: hours.map((h) => hourlyCost[h]), color: "#eab308" }]}
            yFormat={formatCost}
          />
        </div>
        <div className="db-card">
          <div className="db-card__header">
            <h3 className="db-card__title">Cost by Team</h3>
          </div>
          <BarChartJS
            labels={teamEntries.map(([name]) => name)}
            datasets={[{ label: "Cost", data: teamEntries.map(([, v]) => v.cost), color: "#ef4444" }]}
            horizontal
            yFormat={formatCost}
          />
        </div>
        <div className="db-card">
          <div className="db-card__header">
            <h3 className="db-card__title">Cost by Application</h3>
          </div>
          <DoughnutChart
            labels={appEntries.map(([name]) => name)}
            data={appEntries.map(([, v]) => v.cost)}
            formatValue={formatCost}
          />
        </div>
      </div>
    </>
  );
}
