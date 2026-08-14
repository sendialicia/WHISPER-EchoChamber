import express from "express";
import cors from "cors";
import { scanRouter } from "@modules/scan/scan.routes";
import { toneRouter } from "@modules/tone/tone.routes";
import { dashboardRouter } from "@modules/dashboard/dashboard.routes";
import { practiceRouter } from "@modules/practice/practice.routes";
import { loggingRouter } from "@modules/logging/logging.routes";
import { errorHandler } from "@core/middleware/errorHandler.middleware";

export function createApp() {
  const app = express();

  app.use(cors());
  app.use(express.json({ limit: "1mb" }));

  app.get("/health", (_req, res) => res.json({ status: "ok" }));

  // Feature 1: Scan & Context [Person A]
  app.use("/scan", scanRouter);

  // Feature 1, Stage 7: opt-in logging [Person A]
  app.use("/log", loggingRouter);

  // Feature 2: Tone Check Before Reply [Person B]
  app.use("/tone", toneRouter);

  // Feature 3: Dashboard [Person B]
  app.use("/dashboard", dashboardRouter);

  // Feature 4: Practice [Person B, compare.service calls shared llmClient]
  app.use("/practice", practiceRouter);

  // Keep this mounted last — catches errors from all routes above.
  app.use(errorHandler);

  return app;
}
