import "tsconfig-paths/register";
import { createApp } from "./app";
import { env } from "@core/config/env";
import { logger } from "@core/utils/logger";
import { ensurePostgresSchema } from "@db/postgresClient";

async function start() {
  await ensurePostgresSchema();

  const app = createApp();

  app.listen(env.PORT, () => {
    logger.info(`🚀 EchoBreaker backend running on http://localhost:${env.PORT}`);
    logger.info(`   LLM provider: ${env.LLM_PROVIDER}`);
  });
}

start();