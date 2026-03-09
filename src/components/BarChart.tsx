interface BarChartItem {
  label: string;
  value: number;
  color?: string;
}

const COLORS = ["#3b82f6", "#22c55e", "#eab308", "#ef4444", "#a855f7", "#ec4899", "#06b6d4"];

export function BarChart({ items, formatValue }: { items: BarChartItem[]; formatValue?: (v: number) => string }) {
  const max = Math.max(...items.map((i) => i.value), 1);
  const fmt = formatValue || ((v: number) => v.toLocaleString());

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
      {items.map((item, idx) => (
        <div key={item.label}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.25rem", fontSize: "0.85rem" }}>
            <span>{item.label}</span>
            <span style={{ opacity: 0.7 }}>{fmt(item.value)}</span>
          </div>
          <div className="db-progress">
            <div
              className="db-progress__bar"
              style={{
                width: `${(item.value / max) * 100}%`,
                background: item.color || COLORS[idx % COLORS.length],
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
