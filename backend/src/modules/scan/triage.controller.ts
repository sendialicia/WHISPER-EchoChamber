import type { Request, Response } from "express";
import { runTriage } from "./triage.service";
import { triageRequestSchema } from "./scan.schema";

export async function triageController(req: Request, res: Response) {
  const parsed = triageRequestSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "invalid_request", details: parsed.error.flatten() });
  }

  const result = await runTriage(parsed.data);
  res.json(result);
}
