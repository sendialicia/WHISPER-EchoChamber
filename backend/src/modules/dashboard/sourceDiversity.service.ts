import { pgPool } from "@db/postgresClient";
import { getScanLogsForUser } from "@modules/logging/scanLog.service";
import type { SourceDiversityNudge } from "./dashboard.types";

interface DiverseReadRow {
  topic: string;
  reason: string;
  suggested_reading_title: string;
  suggested_reading_url: string;
}

function rowToNudge(row: DiverseReadRow): SourceDiversityNudge {
  return {
    topic: row.topic,
    reason: row.reason,
    suggestedReadingTitle: row.suggested_reading_title,
    suggestedReadingUrl: row.suggested_reading_url,
  };
}

/**
 * Feature 3 — for topics that recur often in a user's history (local
 * scan_logs, SQLite), look up diverse-perspective reading suggestions
 * from the shared `diverse_reads` table in Postgres/Supabase.
 */
export async function getSourceDiversityNudges(userId: string): Promise<SourceDiversityNudge[]> {
  const logs = await getScanLogsForUser(userId);

  const topicFrequency = new Map<string, number>();
  for (const log of logs) {
    if (!log.topic) continue;
    topicFrequency.set(log.topic, (topicFrequency.get(log.topic) ?? 0) + 1);
  }

  const recurringTopics = [...topicFrequency.entries()]
    .filter(([, count]) => count >= 3)
    .map(([topic]) => topic);

  if (recurringTopics.length === 0) return [];

  const result = await pgPool.query<DiverseReadRow>(
    "SELECT * FROM diverse_reads WHERE topic = ANY($1)",
    [recurringTopics]
  );

  return result.rows.map(rowToNudge);
}