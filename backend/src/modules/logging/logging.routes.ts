import { Router } from "express";
import { scanHistoryController, scanLogController } from "./scanLog.controller";
import { requireAuth } from "@core/middleware/auth.middleware";
import { asyncHandler } from "@core/utils/asyncHandler";

export const loggingRouter = Router();

// POST /log/scan — Feature 1, Stage 7 (opt-in). Requires auth so a scan
// can only ever be logged against the authenticated user, never spoofed.
loggingRouter.post("/scan", requireAuth, asyncHandler(scanLogController));

// GET /log/scans — the caller's own recent scans, newest first. Powers the
// history lists on Home and Analysis.
loggingRouter.get("/scans", requireAuth, asyncHandler(scanHistoryController));
