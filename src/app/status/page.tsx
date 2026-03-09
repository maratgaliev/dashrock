import { getLatest, getAvailableDates } from "@/lib/data";

export const dynamic = "force-dynamic";

function FreshnessIndicator({ lastUpdated }: { lastUpdated: string }) {
  const ageMs = Date.now() - new Date(lastUpdated).getTime();
  const ageHours = ageMs / (1000 * 60 * 60);

  let color: string;
  let label: string;

  if (ageHours < 2) {
    color = "#22c55e";
    label = "Fresh";
  } else if (ageHours < 6) {
    color = "#eab308";
    label = "Stale";
  } else {
    color = "#ef4444";
    label = "Outdated";
  }

  return (
    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
      <div style={{ width: 10, height: 10, borderRadius: "50%", background: color }} />
      <span>{label}</span>
    </div>
  );
}

export default async function StatusPage() {
  const latest = await getLatest();
  const dates = await getAvailableDates();

  const lastUpdated = latest?.lastUpdated || null;
  const todayCount = latest?.today.totalInvocations || 0;
  const hasData = !!latest;

  const ageStr = lastUpdated
    ? `${Math.round((Date.now() - new Date(lastUpdated).getTime()) / (1000 * 60))} minutes ago`
    : "Never";

  return (
    <div>
      <div className="dashrock-page-header">
        <h1 className="db-heading-2">System Status</h1>
      </div>

      <div className="db-grid db-grid--2 db-gap-4" style={{ marginBottom: "1.5rem" }}>
        {/* Collector Health */}
        <div className="db-card">
          <div className="db-card__header">
            <h3 className="db-card__title">Collector</h3>
          </div>
          <div style={{ padding: "1rem" }}>
            <table className="db-table">
              <tbody>
                <tr>
                  <td><strong>Status</strong></td>
                  <td>
                    {hasData ? (
                      <span className="db-badge db-badge--new">Connected</span>
                    ) : (
                      <span className="db-badge db-badge--error">No Data</span>
                    )}
                  </td>
                </tr>
                <tr>
                  <td><strong>Last Run</strong></td>
                  <td>
                    {lastUpdated ? (
                      <div>
                        <div>{new Date(lastUpdated).toLocaleString()}</div>
                        <span className="db-caption">{ageStr}</span>
                      </div>
                    ) : (
                      <span className="db-caption">Never</span>
                    )}
                  </td>
                </tr>
                <tr>
                  <td><strong>Data Freshness</strong></td>
                  <td>
                    {lastUpdated ? (
                      <FreshnessIndicator lastUpdated={lastUpdated} />
                    ) : (
                      <span className="db-caption">N/A</span>
                    )}
                  </td>
                </tr>
                <tr>
                  <td><strong>Schedule</strong></td>
                  <td>Every hour (EventBridge)</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Data Summary */}
        <div className="db-card">
          <div className="db-card__header">
            <h3 className="db-card__title">Data Storage</h3>
          </div>
          <div style={{ padding: "1rem" }}>
            <table className="db-table">
              <tbody>
                <tr>
                  <td><strong>Events Today</strong></td>
                  <td>{todayCount.toLocaleString()}</td>
                </tr>
                <tr>
                  <td><strong>Available Days</strong></td>
                  <td>{dates.length}</td>
                </tr>
                <tr>
                  <td><strong>Earliest Data</strong></td>
                  <td>{dates.length > 0 ? dates[0] : "None"}</td>
                </tr>
                <tr>
                  <td><strong>Latest Data</strong></td>
                  <td>{dates.length > 0 ? dates[dates.length - 1] : "None"}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Infrastructure */}
      <div className="db-card">
        <div className="db-card__header">
          <h3 className="db-card__title">Infrastructure Components</h3>
        </div>
        <div style={{ padding: "1rem" }}>
          <table className="db-table">
            <thead>
              <tr>
                <th>Component</th>
                <th>Type</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Collector Lambda</td>
                <td>AWS Lambda (Node.js 20)</td>
                <td>
                  {hasData ? (
                    <span className="db-badge db-badge--new">Active</span>
                  ) : (
                    <span className="db-badge">Unknown</span>
                  )}
                </td>
              </tr>
              <tr>
                <td>Data Bucket (S3)</td>
                <td>AWS S3</td>
                <td>
                  {hasData ? (
                    <span className="db-badge db-badge--new">Connected</span>
                  ) : (
                    <span className="db-badge db-badge--error">Unreachable</span>
                  )}
                </td>
              </tr>
              <tr>
                <td>Dashboard</td>
                <td>Next.js (CloudFront + Lambda)</td>
                <td><span className="db-badge db-badge--new">Running</span></td>
              </tr>
              <tr>
                <td>EventBridge Schedule</td>
                <td>AWS EventBridge</td>
                <td>
                  {hasData ? (
                    <span className="db-badge db-badge--new">Active</span>
                  ) : (
                    <span className="db-badge">Unknown</span>
                  )}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {!hasData && (
        <div className="db-alert db-alert--warning" style={{ marginTop: "1.5rem" }}>
          No data has been collected yet. Make sure you have deployed the infrastructure with{" "}
          <span className="db-code">npx sst deploy</span> and that your Bedrock invocation logging is enabled.
        </div>
      )}
    </div>
  );
}
