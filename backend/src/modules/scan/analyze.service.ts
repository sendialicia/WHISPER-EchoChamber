import { llmClient } from "@core/llm/llmClient";
import { ANALYZE_SYSTEM_PROMPT, buildAnalyzePrompt } from "@core/llm/prompts/analyze.prompt";
import { getSourceContext } from "./sourceContext.service";
import { reconcileMode } from "./factVsOpinion.service";
import type { AnalyzeRequest, AnalyzeResult } from "./scan.types";

/**
 * Feature 1, Stages (c) + (d) — full analysis pipeline.
 * This is the heart of Feature 1, and also gets reused by
 * practice/compare.service.ts (Feature 4) for AI-generated steelmans —
 * import this service rather than duplicating prompt logic there.
 */
export async function runAnalysis(req: AnalyzeRequest): Promise<AnalyzeResult> {
  const sourceContext = await getSourceContext(req.sourceUrl);

  const result = await llmClient.generate({
    system: ANALYZE_SYSTEM_PROMPT,
    prompt: buildAnalyzePrompt(req.text, sourceContext),
    speed: "deep",
    expectJson: true,
    maxTokens: 1024,
    ...(req.imageBase64
      ? { image: { base64: req.imageBase64, mimeType: req.imageMimeType } }
      : {}),
  });

  const json = (result.json as AnalyzeResult) ?? {
    mode: "fact_context",
    tactic: null,
    side_a: null,
    side_b: null,
    fact_summary: "Analysis unavailable — please try again.",
    common_ground: null,
    context_note: null,
    topic: null,
    side_shown: null,
  };

  return reconcileMode(json);
}
