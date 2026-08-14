import type { Request, Response } from "express";
import { z } from "zod";
import { checkTone } from "./tone.service";

const toneSchema = z.object({
  draft: z.string().min(1).max(2_000),
});

export async function toneController(req: Request, res: Response) {
  const parsed = toneSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "invalid_request", details: parsed.error.flatten() });
  }

  const result = await checkTone(parsed.data);
  res.json(result);
}
