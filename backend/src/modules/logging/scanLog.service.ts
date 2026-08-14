import { db } from "@db/client";
import type { ScanLogEntry } from "@db/models/scanLog.model";

/**
 * Feature 1, Stage 7 — opt-in scan logging, now backed by real local
 * SQLite (see db/client.ts). This is what powers the Echo Chamber Meter,
 * Reflection Journal, and Practice's topic bank.
 *
 * NOTE: for a real on-device-first mobile app, this table would live on
 * the client (SQLite in React Native) rather than a backend server file —
 * this backend-side version is a solid stand-in for development and for
 * the future opt-in cloud sync path.
 */

const insertStmt = db.prepare(`
  INSERT INTO scan_logs (id, userId, createdAt, sourceText, sourceUrl, mode, tactic, topic, sideShown)
  VALUES (@id, @userId, @createdAt, @sourceText, @sourceUrl, @mode, @tactic, @topic, @sideShown)
`);

const selectByUserStmt = db.prepare(`
  SELECT * FROM scan_logs WHERE userId = ? ORDER BY createdAt DESC
`);

export async function saveScanLog(entry: ScanLogEntry): Promise<void> {
  insertStmt.run({
    id: entry.id,
    userId: entry.userId,
    createdAt: entry.createdAt,
    sourceText: entry.sourceText,
    sourceUrl: entry.sourceUrl ?? null,
    mode: entry.mode,
    tactic: entry.tactic ?? null,
    topic: entry.topic ?? null,
    sideShown: entry.sideShown ?? null,
  });
}

export async function getScanLogsForUser(userId: string): Promise<ScanLogEntry[]> {
  const rows = selectByUserStmt.all(userId) as any[];

  return rows.map((row) => ({
    id: row.id,
    userId: row.userId,
    createdAt: row.createdAt,
    sourceText: row.sourceText,
    sourceUrl: row.sourceUrl ?? undefined,
    mode: row.mode,
    tactic: row.tactic ?? null,
    topic: row.topic ?? undefined,
    sideShown: row.sideShown ?? undefined,
  }));
}
