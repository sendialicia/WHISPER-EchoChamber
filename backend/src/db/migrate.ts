import "tsconfig-paths/register";
import { ensurePostgresSchema, pgPool } from "@db/postgresClient";
import { logger } from "@core/utils/logger";

/**
 * Applies the schema once, then exits. This is what production uses instead of
 * doing it on boot, where a serverless host would repeat the work on every
 * cold start.
 */
async function migrate() {
  await ensurePostgresSchema();
  await pgPool.end();
  logger.info("Migration finished.");
}

migrate().catch((err) => {
  logger.error("Migration failed:", err);
  process.exit(1);
});
