import type { Request, Response } from "express";
import { z } from "zod";
import { runAnalysis } from "./analyze.service";

const analyzeSchema = z.object({
  text: z.string().min(1).max(20_000),
  sourceUrl: z.string().url().optional(),
});

export async function analyzeController(req: Request, res: Response) {
  const parsed = analyzeSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "invalid_request", details: parsed.error.flatten() });
  }

  const result = await runAnalysis(parsed.data);
  res.json(result);
}
