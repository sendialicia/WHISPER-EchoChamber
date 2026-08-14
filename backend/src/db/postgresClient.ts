import { Pool } from "pg";
import { env } from "@core/config/env";
import { logger } from "@core/utils/logger";

/**
 * Postgres (Supabase) — for SHARED, centralized data that's the same for
 * every user: exercises, and later topics / diverse-reading suggestions.
 *
 * Personal/per-user data (scan logs, journal) stays in local SQLite —
 * see db/client.ts — since that's what should stay on-device per the
 * app's privacy-first design.
 *
 * Setup:
 * 1. Create a free project at https://supabase.com
 * 2. Project Settings -> Database -> Connection string -> URI
 *    (use the "Connection pooling" string if available, port 6543)
 * 3. Paste it into DATABASE_URL in your .env
 */
export const pgPool = new Pool({
  connectionString: env.DATABASE_URL,
  // Supabase requires SSL; rejectUnauthorized:false is the common setting
  // for Supabase's pooled connection since it uses a shared cert chain.
  ssl: env.DATABASE_URL?.includes("supabase") ? { rejectUnauthorized: false } : undefined,
});

pgPool.on("error", (err) => {
  logger.error("Unexpected Postgres pool error", err);
});

/**
 * Creates the `exercises` table if it doesn't exist yet. Call once on
 * server startup (see server.ts) or run manually via `npm run migrate`.
 */
export async function ensurePostgresSchema(): Promise<void> {
  if (!env.DATABASE_URL) {
    logger.warn("DATABASE_URL not set — skipping Postgres schema setup. Exercise/topic/diverse-read endpoints will fail until it's configured.");
    return;
  }

  try {
    try {
      await pgPool.query(`CREATE EXTENSION IF NOT EXISTS pgcrypto;`);
    } catch (err) {
      logger.warn("Could not create pgcrypto extension (may already exist or lack permission) — continuing.", err);
    }

    await pgPool.query(`
      CREATE TABLE IF NOT EXISTS exercises (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        type TEXT NOT NULL,
        prompt TEXT NOT NULL,
        options JSONB NOT NULL,
        correct_option_index INTEGER NOT NULL,
        explanation TEXT NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now()
      );

      CREATE INDEX IF NOT EXISTS idx_exercises_type ON exercises (type);

      CREATE TABLE IF NOT EXISTS topics (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        topic TEXT NOT NULL,
        position_a TEXT NOT NULL,
        position_b TEXT NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now()
      );

      CREATE TABLE IF NOT EXISTS diverse_reads (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        topic TEXT NOT NULL,
        reason TEXT NOT NULL,
        suggested_reading_title TEXT NOT NULL,
        suggested_reading_url TEXT NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now()
      );

      CREATE INDEX IF NOT EXISTS idx_diverse_reads_topic ON diverse_reads (topic);
    `);

    logger.info("Postgres schema ready (exercises, topics, diverse_reads tables).");
  } catch (err) {
    // Don't crash the whole server if Postgres is unreachable or
    // DATABASE_URL is malformed — Scan/Tone (Gemini + local SQLite) should
    // keep working even if the Supabase-backed features can't.
    logger.error(
      "Failed to set up Postgres schema — exercise/topic/diverse-read endpoints will fail until DATABASE_URL is fixed.",
      err
    );
  }
}