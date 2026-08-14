import type { Request, Response } from "express";
import { computeEchoChamberMeter } from "./echoChamberMeter.service";
import { getSourceDiversityNudges } from "./sourceDiversity.service";
import { getReflectionJournal } from "./reflectionJournal.service";

// userId comes from req.userId, set by the requireAuth middleware after
// verifying the Supabase JWT — never trust a userId from the URL/body,
// since that would let anyone request anyone else's data.

export async function echoChamberMeterController(req: Request, res: Response) {
  const result = await computeEchoChamberMeter(req.userId!);
  res.json(result);
}

export async function sourceDiversityController(req: Request, res: Response) {
  const result = await getSourceDiversityNudges(req.userId!);
  res.json(result);
}

export async function reflectionJournalController(req: Request, res: Response) {
  const result = await getReflectionJournal(req.userId!);
  res.json(result);
}