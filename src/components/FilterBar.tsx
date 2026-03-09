"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Suspense, useCallback, useState, useRef, useEffect } from "react";

interface FilterBarProps {
  availableModels?: string[];
  availableTeams?: string[];
  availableApps?: string[];
}

function MultiSelect({
  label,
  options,
  selected,
  onChange,
}: {
  label: string;
  options: string[];
  selected: string[];
  onChange: (values: string[]) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const toggle = (val: string) => {
    onChange(
      selected.includes(val)
        ? selected.filter((v) => v !== val)
        : [...selected, val]
    );
  };

  if (options.length === 0) return null;

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button
        className={`db-btn db-btn--sm ${selected.length > 0 ? "" : "db-btn--ghost"}`}
        onClick={() => setOpen(!open)}
        type="button"
      >
        {label}
        {selected.length > 0 && (
          <span className="db-badge" style={{ marginLeft: "0.25rem" }}>
            {selected.length}
          </span>
        )}
      </button>
      {open && (
        <div
          className="db-card db-raised"
          style={{
            position: "absolute",
            top: "calc(100% + 4px)",
            left: 0,
            zIndex: 50,
            minWidth: "200px",
            maxHeight: "280px",
            overflowY: "auto",
            padding: "0.5rem",
          }}
        >
          {selected.length > 0 && (
            <button
              className="db-btn db-btn--sm db-btn--ghost"
              style={{ width: "100%", marginBottom: "0.25rem" }}
              onClick={() => onChange([])}
              type="button"
            >
              Clear all
            </button>
          )}
          {options.map((opt) => (
            <label
              key={opt}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                padding: "0.35rem 0.5rem",
                cursor: "pointer",
                borderRadius: "4px",
                fontSize: "0.85rem",
              }}
            >
              <input
                type="checkbox"
                checked={selected.includes(opt)}
                onChange={() => toggle(opt)}
              />
              {opt}
            </label>
          ))}
        </div>
      )}
    </div>
  );
}

export function FilterBar(props: FilterBarProps) {
  return (
    <Suspense fallback={<div className="db-card" style={{ marginBottom: "1.5rem", padding: "0.75rem 1rem", height: "48px" }} />}>
      <FilterBarInner {...props} />
    </Suspense>
  );
}

function FilterBarInner({ availableModels = [], availableTeams = [], availableApps = [] }: FilterBarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const startDate = searchParams.get("from") || "";
  const endDate = searchParams.get("to") || "";
  const selectedModels = searchParams.getAll("model");
  const selectedTeams = searchParams.getAll("team");
  const selectedApps = searchParams.getAll("app");

  const hasFilters = startDate || endDate || selectedModels.length > 0 || selectedTeams.length > 0 || selectedApps.length > 0;

  const updateParams = useCallback(
    (updates: Record<string, string | string[] | null>) => {
      const params = new URLSearchParams(searchParams.toString());

      for (const [key, value] of Object.entries(updates)) {
        params.delete(key);
        if (value === null) continue;
        if (Array.isArray(value)) {
          for (const v of value) params.append(key, v);
        } else if (value) {
          params.set(key, value);
        }
      }

      router.push(`${pathname}?${params.toString()}`);
    },
    [router, pathname, searchParams]
  );

  const clearAll = () => {
    router.push(pathname);
  };

  const activeChips = [
    ...selectedModels.map((v) => ({ key: `m-${v}`, label: v, remove: () => updateParams({ model: selectedModels.filter((x) => x !== v) }) })),
    ...selectedTeams.map((v) => ({ key: `t-${v}`, label: v, remove: () => updateParams({ team: selectedTeams.filter((x) => x !== v) }) })),
    ...selectedApps.map((v) => ({ key: `a-${v}`, label: v, remove: () => updateParams({ app: selectedApps.filter((x) => x !== v) }) })),
  ];

  return (
    <div className="db-card" style={{ marginBottom: "1.5rem", padding: "0.75rem 1rem" }}>
      {/* Controls row */}
      <div className="filter-controls">
        {/* Date range */}
        <div className="filter-dates">
          <span className="db-caption" style={{ marginRight: "0.25rem" }}>From</span>
          <input
            type="date"
            className="db-input db-input--sm"
            value={startDate}
            onChange={(e) => updateParams({ from: e.target.value || null })}
            style={{ colorScheme: "dark", fontSize: "0.8rem" }}
          />
          <span className="db-caption">to</span>
          <input
            type="date"
            className="db-input db-input--sm"
            value={endDate}
            onChange={(e) => updateParams({ to: e.target.value || null })}
            style={{ colorScheme: "dark", fontSize: "0.8rem" }}
          />
        </div>

        {/* Multi-selects */}
        <div className="filter-selects">
          <MultiSelect
            label="Model"
            options={availableModels}
            selected={selectedModels}
            onChange={(vals) => updateParams({ model: vals.length > 0 ? vals : null })}
          />
          <MultiSelect
            label="Team"
            options={availableTeams}
            selected={selectedTeams}
            onChange={(vals) => updateParams({ team: vals.length > 0 ? vals : null })}
          />
          <MultiSelect
            label="App"
            options={availableApps}
            selected={selectedApps}
            onChange={(vals) => updateParams({ app: vals.length > 0 ? vals : null })}
          />

          {hasFilters && (
            <button className="db-btn db-btn--sm db-btn--ghost" onClick={clearAll} type="button">
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Active chips row — only shown when filters are active */}
      {activeChips.length > 0 && (
        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginTop: "0.5rem", paddingTop: "0.5rem", borderTop: "1px solid #2a2a2a" }}>
          {activeChips.map((chip) => (
            <span key={chip.key} className="db-chip" style={{ cursor: "pointer" }} onClick={chip.remove}>
              {chip.label} ×
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
