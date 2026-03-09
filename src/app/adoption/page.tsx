import { formatNumber, formatTokens } from "@/lib/format";
import { parseSearchParams, getFilteredData } from "@/lib/filters";
import { FilterBar } from "@/components/FilterBar";
import { EmptyState } from "@/components/EmptyState";
import { StatCard } from "@/components/StatCard";
import { DataTable } from "@/components/DataTable";
import { AdoptionCharts } from "./adoption-charts";

export const dynamic = "force-dynamic";

interface Props {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function AdoptionPage({ searchParams }: Props) {
  const filters = parseSearchParams(await searchParams);
  const data = await getFilteredData(filters);

  if (data.emptyReason) {
    return <EmptyState reason={data.emptyReason} pageTitle="AI Adoption" availableModels={data.availableModels} availableTeams={data.availableTeams} availableApps={data.availableApps} />;
  }

  const { summary: today, invocations: recentInvocations, availableModels, availableTeams, availableApps } = data;

  const teams = Object.entries(today.byTeam).sort((a, b) => b[1].count - a[1].count);
  const apps = Object.entries(today.byApp).sort((a, b) => b[1].count - a[1].count);
  const models = Object.entries(today.byModel).sort((a, b) => b[1].count - a[1].count);
  const uniqueUsers = new Set(recentInvocations.map((r) => r.identityArn));

  return (
    <div>
      <div className="dashrock-page-header">
        <h1 className="db-heading-2">AI Adoption</h1>
        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
          {models.map(([name]) => (
            <span key={name} className="db-chip">{name}</span>
          ))}
        </div>
      </div>

      <FilterBar availableModels={availableModels} availableTeams={availableTeams} availableApps={availableApps} />

      <div className="db-grid db-grid--4 db-gap-4" style={{ marginBottom: "1.5rem" }}>
        <StatCard label="Active Teams" value={teams.length} trend="up" sub="using Bedrock" />
        <StatCard label="Active Apps" value={apps.filter(([k]) => k !== "unknown").length} />
        <StatCard label="Models Used" value={models.length} />
        <StatCard label="Unique Users" value={uniqueUsers.size} />
      </div>

      <AdoptionCharts invocations={recentInvocations} summary={today} />

      <div className="db-card" style={{ marginTop: "1.5rem" }}>
        <div className="db-card__header">
          <h3 className="db-card__title">Team Activity</h3>
        </div>
        <DataTable
          exportFilename="dashrock-team-activity.csv"
          columns={[
            {
              key: "team",
              header: "Team",
              render: (r: { name: string; count: number; tokens: number; users: number }) => (
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <div className="db-avatar db-avatar--sm">{r.name.slice(0, 2).toUpperCase()}</div>
                  <strong>{r.name}</strong>
                </div>
              ),
              csvValue: (r: { name: string }) => r.name,
            },
            { key: "invocations", header: "Invocations", numeric: true, render: (r: { name: string; count: number; tokens: number; users: number }) => formatNumber(r.count), csvValue: (r: { count: number }) => r.count },
            { key: "tokens", header: "Total Tokens", numeric: true, render: (r: { name: string; count: number; tokens: number; users: number }) => formatTokens(r.tokens), csvValue: (r: { tokens: number }) => r.tokens },
            {
              key: "activity",
              header: "Activity",
              render: (r: { name: string; count: number; tokens: number; users: number }) => {
                const maxCount = Math.max(...teams.map(([, v]) => v.count));
                const pct = maxCount > 0 ? (r.count / maxCount) * 100 : 0;
                return (
                  <div className="db-progress" style={{ width: "120px" }}>
                    <div className="db-progress__bar" style={{ width: `${pct}%` }} />
                  </div>
                );
              },
            },
          ]}
          rows={teams.map(([name, val]) => ({
            name,
            count: val.count,
            tokens: val.inputTokens + val.outputTokens,
            users: new Set(recentInvocations.filter((r) => r.team === name).map((r) => r.identityArn)).size,
          }))}
        />
      </div>

      <div className="db-card" style={{ marginTop: "1.5rem" }}>
        <div className="db-card__header">
          <h3 className="db-card__title">Applications Using Bedrock</h3>
        </div>
        <DataTable
          exportFilename="dashrock-apps.csv"
          columns={[
            { key: "app", header: "Application", render: (r: { name: string; count: number; tokens: number; models: string[] }) => <span className="db-badge">{r.name}</span>, csvValue: (r: { name: string }) => r.name },
            { key: "invocations", header: "Invocations", numeric: true, render: (r: { name: string; count: number; tokens: number; models: string[] }) => formatNumber(r.count), csvValue: (r: { count: number }) => r.count },
            { key: "tokens", header: "Total Tokens", numeric: true, render: (r: { name: string; count: number; tokens: number; models: string[] }) => formatTokens(r.tokens), csvValue: (r: { tokens: number }) => r.tokens },
            {
              key: "models",
              header: "Models Used",
              render: (r: { name: string; count: number; tokens: number; models: string[] }) => (
                <div style={{ display: "flex", gap: "0.25rem", flexWrap: "wrap" }}>
                  {r.models.map((m) => <span key={m} className="db-chip" style={{ fontSize: "0.7rem" }}>{m}</span>)}
                </div>
              ),
              csvValue: (r: { models: string[] }) => r.models.join("; "),
            },
          ]}
          rows={apps.map(([name, val]) => ({
            name,
            count: val.count,
            tokens: val.inputTokens + val.outputTokens,
            models: [...new Set(recentInvocations.filter((r) => r.app === name).map((r) => r.modelName))],
          }))}
        />
      </div>
    </div>
  );
}
