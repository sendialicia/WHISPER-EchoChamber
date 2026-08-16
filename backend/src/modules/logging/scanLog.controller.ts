import type { Request, Response } from "express";
import { z } from "zod";
import { randomUUID } from "crypto";
import { getRecentScanLogs, saveScanLog } from "./scanLog.service";

// userId is intentionally NOT in this schema — it comes from the verified
// token (req.userId), never trusted from the request body.
const logSchema = z.object({
  sourceText: z.string(),
  sourceUrl: z.string().url().optional(),
  mode: z.enum(["both_sides", "fact_context"]),
  tactic: z.string().nullable(),
  topic: z.string().optional(),
  sideShown: z.enum(["a", "b"]).optional(),
});

export async function scanLogController(req: Request, res: Response) {
  const parsed = logSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "invalid_request", details: parsed.error.flatten() });
  }

  await saveScanLog({
    id: randomUUID(),
    userId: req.userId!,
    createdAt: new Date().toISOString(),
    ...parsed.data,
  });

  res.status(201).json({ status: "logged" });
}

/** How many scans a history list shows before "View All" is needed. */
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

const listSchema = z.object({
  limit: z.coerce.number().int().min(1).max(MAX_LIMIT).default(DEFAULT_LIMIT),
});

export async function scanHistoryController(req: Request, res: Response) {
  const parsed = listSchema.safeParse(req.query);
  if (!parsed.success) {
    return res.status(400).json({ error: "invalid_request", details: parsed.error.flatten() });
  }

  // userId comes from the verified token, so this can only ever return the
  // caller's own history.
  const scans = await getRecentScanLogs(req.userId!, parsed.data.limit);
  res.json(scans);
}
