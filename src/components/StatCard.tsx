interface StatCardProps {
  label: string;
  value: string | number;
  sub?: string;
  trend?: "up" | "down" | "neutral";
}

export function StatCard({ label, value, sub, trend }: StatCardProps) {
  const trendClass = trend === "up" ? "db-stat__change--up" : trend === "down" ? "db-stat__change--down" : "";
  const trendIcon = trend === "up" ? "↑" : trend === "down" ? "↓" : "";

  return (
    <div className="db-card db-raised">
      <div className="db-stat">
        <span className="db-stat__label">{label}</span>
        <span className="db-stat__value">{value}</span>
        {sub && (
          <span className={`db-stat__change ${trendClass}`}>
            {trendIcon} {sub}
          </span>
        )}
      </div>
    </div>
  );
}
