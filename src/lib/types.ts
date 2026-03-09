export interface InvocationRecord {
  timestamp: string;
  requestId: string;
  modelId: string;
  modelName: string;
  operation: string;
  inputTokens: number;
  outputTokens: number;
  identityArn: string;
  team: string;
  app: string;
  region: string;
  latencyMs: number | null;
  statusCode: number;
  costInput: number;
  costOutput: number;
  costTotal: number;
}

export interface AggregationBucket {
  count: number;
  inputTokens: number;
  outputTokens: number;
  cost: number;
}

export interface DailySummary {
  totalInvocations: number;
  totalInputTokens: number;
  totalOutputTokens: number;
  totalCost: number;
  byModel: Record<string, AggregationBucket>;
  byTeam: Record<string, AggregationBucket>;
  byApp: Record<string, AggregationBucket>;
}

export interface DailyAggregate {
  date: string;
  lastUpdated: string;
  invocations: InvocationRecord[];
  summary: DailySummary;
}

export interface MonthlyAggregate {
  month: string;
  lastUpdated: string;
  days: Record<string, DailySummary>;
}

export interface LatestData {
  lastUpdated: string;
  today: DailySummary;
  recentInvocations: InvocationRecord[];
}
