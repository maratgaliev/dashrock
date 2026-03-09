"use client";

import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

interface LineChartProps {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    color?: string;
    fill?: boolean;
  }[];
  yFormat?: (v: number) => string;
}

const COLORS = ["#3b82f6", "#22c55e", "#eab308", "#ef4444", "#a855f7", "#06b6d4"];

export function LineChart({ labels, datasets, yFormat }: LineChartProps) {
  return (
    <div className="dashrock-chart">
      <Line
        data={{
          labels,
          datasets: datasets.map((ds, i) => ({
            label: ds.label,
            data: ds.data,
            borderColor: ds.color || COLORS[i % COLORS.length],
            backgroundColor: (ds.color || COLORS[i % COLORS.length]) + "20",
            fill: ds.fill ?? true,
            tension: 0.3,
            pointRadius: 3,
            pointHoverRadius: 6,
          })),
        }}
        options={{
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
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
            },
            y: {
              grid: { color: "#2a2a2a" },
              ticks: {
                color: "#666",
                callback: yFormat ? (v) => yFormat(v as number) : undefined,
              },
            },
          },
        }}
      />
    </div>
  );
}
