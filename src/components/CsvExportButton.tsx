"use client";

interface CsvExportButtonProps {
  csv: string;
  filename: string;
}

export function CsvExportButton({ csv, filename }: CsvExportButtonProps) {
  return (
    <button
      className="db-btn db-btn--sm db-btn--ghost"
      onClick={() => {
        const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
      }}
      type="button"
    >
      Export CSV
    </button>
  );
}
