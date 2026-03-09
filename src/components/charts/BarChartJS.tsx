"use client";

import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

interface BarChartJSProps {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    color?: string;
  }[];
  horizontal?: boolean;
  yFormat?: (v: number) => string;
  stacked?: boolean;
}

const COLORS = ["#3b82f6", "#22c55e", "#eab308", "#ef4444", "#a855f7", "#06b6d4"];

export function BarChartJS({ labels, datasets, horizontal, yFormat, stacked }: BarChartJSProps) {
  return (
    <div className="dashrock-chart">
      <Bar
        data={{
          labels,
          datasets: datasets.map((ds, i) => ({
            label: ds.label,
            data: ds.data,
            backgroundColor: (ds.color || COLORS[i % COLORS.length]) + "cc",
            borderColor: ds.color || COLORS[i % COLORS.length],
            borderWidth: 1,
            borderRadius: 4,
          })),
        }}
        options={{
          responsive: true,
          maintainAspectRatio: false,
          indexAxis: horizontal ? "y" : "x",
          plugins: {
            legend: {
              display: datasets.length > 1,
              position: "bottom",
              labels: { color: "#a0a0a0", padding: 16, usePointStyle: true },
            },
            tooltip: {
              backgroundColor: "#1e1e1e",
              titleColor: "#ededed",
              bodyColor: "#a0a0a0",
              borderColor: "#2a2a2a",
              borderWidth: 1,
              padding: 12,
              cornerRadius: 8,
            },
          },
          scales: {
            x: {
              grid: { color: "#2a2a2a" },
              ticks: { color: "#666" },
              stacked: stacked,
            },
            y: {
              grid: { color: "#2a2a2a" },
              ticks: {
                color: "#666",
                callback: yFormat ? (v) => yFormat(v as number) : undefined,
              },
              stacked: stacked,
            },
          },
        }}
      />
    </div>
  );
}
