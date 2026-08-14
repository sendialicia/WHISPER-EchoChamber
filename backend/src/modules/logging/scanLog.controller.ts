import type { Request, Response } from "express";
import { z } from "zod";
import { randomUUID } from "crypto";
import { saveScanLog } from "./scanLog.service";

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