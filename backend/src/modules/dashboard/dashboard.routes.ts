import { Router } from "express";
import {
  echoChamberMeterController,
  sourceDiversityController,
  reflectionJournalController,
} from "./dashboard.controller";
import { requireAuth } from "@core/middleware/auth.middleware";
import { asyncHandler } from "@core/utils/asyncHandler";

export const dashboardRouter = Router();

dashboardRouter.use(requireAuth);

// GET /dashboard/echo-chamber-meter — userId comes from the verified token, not the URL
dashboardRouter.get("/echo-chamber-meter", asyncHandler(echoChamberMeterController));

// GET /dashboard/source-diversity
dashboardRouter.get("/source-diversity", asyncHandler(sourceDiversityController));

// GET /dashboard/reflection-journal
dashboardRouter.get("/reflection-journal", asyncHandler(reflectionJournalController));