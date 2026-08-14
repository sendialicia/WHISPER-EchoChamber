import { Router } from "express";
import { triageController } from "./triage.controller";
import { analyzeController } from "./analyze.controller";
import { rateLimit } from "@core/middleware/rateLimit.middleware";
import { asyncHandler } from "@core/utils/asyncHandler";

export const scanRouter = Router();

// POST /scan/triage — Feature 1, Stage (b)
scanRouter.post("/triage", rateLimit(60, 60_000), asyncHandler(triageController));

// POST /scan/analyze — Feature 1, Stages (c) + (d). Only called after
// triage passes — the client (or an internal check) should gate this.
scanRouter.post("/analyze", rateLimit(30, 60_000), asyncHandler(analyzeController));