"use client";

import { Doughnut } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";

ChartJS.register(ArcElement, Tooltip, Legend);

interface DoughnutChartProps {
  labels: string[];
  data: number[];
  formatValue?: (v: number) => string;
}

const COLORS = ["#3b82f6", "#22c55e", "#eab308", "#ef4444", "#a855f7", "#ec4899", "#06b6d4"];

export function DoughnutChart({ labels, data, formatValue }: DoughnutChartProps) {
  return (
    <div className="dashrock-chart-donut">
      <Doughnut
        data={{
          labels,
          datasets: [
            {
              data,
              backgroundColor: COLORS.slice(0, data.length),
              borderColor: "#141414",
              borderWidth: 2,
            },
          ],
        }}
        options={{
          responsive: true,
          maintainAspectRatio: false,
          cutout: "65%",
          plugins: {
            legend: {
              position: "bottom",
              labels: { color: "#a0a0a0", padding: 12, usePointStyle: true, font: { size: 11 } },
            },
            tooltip: {
              backgroundColor: "#1e1e1e",
              titleColor: "#ededed",
              bodyColor: "#a0a0a0",
              borderColor: "#2a2a2a",
              borderWidth: 1,
              padding: 10,
              cornerRadius: 8,
              callbacks: {
                label: (ctx) => {
                  const val = ctx.raw as number;
                  return ` ${ctx.label}: ${formatValue ? formatValue(val) : val}`;
                },
              },
            },
          },
        }}
      />
    </div>
  );
}
