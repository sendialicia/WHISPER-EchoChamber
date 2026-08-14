import { Router } from "express";
import {
  practiceTopicController,
  practiceExerciseController,
  practiceCompareController,
} from "./practice.controller";
import { rateLimit } from "@core/middleware/rateLimit.middleware";
import { requireAuth } from "@core/middleware/auth.middleware";
import { asyncHandler } from "@core/utils/asyncHandler";

export const practiceRouter = Router();

// GET /practice/topic — requires auth since it reads the user's scan history.
// userId comes from the verified token, not a URL param.
practiceRouter.get("/topic", requireAuth, asyncHandler(practiceTopicController));

// GET /practice/exercise?type=identify_framing — no auth needed, generic content
practiceRouter.get("/exercise", asyncHandler(practiceExerciseController));

// POST /practice/compare — no auth needed, doesn't touch personal data
practiceRouter.post("/compare", rateLimit(20, 60_000), asyncHandler(practiceCompareController));