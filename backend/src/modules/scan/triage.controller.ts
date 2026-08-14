import type { Request, Response } from "express";
import { z } from "zod";
import { runTriage } from "./triage.service";

const triageSchema = z.object({
  text: z.string().min(1).max(10_000),
});

export async function triageController(req: Request, res: Response) {
  const parsed = triageSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "invalid_request", details: parsed.error.flatten() });
  }

  const result = await runTriage(parsed.data);
  res.json(result);
}
