"use client";

import { BarChartJS } from "@/components/charts/BarChartJS";
import { DoughnutChart } from "@/components/charts/DoughnutChart";
import type { InvocationRecord, DailySummary } from "@/lib/types";

interface Props {
  invocations: InvocationRecord[];
  summary: DailySummary;
}

export function AdoptionCharts({ invocations, summary }: Props) {
  // Teams bar chart
  const teamEntries = Object.entries(summary.byTeam).sort((a, b) => b[1].count - a[1].count);
  const teamLabels = teamEntries.map(([name]) => name);
  const teamCounts = teamEntries.map(([, val]) => val.count);

  // Models doughnut
  const modelEntries = Object.entries(summary.byModel).sort((a, b) => b[1].count - a[1].count);
  const modelLabels = modelEntries.map(([name]) => name);
  const modelCounts = modelEntries.map(([, val]) => val.count);

  return (
    <div className="db-grid db-grid--2 db-gap-4">
      <div className="db-card">
        <div className="db-card__header">
          <h3 className="db-card__title">Invocations by Team</h3>
        </div>
        <BarChartJS
          labels={teamLabels}
          datasets={[{ label: "Invocations", data: teamCounts }]}
        />
      </div>
      <div className="db-card">
        <div className="db-card__header">
          <h3 className="db-card__title">Model Popularity</h3>
        </div>
        <DoughnutChart labels={modelLabels} data={modelCounts} />
      </div>
    </div>
  );
}
