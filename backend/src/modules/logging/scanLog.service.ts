import { pgPool } from "@db/postgresClient";
import type { ScanLogEntry } from "@db/models/scanLog.model";

/**
 * Feature 1, Stage 7 — opt-in scan logging, in Postgres alongside everything
 * else. This is the only input to the Echo Chamber Meter, the Reflection
 * Journal, and the source-diversity nudges.
 *
 * It used to live in a SQLite file next to the server, which was fine on a
 * laptop and wrong anywhere else: hosting platforms give a container an
 * ephemeral disk, so every deploy would have silently reset each user's
 * history back to zero.
 */

interface ScanLogRow {
  id: string;
  user_id: string;
  created_at: Date;
  source_text: string;
  source_url: string | null;
  mode: string;
  tactic: string | null;
  topic: string | null;
  side_shown: string | null;
}

function rowToEntry(row: ScanLogRow): ScanLogEntry {
  return {
    id: row.id,
    userId: row.user_id,
    createdAt: row.created_at.toISOString(),
    sourceText: row.source_text,
    sourceUrl: row.source_url ?? undefined,
    mode: row.mode as ScanLogEntry["mode"],
    tactic: row.tactic,
    topic: row.topic ?? undefined,
    sideShown: (row.side_shown as ScanLogEntry["sideShown"]) ?? undefined,
  };
}

export async function saveScanLog(entry: ScanLogEntry): Promise<void> {
  // id and created_at are left to their column defaults — the caller's values
  // come from the client, and the database is the better clock and id source.
  await pgPool.query(
    `INSERT INTO scan_logs (user_id, source_text, source_url, mode, tactic, topic, side_shown)
     VALUES ($1, $2, $3, $4, $5, $6, $7)`,
    [
      entry.userId,
      entry.sourceText,
      entry.sourceUrl ?? null,
      entry.mode,
      entry.tactic ?? null,
      entry.topic ?? null,
      entry.sideShown ?? null,
    ]
  );
}

export async function getScanLogsForUser(userId: string): Promise<ScanLogEntry[]> {
  const result = await pgPool.query<ScanLogRow>(
    `SELECT * FROM scan_logs WHERE user_id = $1 ORDER BY created_at DESC`,
    [userId]
  );

  return result.rows.map(rowToEntry);
}
