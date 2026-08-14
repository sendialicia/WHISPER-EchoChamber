import { Router } from "express";
import { toneController } from "./tone.controller";
import { rateLimit } from "@core/middleware/rateLimit.middleware";
import { asyncHandler } from "@core/utils/asyncHandler";

export const toneRouter = Router();

// POST /tone/check — Feature 2. Called right before "Send" is tapped.
toneRouter.post("/check", rateLimit(60, 60_000), asyncHandler(toneController));