import { FilterBar } from "./FilterBar";

interface EmptyStateProps {
  reason: "no-data" | "no-results";
  pageTitle: string;
  availableModels?: string[];
  availableTeams?: string[];
  availableApps?: string[];
}

export function EmptyState({ reason, pageTitle, availableModels = [], availableTeams = [], availableApps = [] }: EmptyStateProps) {
  if (reason === "no-data" && availableModels.length === 0 && availableTeams.length === 0 && availableApps.length === 0) {
    return (
      <div>
        <div className="dashrock-page-header">
          <h1 className="db-heading-2">{pageTitle}</h1>
        </div>
        <div className="db-empty-state">
          <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>◉</div>
          <h2 className="db-heading-3">No data yet</h2>
          <p className="db-body">Waiting for the collector to run. It runs every hour and pulls from CloudWatch Logs.</p>
          <div className="db-alert db-alert--info" style={{ marginTop: "1rem" }}>
            Deploy the infrastructure with <span className="db-code">npx sst deploy</span> to start collecting data.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="dashrock-page-header">
        <h1 className="db-heading-2">{pageTitle}</h1>
      </div>
      <FilterBar availableModels={availableModels} availableTeams={availableTeams} availableApps={availableApps} />
      <div className="db-empty-state">
        <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>◎</div>
        <h2 className="db-heading-3">No results found</h2>
        <p className="db-body">No data matches the current filters. Try adjusting the date range or clearing filters.</p>
      </div>
    </div>
  );
}
