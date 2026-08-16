import { Pool } from "pg";
import { env } from "@core/config/env";
import { logger } from "@core/utils/logger";

/**
 * Postgres (Supabase) — the only database.
 *
 * Both the shared content banks (exercises, topics, diverse reads) and the
 * personal one (scan_logs) live here. Scan logs used to sit in a SQLite file
 * beside the server, which worked on a laptop and would have quietly failed
 * anywhere else: a hosting platform gives the container an ephemeral disk, so
 * every deploy would have reset each user's history to zero.
 *
 * What genuinely stays on-device is a shorter list — the practice streak,
 * bookmarks, and the display name — and none of it goes through here.
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
 * Creates every table if it doesn't exist yet, and makes sure row level
 * security is on. Called once on server startup — see server.ts.
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

      -- Every scan a user opted to keep. This is the only table holding
      -- personal data, and the sole input to the Echo Chamber Meter, the
      -- Reflection Journal, and the source-diversity nudges.
      CREATE TABLE IF NOT EXISTS scan_logs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        source_text TEXT NOT NULL,
        source_url TEXT,
        mode TEXT NOT NULL,
        tactic TEXT,
        topic TEXT,
        side_shown TEXT
      );

      -- The dashboard always reads one user's rows newest-first.
      CREATE INDEX IF NOT EXISTS idx_scan_logs_user_created
        ON scan_logs (user_id, created_at DESC);

      CREATE INDEX IF NOT EXISTS idx_scan_logs_topic ON scan_logs (topic);
    `);

    // Row level security on every table, with no policies attached.
    //
    // Supabase exposes public tables through PostgREST, and the anon key that
    // reaches it is embedded in the app — so without this, anyone holding the
    // APK could read every user's scan history straight from the REST
    // endpoint. Enabling RLS with no policy denies that path outright. The
    // backend is unaffected: it connects as the owning role, which bypasses
    // RLS, and it is the only thing that should be touching these tables.
    await pgPool.query(`
      ALTER TABLE scan_logs ENABLE ROW LEVEL SECURITY;
      ALTER TABLE topics ENABLE ROW LEVEL SECURITY;
      ALTER TABLE exercises ENABLE ROW LEVEL SECURITY;
      ALTER TABLE diverse_reads ENABLE ROW LEVEL SECURITY;
    `);

    logger.info(
      "Postgres schema ready (scan_logs, exercises, topics, diverse_reads; RLS on)."
    );
  } catch (err) {
    // Don't crash the whole server if Postgres is unreachable or
    // DATABASE_URL is malformed — Scan and Tone are Gemini-only and should
    // keep working even if the Supabase-backed features can't.
    logger.error(
      "Failed to set up Postgres schema — exercise/topic/diverse-read endpoints will fail until DATABASE_URL is fixed.",
      err
    );
  }
}