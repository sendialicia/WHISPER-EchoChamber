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
  const normalized: AnalyzeResult = {
    ...result,
    topic: normalizeTopic(result.topic),
    side_shown: normalizeSide(result.side_shown),
  };

  // Guardrail example: if mode is "both_sides" but we don't actually have
  // both steelmans populated, fall back to fact_context so the UI never
  // renders a broken card.
  if (normalized.mode === "both_sides" && (!normalized.side_a || !normalized.side_b)) {
    return {
      ...normalized,
      mode: "fact_context",
      fact_summary:
        normalized.fact_summary ??
        "Unable to confidently identify two legitimate opposing sides.",
      // With no two sides to pick between, a stance is meaningless.
      side_shown: null,
    };
  }

  return normalized;
}

/**
 * The dashboard groups history by exact topic string and source-diversity
 * matches it against a curated table, so near-misses ("Minimum Wage" vs
 * "minimum_wage") would silently split one subject into several. Fold the
 * model's answer into one canonical shape before it is ever stored.
 */
function normalizeTopic(topic: string | null): string | null {
  if (!topic) return null;

  const slug = topic
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");

  return slug.length > 0 ? slug : null;
}

/** Anything other than a clear "a"/"b" means the content took no side. */
function normalizeSide(side: AnalyzeResult["side_shown"]): AnalyzeResult["side_shown"] {
  return side === "a" || side === "b" ? side : null;
}
