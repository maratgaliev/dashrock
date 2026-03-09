import { S3Client, GetObjectCommand, ListObjectsV2Command } from "@aws-sdk/client-s3";
import type { DailyAggregate, MonthlyAggregate, LatestData, DailySummary } from "./types";

const BUCKET = process.env.DATA_BUCKET || "";

const s3 = BUCKET ? new S3Client({ region: process.env.AWS_REGION_NAME || "us-east-2" }) : null;

async function getJson<T>(key: string): Promise<T | null> {
  if (!s3) return null;
  try {
    const result = await s3.send(new GetObjectCommand({ Bucket: BUCKET, Key: key }));
    const body = await result.Body?.transformToString();
    return body ? JSON.parse(body) : null;
  } catch {
    return null;
  }
}

export async function getLatest(): Promise<LatestData | null> {
  return getJson<LatestData>("aggregates/latest.json");
}

export async function getDailyAggregate(date: string): Promise<DailyAggregate | null> {
  return getJson<DailyAggregate>(`aggregates/daily/${date}.json`);
}

export async function getMonthlyAggregate(month: string): Promise<MonthlyAggregate | null> {
  return getJson<MonthlyAggregate>(`aggregates/monthly/${month}.json`);
}

export async function getDateRange(startDate: string, endDate: string): Promise<DailyAggregate[]> {
  const results: DailyAggregate[] = [];
  const start = new Date(startDate);
  const end = new Date(endDate);

  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const dateStr = d.toISOString().split("T")[0];
    const data = await getDailyAggregate(dateStr);
    if (data) results.push(data);
  }

  return results;
}

export async function getAvailableDates(): Promise<string[]> {
  if (!s3) return [];
  try {
    const result = await s3.send(
      new ListObjectsV2Command({
        Bucket: BUCKET,
        Prefix: "aggregates/daily/",
        Delimiter: "/",
      })
    );
    return (result.Contents || [])
      .map((obj) => obj.Key?.replace("aggregates/daily/", "").replace(".json", "") || "")
      .filter(Boolean)
      .sort();
  } catch {
    return [];
  }
}

export function mergeSummaries(summaries: DailySummary[]): DailySummary {
  const merged: DailySummary = {
    totalInvocations: 0,
    totalInputTokens: 0,
    totalOutputTokens: 0,
    totalCost: 0,
    byModel: {},
    byTeam: {},
    byApp: {},
  };

  for (const s of summaries) {
    merged.totalInvocations += s.totalInvocations;
    merged.totalInputTokens += s.totalInputTokens;
    merged.totalOutputTokens += s.totalOutputTokens;
    merged.totalCost += s.totalCost;

    for (const groupKey of ["byModel", "byTeam", "byApp"] as const) {
      for (const [key, val] of Object.entries(s[groupKey])) {
        if (!merged[groupKey][key]) {
          merged[groupKey][key] = { count: 0, inputTokens: 0, outputTokens: 0, cost: 0 };
        }
        merged[groupKey][key].count += val.count;
        merged[groupKey][key].inputTokens += val.inputTokens;
        merged[groupKey][key].outputTokens += val.outputTokens;
        merged[groupKey][key].cost += val.cost;
      }
    }
  }

  return merged;
}
