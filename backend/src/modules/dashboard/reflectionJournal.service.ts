
import { getScanLogsForUser } from "@modules/logging/scanLog.service";
import type { ReflectionJournalEntry } from "./dashboard.types";

/**
 * Feature 3 — timeline of topics that tend to trigger a strong reaction
 * for this user. Pulled from the same log as the Echo Chamber Meter.
 */
export async function getReflectionJournal(userId: string): Promise<ReflectionJournalEntry[]> {
  const logs = await getScanLogsForUser(userId);

  const byTopic = new Map<string, ReflectionJournalEntry>();

  for (const log of logs) {
    if (!log.topic) continue;

    const existing = byTopic.get(log.topic);
    if (existing) {
      existing.occurrences += 1;
      if (log.createdAt > existing.lastTriggeredAt) {
        existing.lastTriggeredAt = log.createdAt;
      }
    } else {
      byTopic.set(log.topic, {
        topic: log.topic,
        occurrences: 1,
        lastTriggeredAt: log.createdAt,
      });
    }
  }

  return [...byTopic.values()].sort((a, b) => b.occurrences - a.occurrences);
}
