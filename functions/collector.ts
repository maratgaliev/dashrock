import {
  CloudWatchLogsClient,
  FilterLogEventsCommand,
} from "@aws-sdk/client-cloudwatch-logs";
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
} from "@aws-sdk/client-s3";

const logs = new CloudWatchLogsClient({ region: process.env.AWS_REGION_NAME });
const s3 = new S3Client({ region: process.env.AWS_REGION_NAME });
const BUCKET = process.env.DATA_BUCKET!;
const LOG_GROUP = process.env.LOG_GROUP!;

interface BedrockLogEvent {
  timestamp: string;
  accountId: string;
  region: string;
  requestId: string;
  operation: string;
  modelId: string;
  input: {
    inputContentType: string;
    inputTokenCount: number;
    inputBodyJson?: Record<string, unknown>;
  };
  output: {
    outputContentType: string;
    outputTokenCount: number;
    outputBodyJson?: Record<string, unknown>;
  };
  identity: {
    arn: string;
  };
  schemaType: string;
  schemaVersion: string;
}

interface InvocationRecord {
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

interface Config {
  teams: Record<string, string[]>;
  apps: Record<string, string[]>;
  pricing: Record<string, { input: number; output: number }>;
}

const DEFAULT_PRICING: Config["pricing"] = {
  "claude-3-haiku-20240307": { input: 0.00025, output: 0.00125 },
  "claude-3-5-haiku-20241022": { input: 0.0008, output: 0.004 },
  "claude-3-5-sonnet-20240620": { input: 0.003, output: 0.015 },
  "claude-3-5-sonnet-20241022": { input: 0.003, output: 0.015 },
  "claude-sonnet-4-20250514": { input: 0.003, output: 0.015 },
  "claude-opus-4-20250514": { input: 0.015, output: 0.075 },
  "claude-haiku-4-5-20251001": { input: 0.0008, output: 0.004 },
  "amazon.titan-text-lite-v1": { input: 0.00015, output: 0.0002 },
  "amazon.titan-text-express-v1": { input: 0.0002, output: 0.0006 },
};

async function loadConfig(): Promise<Config> {
  try {
    const cmd = new GetObjectCommand({ Bucket: BUCKET, Key: "config.yaml" });
    const result = await s3.send(cmd);
    const body = await result.Body?.transformToString();
    if (body) {
      const { parse } = await import("yaml");
      const parsed = parse(body);
      return {
        teams: parsed.teams || {},
        apps: parsed.apps || {},
        pricing: { ...DEFAULT_PRICING, ...(parsed.pricing || {}) },
      };
    }
  } catch {
    console.log("No config.yaml found in S3, using defaults");
  }
  return { teams: {}, apps: {}, pricing: DEFAULT_PRICING };
}

function extractModelName(modelId: string): string {
  const parts = modelId.split("/");
  const id = parts[parts.length - 1];
  return id
    .replace(/^us\./, "")
    .replace(/^anthropic\./, "")
    .replace(/^amazon\./, "")
    .replace(/^meta\./, "")
    .replace(/-v\d+:\d+$/, "");
}

function resolveTeam(arn: string, config: Config): string {
  for (const [team, arns] of Object.entries(config.teams)) {
    if (arns.includes(arn)) return team;
  }
  const parts = arn.split("/");
  return parts[parts.length - 1] || "unknown";
}

function resolveApp(arn: string, config: Config): string {
  for (const [app, arns] of Object.entries(config.apps)) {
    if (arns.includes(arn)) return app;
  }
  return "unknown";
}

function calculateCost(
  modelName: string,
  inputTokens: number,
  outputTokens: number,
  config: Config
): { costInput: number; costOutput: number; costTotal: number } {
  const pricing = config.pricing[modelName];
  if (!pricing) {
    return { costInput: 0, costOutput: 0, costTotal: 0 };
  }
  const costInput = (inputTokens / 1000) * pricing.input;
  const costOutput = (outputTokens / 1000) * pricing.output;
  return { costInput, costOutput, costTotal: costInput + costOutput };
}

async function fetchLogs(
  startTime: number,
  endTime: number
): Promise<BedrockLogEvent[]> {
  const events: BedrockLogEvent[] = [];
  let nextToken: string | undefined;

  do {
    const cmd = new FilterLogEventsCommand({
      logGroupName: LOG_GROUP,
      startTime,
      endTime,
      nextToken,
    });
    const result = await logs.send(cmd);

    for (const event of result.events || []) {
      if (event.message) {
        try {
          events.push(JSON.parse(event.message));
        } catch {
          // skip malformed events
        }
      }
    }
    nextToken = result.nextToken;
  } while (nextToken);

  return events;
}

function processEvents(
  events: BedrockLogEvent[],
  config: Config
): InvocationRecord[] {
  return events.map((e) => {
    const modelName = extractModelName(e.modelId);
    const costs = calculateCost(
      modelName,
      e.input?.inputTokenCount || 0,
      e.output?.outputTokenCount || 0,
      config
    );

    return {
      timestamp: e.timestamp,
      requestId: e.requestId,
      modelId: e.modelId,
      modelName,
      operation: e.operation,
      inputTokens: e.input?.inputTokenCount || 0,
      outputTokens: e.output?.outputTokenCount || 0,
      identityArn: e.identity?.arn || "unknown",
      team: resolveTeam(e.identity?.arn || "", config),
      app: resolveApp(e.identity?.arn || "", config),
      region: e.region,
      latencyMs: null,
      statusCode: 200,
      ...costs,
    };
  });
}

interface DailyAggregate {
  date: string;
  lastUpdated: string;
  invocations: InvocationRecord[];
  summary: {
    totalInvocations: number;
    totalInputTokens: number;
    totalOutputTokens: number;
    totalCost: number;
    byModel: Record<string, { count: number; inputTokens: number; outputTokens: number; cost: number }>;
    byTeam: Record<string, { count: number; inputTokens: number; outputTokens: number; cost: number }>;
    byApp: Record<string, { count: number; inputTokens: number; outputTokens: number; cost: number }>;
  };
}

function buildSummary(records: InvocationRecord[]): DailyAggregate["summary"] {
  const summary: DailyAggregate["summary"] = {
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
      if (!bucket[key]) {
        bucket[key] = { count: 0, inputTokens: 0, outputTokens: 0, cost: 0 };
      }
      bucket[key].count += 1;
      bucket[key].inputTokens += r.inputTokens;
      bucket[key].outputTokens += r.outputTokens;
      bucket[key].cost += r.costTotal;
    }
  }

  return summary;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function getExistingAggregate(key: string): Promise<any | null> {
  try {
    const cmd = new GetObjectCommand({ Bucket: BUCKET, Key: key });
    const result = await s3.send(cmd);
    const body = await result.Body?.transformToString();
    return body ? JSON.parse(body) : null;
  } catch {
    return null;
  }
}

export async function handler() {
  const config = await loadConfig();
  const now = new Date();
  const endTime = now.getTime();
  const startTime = endTime - 65 * 60 * 1000;

  console.log(`Fetching logs from ${new Date(startTime).toISOString()} to ${new Date(endTime).toISOString()}`);

  const events = await fetchLogs(startTime, endTime);
  console.log(`Fetched ${events.length} events`);

  if (events.length === 0) {
    console.log("No events found, skipping");
    return { statusCode: 200, body: "No events" };
  }

  const records = processEvents(events, config);

  // Write raw hourly data
  const hourKey = `raw/${now.getUTCFullYear()}/${String(now.getUTCMonth() + 1).padStart(2, "0")}/${String(now.getUTCDate()).padStart(2, "0")}/${String(now.getUTCHours()).padStart(2, "0")}/invocations.json`;
  await s3.send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: hourKey,
      Body: JSON.stringify(records, null, 2),
      ContentType: "application/json",
    })
  );
  console.log(`Wrote raw data to ${hourKey}`);

  // Update daily aggregate
  const dateStr = now.toISOString().split("T")[0];
  const dailyKey = `aggregates/daily/${dateStr}.json`;
  const existing = await getExistingAggregate(dailyKey);

  const allRecords = existing ? [...existing.invocations] : [];
  const existingIds = new Set(allRecords.map((r: InvocationRecord) => r.requestId));
  for (const r of records) {
    if (!existingIds.has(r.requestId)) {
      allRecords.push(r);
      existingIds.add(r.requestId);
    }
  }

  const dailyAggregate: DailyAggregate = {
    date: dateStr,
    lastUpdated: now.toISOString(),
    invocations: allRecords,
    summary: buildSummary(allRecords),
  };

  await s3.send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: dailyKey,
      Body: JSON.stringify(dailyAggregate, null, 2),
      ContentType: "application/json",
    })
  );
  console.log(`Updated daily aggregate: ${dailyKey}`);

  // Update monthly aggregate
  const monthStr = dateStr.substring(0, 7);
  const monthlyKey = `aggregates/monthly/${monthStr}.json`;
  const monthlyExisting = await getExistingAggregate(monthlyKey);

  const monthlySummary = monthlyExisting
    ? { ...monthlyExisting, days: { ...monthlyExisting.days } }
    : { month: monthStr, lastUpdated: "", days: {} as Record<string, DailyAggregate["summary"]> };

  monthlySummary.days[dateStr] = dailyAggregate.summary;
  monthlySummary.lastUpdated = now.toISOString();

  await s3.send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: monthlyKey,
      Body: JSON.stringify(monthlySummary, null, 2),
      ContentType: "application/json",
    })
  );
  console.log(`Updated monthly aggregate: ${monthlyKey}`);

  // Write latest summary
  const latestKey = "aggregates/latest.json";
  await s3.send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: latestKey,
      Body: JSON.stringify(
        {
          lastUpdated: now.toISOString(),
          today: dailyAggregate.summary,
          recentInvocations: allRecords.slice(-50),
        },
        null,
        2
      ),
      ContentType: "application/json",
    })
  );
  console.log("Updated latest.json");

  return {
    statusCode: 200,
    body: `Processed ${records.length} new events, ${allRecords.length} total today`,
  };
}
