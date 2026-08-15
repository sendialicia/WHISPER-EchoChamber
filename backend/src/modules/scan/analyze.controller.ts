import type { Request, Response } from "express";
import { runAnalysis } from "./analyze.service";
import { analyzeRequestSchema } from "./scan.schema";

export async function analyzeController(req: Request, res: Response) {
  const parsed = analyzeRequestSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "invalid_request", details: parsed.error.flatten() });
  }

  const result = await runAnalysis(parsed.data);
  res.json(result);
}
