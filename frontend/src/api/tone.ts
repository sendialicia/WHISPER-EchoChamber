import { request } from "./client";
import type { ToneCheckRequest, ToneCheckResult } from "./types";

/** Feature 2 — Tone Check, run against a draft reply before it's sent. */
export function checkTone(
  req: ToneCheckRequest,
  signal?: AbortSignal
): Promise<ToneCheckResult> {
  return request<ToneCheckResult>("/tone/check", { method: "POST", body: req, signal });
}
