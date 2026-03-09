import { CsvExportButton } from "./CsvExportButton";

interface Column<T> {
  key: string;
  header: string;
  numeric?: boolean;
  render: (row: T) => React.ReactNode;
  csvValue?: (row: T) => string | number;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  rows: T[];
  exportFilename?: string;
}

function toCsv<T>(columns: Column<T>[], rows: T[]): string {
  const headers = columns.map((c) => c.header).join(",");
  const lines = rows.map((row) =>
    columns
      .map((col) => {
        const val = col.csvValue ? col.csvValue(row) : "";
        if (typeof val === "string" && (val.includes(",") || val.includes('"'))) {
          return `"${val.replace(/"/g, '""')}"`;
        }
        return val;
      })
      .join(",")
  );
  return [headers, ...lines].join("\n");
}

export function DataTable<T>({ columns, rows, exportFilename }: DataTableProps<T>) {
  const hasCsvValues = columns.some((c) => c.csvValue);
  const showExport = hasCsvValues && exportFilename && rows.length > 0;

  return (
    <div>
      {showExport && (
        <div style={{ display: "flex", justifyContent: "flex-end", padding: "0.5rem 0.75rem 0" }}>
          <CsvExportButton csv={toCsv(columns, rows)} filename={exportFilename} />
        </div>
      )}
      <div style={{ overflowX: "auto" }}>
        <table className="db-table">
          <thead>
            <tr>
              {columns.map((col) => (
                <th key={col.key} className={col.numeric ? "db-numeric" : ""}>{col.header}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={i}>
                {columns.map((col) => (
                  <td key={col.key} className={col.numeric ? "db-numeric" : ""}>{col.render(row)}</td>
                ))}
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={columns.length} style={{ textAlign: "center", padding: "2rem" }}>
                  No data available
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
