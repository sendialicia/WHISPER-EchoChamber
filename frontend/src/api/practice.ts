import { request } from "./client";
import type {
  CompareRequest,
  CompareResult,
  PracticeExercise,
  PracticeExerciseType,
  PracticeTopic,
} from "./types";

/** Feature 4 — Practice. */

/** Needs auth: picks a topic out of the user's own scan history. */
export function getPracticeTopic(signal?: AbortSignal): Promise<PracticeTopic> {
  return request<PracticeTopic>("/practice/topic", { auth: true, signal });
}

/** Generic content, no auth needed. */
export function getExercise(
  type: PracticeExerciseType,
  signal?: AbortSignal
): Promise<PracticeExercise> {
  return request<PracticeExercise>(`/practice/exercise?type=${type}`, { signal });
}

/** Compares the user's steelman against the model's. No personal data. */
export function compareSteelman(
  req: CompareRequest,
  signal?: AbortSignal
): Promise<CompareResult> {
  return request<CompareResult>("/practice/compare", {
    method: "POST",
    body: req,
    signal,
  });
}
