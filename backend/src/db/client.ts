import Database from "better-sqlite3";
import path from "path";
import { logger } from "@core/utils/logger";

/**
 * Local SQLite database — for PERSONAL, per-user data only
 * (scan logs, journal). Zero setup, no cloud account needed.
 * File lives at the project root as `echobreaker.db` (gitignored).
 *
 * Shared/centralized data (exercises, topics, diverse reads — same for
 * every user) lives in Postgres/Supabase instead — see postgresClient.ts.
 * That split matters if you ever deploy this backend to multiple
 * instances: SQLite here is per-instance and won't sync across servers,
 * which is fine for personal data (each user's device/session owns its
 * own log) but wrong for shared content banks.
 */
const dbPath = path.resolve(__dirname, "../../echobreaker.db");
export const db = new Database(dbPath);

db.pragma("journal_mode = WAL");

db.exec(`
  CREATE TABLE IF NOT EXISTS scan_logs (
    id TEXT PRIMARY KEY,
    userId TEXT NOT NULL,
    createdAt TEXT NOT NULL,
    sourceText TEXT NOT NULL,
    sourceUrl TEXT,
    mode TEXT NOT NULL,
    tactic TEXT,
    topic TEXT,
    sideShown TEXT
  );

  CREATE INDEX IF NOT EXISTS idx_scan_logs_userId ON scan_logs (userId);
`);

logger.info(`SQLite DB ready at ${dbPath}`);