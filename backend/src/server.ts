import "tsconfig-paths/register";
import { createApp } from "./app";
import { env } from "@core/config/env";
import { logger } from "@core/utils/logger";
import { ensurePostgresSchema } from "@db/postgresClient";

/**
 * Applying the schema on boot is convenient locally and wasteful in
 * production: a serverless host boots this on every cold start, so the DDL
 * would run again and again against a database that already has it. Off by
 * default there, run once with `npm run migrate` after a schema change.
 */
async function start() {
  if (env.MIGRATE_ON_BOOT) {
    await ensurePostgresSchema();
  }

  const app = createApp();

  app.listen(env.PORT, () => {
    logger.info(`🚀 GEMA backend running on port ${env.PORT}`);
    logger.info(`   LLM provider: ${env.LLM_PROVIDER}`);
  });
}

start();
