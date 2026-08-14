import type { Request, Response } from "express";
import { z } from "zod";
import { getPracticeTopic } from "./topic.service";
import { getRandomExercise } from "./exercise.service";
import { generateComparison } from "./compare.service";

export async function practiceTopicController(req: Request, res: Response) {
  const topic = await getPracticeTopic(req.userId!);
  res.json(topic);
}

const exerciseQuerySchema = z.object({
  type: z
    .enum(["identify_framing", "fact_vs_opinion", "spot_fallacy", "evaluate_evidence"])
    .optional(),
});

export async function practiceExerciseController(req: Request, res: Response) {
  const parsed = exerciseQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    return res.status(400).json({ error: "invalid_request", details: parsed.error.flatten() });
  }

  const exercise = await getRandomExercise(parsed.data.type);
  res.json(exercise);
}

const compareSchema = z.object({
  topic: z.string(),
  position: z.string(),
  userSteelman: z.string().optional(),
});

export async function practiceCompareController(req: Request, res: Response) {
  const parsed = compareSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "invalid_request", details: parsed.error.flatten() });
  }

  const result = await generateComparison(parsed.data);
  res.json(result);
}