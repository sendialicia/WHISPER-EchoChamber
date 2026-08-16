import "tsconfig-paths/register";
import { createApp } from "./createApp";
import { env } from "@core/config/env";
import { logger } from "@core/utils/logger";
import { ensurePostgresSchema } from "@db/postgresClient";

/**
 * Local entrypoint only — `npm run dev` and `npm start` on a laptop.
 *
 * Named away from `server.ts` on purpose. Vercel picks its entrypoint by
 * looking for an app at a handful of well-known filenames, `src/server.ts`
 * and `src/app.ts` among them, and choosing one of those over the root
 * `index.js` leaves it holding either a bare `createApp` function or a file
 * whose only job is to open a port. Neither is a request handler.
 *
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
