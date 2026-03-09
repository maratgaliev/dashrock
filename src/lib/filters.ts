import type { InvocationRecord, DailySummary } from "./types";
import { getLatest, getDateRange, mergeSummaries } from "./data";

export interface FilterParams {
  from?: string;
  to?: string;
  model?: string[];
  team?: string[];
  app?: string[];
}

export function parseSearchParams(
  searchParams: Record<string, string | string[] | undefined>
): FilterParams {
  const toArray = (v: string | string[] | undefined): string[] => {
    if (!v) return [];
    return Array.isArray(v) ? v : [v];
  };

  return {
    from: typeof searchParams.from === "string" ? searchParams.from : undefined,
    to: typeof searchParams.to === "string" ? searchParams.to : undefined,
    model: toArray(searchParams.model),
    team: toArray(searchParams.team),
    app: toArray(searchParams.app),
  };
}

function filterInvocations(
  invocations: InvocationRecord[],
  filters: FilterParams
): InvocationRecord[] {
  return invocations.filter((r) => {
    if (filters.model && filters.model.length > 0 && !filters.model.includes(r.modelName)) return false;
    if (filters.team && filters.team.length > 0 && !filters.team.includes(r.team)) return false;
    if (filters.app && filters.app.length > 0 && !filters.app.includes(r.app)) return false;
    return true;
  });
}

function buildSummaryFromRecords(records: InvocationRecord[]): DailySummary {
  const summary: DailySummary = {
    totalInvocations: records.length,
    totalInputTokens: 0,
    totalOutputTokens: 0,
    totalCost: 0,
    byModel: {},
    byTeam: {},
    byApp: {},
  };

  for (const r of records) {
    summary.totalInputTokens += r.inputTokens;
    summary.totalOutputTokens += r.outputTokens;
    summary.totalCost += r.costTotal;

    for (const [key, field] of [
      [r.modelName, "byModel"],
      [r.team, "byTeam"],
      [r.app, "byApp"],
    ] as const) {
      const bucket = summary[field as "byModel" | "byTeam" | "byApp"];
      if (!bucket[key]) bucket[key] = { count: 0, inputTokens: 0, outputTokens: 0, cost: 0 };
      bucket[key].count++;
      bucket[key].inputTokens += r.inputTokens;
      bucket[key].outputTokens += r.outputTokens;
      bucket[key].cost += r.costTotal;
    }
  }

  return summary;
}

export interface FilteredData {
  summary: DailySummary;
  invocations: InvocationRecord[];
  lastUpdated: string;
  availableModels: string[];
  availableTeams: string[];
  availableApps: string[];
  isDateRange: boolean;
  /** "no-data" = no data collected at all; "no-results" = filters matched nothing */
  emptyReason?: "no-data" | "no-results";
}

const EMPTY_SUMMARY: DailySummary = {
  totalInvocations: 0, totalInputTokens: 0, totalOutputTokens: 0, totalCost: 0,
  byModel: {}, byTeam: {}, byApp: {},
};

export async function getFilteredData(filters: FilterParams): Promise<FilteredData> {
  const hasDateRange = filters.from && filters.to;
  const hasFilters = hasDateRange || (filters.model && filters.model.length > 0) || (filters.team && filters.team.length > 0) || (filters.app && filters.app.length > 0);

  let allInvocations: InvocationRecord[];
  let lastUpdated: string;

  if (hasDateRange) {
    const dailies = await getDateRange(filters.from!, filters.to!);
    if (dailies.length === 0) {
      return {
        summary: EMPTY_SUMMARY, invocations: [], lastUpdated: "",
        availableModels: [], availableTeams: [], availableApps: [],
        isDateRange: true,
        emptyReason: hasFilters ? "no-results" : "no-data",
      };
    }
    allInvocations = dailies.flatMap((d) => d.invocations);
    lastUpdated = dailies[dailies.length - 1].lastUpdated;
  } else {
    const latest = await getLatest();
    if (!latest) {
      return {
        summary: EMPTY_SUMMARY, invocations: [], lastUpdated: "",
        availableModels: [], availableTeams: [], availableApps: [],
        isDateRange: false,
        emptyReason: "no-data",
      };
    }
    allInvocations = latest.recentInvocations;
    lastUpdated = latest.lastUpdated;
  }

  // Extract available filter options BEFORE filtering (so dropdowns show all options)
  const availableModels = [...new Set(allInvocations.map((r) => r.modelName))].sort();
  const availableTeams = [...new Set(allInvocations.map((r) => r.team))].sort();
  const availableApps = [...new Set(allInvocations.map((r) => r.app))].sort();

  // Apply filters
  const filtered = filterInvocations(allInvocations, filters);
  const summary = buildSummaryFromRecords(filtered);

  return {
    summary,
    invocations: filtered,
    lastUpdated,
    availableModels,
    availableTeams,
    availableApps,
    isDateRange: !!hasDateRange,
    emptyReason: filtered.length === 0 ? "no-results" : undefined,
  };
}

/** Get daily breakdowns for trends chart (respects model/team/app filters) */
export async function getDailyTrends(
  filters: FilterParams
): Promise<{ date: string; summary: DailySummary }[] | null> {
  const from = filters.from || defaultFrom();
  const to = filters.to || defaultTo();

  const dailies = await getDateRange(from, to);
  if (dailies.length === 0) return null;

  return dailies.map((d) => {
    const filtered = filterInvocations(d.invocations, filters);
    return {
      date: d.date,
      summary: buildSummaryFromRecords(filtered),
    };
  });
}

function defaultFrom(): string {
  const d = new Date();
  d.setDate(d.getDate() - 30);
  return d.toISOString().split("T")[0];
}

function defaultTo(): string {
  return new Date().toISOString().split("T")[0];
}
