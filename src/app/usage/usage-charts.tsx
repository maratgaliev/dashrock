"use client";

import { LineChart } from "@/components/charts/LineChart";
import { BarChartJS } from "@/components/charts/BarChartJS";
import { formatTokens } from "@/lib/format";
import type { InvocationRecord, DailySummary } from "@/lib/types";

interface Props {
  invocations: InvocationRecord[];
  summary: DailySummary;
}

export function UsageCharts({ invocations, summary }: Props) {
  // Hourly token breakdown (input vs output)
  const hourlyInput: Record<string, number> = {};
  const hourlyOutput: Record<string, number> = {};
  for (let h = 0; h < 24; h++) {
    const key = `${h.toString().padStart(2, "0")}:00`;
    hourlyInput[key] = 0;
    hourlyOutput[key] = 0;
  }
  for (const inv of invocations) {
    const hour = new Date(inv.timestamp).getHours();
    const key = `${hour.toString().padStart(2, "0")}:00`;
    hourlyInput[key] = (hourlyInput[key] || 0) + inv.inputTokens;
    hourlyOutput[key] = (hourlyOutput[key] || 0) + inv.outputTokens;
  }
  const hours = Object.keys(hourlyInput);

  // Tokens by model - stacked bar
  const modelEntries = Object.entries(summary.byModel).sort((a, b) => (b[1].inputTokens + b[1].outputTokens) - (a[1].inputTokens + a[1].outputTokens));
  const modelLabels = modelEntries.map(([name]) => name);

  return (
    <div className="db-grid db-grid--2 db-gap-4">
      <div className="db-card">
        <div className="db-card__header">
          <h3 className="db-card__title">Token Usage Over Time</h3>
        </div>
        <LineChart
          labels={hours}
          datasets={[
            { label: "Input Tokens", data: hours.map((h) => hourlyInput[h]), color: "#3b82f6" },
            { label: "Output Tokens", data: hours.map((h) => hourlyOutput[h]), color: "#22c55e" },
          ]}
          yFormat={formatTokens}
        />
      </div>
      <div className="db-card">
        <div className="db-card__header">
          <h3 className="db-card__title">Tokens by Model</h3>
        </div>
        <BarChartJS
          labels={modelLabels}
          datasets={[
            { label: "Input", data: modelEntries.map(([, v]) => v.inputTokens), color: "#3b82f6" },
            { label: "Output", data: modelEntries.map(([, v]) => v.outputTokens), color: "#22c55e" },
          ]}
          stacked
          yFormat={formatTokens}
        />
      </div>
    </div>
  );
}
