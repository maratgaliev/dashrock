"use client";

import { LineChart } from "@/components/charts/LineChart";
import { BarChartJS } from "@/components/charts/BarChartJS";
import { DoughnutChart } from "@/components/charts/DoughnutChart";
import type { InvocationRecord, DailySummary } from "@/lib/types";

interface Props {
  invocations: InvocationRecord[];
  summary: DailySummary;
}

export function PerformanceCharts({ invocations, summary }: Props) {
  // Latency over time
  const hourlyLatency: Record<string, { total: number; count: number }> = {};
  for (let h = 0; h < 24; h++) {
    hourlyLatency[`${h.toString().padStart(2, "0")}:00`] = { total: 0, count: 0 };
  }
  for (const inv of invocations) {
    if (inv.latencyMs) {
      const hour = new Date(inv.timestamp).getHours();
      const key = `${hour.toString().padStart(2, "0")}:00`;
      hourlyLatency[key].total += inv.latencyMs;
      hourlyLatency[key].count++;
    }
  }
  const hours = Object.keys(hourlyLatency);
  const avgLatencies = hours.map((h) => {
    const d = hourlyLatency[h];
    return d.count > 0 ? Math.round(d.total / d.count) : 0;
  });

  // Requests per hour (throughput)
  const hourlyCount: Record<string, number> = {};
  for (let h = 0; h < 24; h++) {
    hourlyCount[`${h.toString().padStart(2, "0")}:00`] = 0;
  }
  for (const inv of invocations) {
    const hour = new Date(inv.timestamp).getHours();
    const key = `${hour.toString().padStart(2, "0")}:00`;
    hourlyCount[key]++;
  }

  // Latency by model
  const modelLatency: Record<string, { total: number; count: number }> = {};
  for (const inv of invocations) {
    if (inv.latencyMs) {
      if (!modelLatency[inv.modelName]) modelLatency[inv.modelName] = { total: 0, count: 0 };
      modelLatency[inv.modelName].total += inv.latencyMs;
      modelLatency[inv.modelName].count++;
    }
  }
  const modelEntries = Object.entries(modelLatency).sort((a, b) => (b[1].total / b[1].count) - (a[1].total / a[1].count));

  // Request size distribution
  const sizeBuckets = [
    { label: "< 100", min: 0, max: 100 },
    { label: "100-500", min: 100, max: 500 },
    { label: "500-1K", min: 500, max: 1000 },
    { label: "1K-5K", min: 1000, max: 5000 },
    { label: "5K+", min: 5000, max: Infinity },
  ];
  const sizeData = sizeBuckets.map((b) =>
    invocations.filter((r) => r.inputTokens >= b.min && r.inputTokens < b.max).length
  );

  return (
    <>
      <div className="db-grid db-grid--2 db-gap-4" style={{ marginBottom: "1.5rem" }}>
        <div className="db-card">
          <div className="db-card__header">
            <h3 className="db-card__title">Avg Latency Over Time</h3>
          </div>
          <LineChart
            labels={hours}
            datasets={[{ label: "Avg Latency (ms)", data: avgLatencies, color: "#ef4444" }]}
            yFormat={(v) => `${v}ms`}
          />
        </div>
        <div className="db-card">
          <div className="db-card__header">
            <h3 className="db-card__title">Throughput (Requests/Hour)</h3>
          </div>
          <LineChart
            labels={hours}
            datasets={[{ label: "Requests", data: hours.map((h) => hourlyCount[h]), color: "#3b82f6", fill: true }]}
          />
        </div>
      </div>

      <div className="db-grid db-grid--3 db-gap-4">
        <div className="db-card">
          <div className="db-card__header">
            <h3 className="db-card__title">Avg Latency by Model</h3>
          </div>
          <BarChartJS
            labels={modelEntries.map(([name]) => name)}
            datasets={[{
              label: "Avg Latency (ms)",
              data: modelEntries.map(([, v]) => Math.round(v.total / v.count)),
              color: "#a855f7",
            }]}
            horizontal
            yFormat={(v) => `${v}ms`}
          />
        </div>
        <div className="db-card">
          <div className="db-card__header">
            <h3 className="db-card__title">Request Size Distribution</h3>
          </div>
          <BarChartJS
            labels={sizeBuckets.map((b) => b.label)}
            datasets={[{ label: "Requests", data: sizeData, color: "#06b6d4" }]}
          />
        </div>
        <div className="db-card">
          <div className="db-card__header">
            <h3 className="db-card__title">Status Codes</h3>
          </div>
          <DoughnutChart
            labels={[
              "200 OK",
              ...Object.keys(
                invocations
                  .filter((r) => r.statusCode !== 200)
                  .reduce((acc, r) => ({ ...acc, [r.statusCode]: true }), {} as Record<number, boolean>)
              ).map((code) => `${code} Error`),
            ]}
            data={[
              invocations.filter((r) => r.statusCode === 200).length,
              ...Object.entries(
                invocations
                  .filter((r) => r.statusCode !== 200)
                  .reduce((acc, r) => ({ ...acc, [r.statusCode]: (acc[r.statusCode] || 0) + 1 }), {} as Record<number, number>)
              ).map(([, count]) => count),
            ]}
          />
        </div>
      </div>
    </>
  );
}
