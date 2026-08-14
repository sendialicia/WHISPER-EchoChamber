import { getScanLogsForUser } from "@modules/logging/scanLog.service";
import type { EchoChamberMeterResult } from "./dashboard.types";

/**
 * Feature 3 — aggregates locally-stored scan history to show how
 * one-sided the user's consumption has been. No LLM calls — pure
 * aggregation over Feature 1's logged output (sideShown field).
 */
export async function computeEchoChamberMeter(userId: string): Promise<EchoChamberMeterResult> {
  const logs = await getScanLogsForUser(userId);

  if (logs.length === 0) {
    return { skewScore: 0, dominantSide: null, topicsCovered: 0 };
  }

  const sideCounts: Record<string, number> = {};
  for (const log of logs) {
    if (log.sideShown) {
      sideCounts[log.sideShown] = (sideCounts[log.sideShown] ?? 0) + 1;
    }
  }

  const entries = Object.entries(sideCounts);
  const total = entries.reduce((sum, [, count]) => sum + count, 0);
  const [dominantSide, dominantCount] = entries.sort((a, b) => b[1] - a[1])[0] ?? [null, 0];

  const skewScore = total > 0 ? dominantCount / total : 0;
  const topicsCovered = new Set(logs.map((l) => l.topic).filter(Boolean)).size;

  return { skewScore, dominantSide: dominantSide ?? null, topicsCovered };
}
