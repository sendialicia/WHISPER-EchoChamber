import type { AnalyzeResult } from "./scan.types";

/**
 * Feature 1, Stage 5 — the fact-vs-opinion branch is actually decided
 * inside the analyze LLM call itself (see analyze.prompt.ts, `mode` field)
 * rather than as a separate request, to avoid a second round-trip.
 *
 * This module exists as the single place to add extra guardrails on top of
 * the model's own judgment — e.g. a curated list of topics that should
 * always render as fact_context regardless of what the model says
 * (scientific consensus topics, historical dates, etc), or a confidence
 * check before trusting a "both_sides" classification.
 */
export function reconcileMode(result: AnalyzeResult): AnalyzeResult {
  // Guardrail example: if mode is "both_sides" but we don't actually have
  // both steelmans populated, fall back to fact_context so the UI never
  // renders a broken card.
  if (result.mode === "both_sides" && (!result.side_a || !result.side_b)) {
    return {
      ...result,
      mode: "fact_context",
      fact_summary: result.fact_summary ?? "Unable to confidently identify two legitimate opposing sides.",
    };
  }

  return result;
}
