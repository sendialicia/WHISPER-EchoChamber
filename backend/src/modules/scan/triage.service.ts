import { llmClient } from "@core/llm/llmClient";
import { TRIAGE_SYSTEM_PROMPT, buildTriagePrompt } from "@core/llm/prompts/triage.prompt";
import { TRIAGE_CONFIDENCE_THRESHOLD } from "@core/config/constants";
import type { TriageRequest, TriageResult } from "./scan.types";

/**
 * Feature 1, Stage (b) — fast/cheap check for whether content is worth a
 * full analysis pass. Uses the "fast" model tier to keep this near-instant.
 */
export async function runTriage(req: TriageRequest): Promise<TriageResult> {
  const result = await llmClient.generate({
    system: TRIAGE_SYSTEM_PROMPT,
    prompt: buildTriagePrompt(req.text),
    speed: "fast",
    expectJson: true,
    maxTokens: 128,
    ...(req.imageBase64
      ? { image: { base64: req.imageBase64, mimeType: req.imageMimeType } }
      : {}),
  });

  const json = result.json as Partial<TriageResult> | undefined;

  return {
    is_controversial:
      json?.is_controversial === true &&
      (json?.confidence ?? 0) >= TRIAGE_CONFIDENCE_THRESHOLD,
    confidence: json?.confidence ?? 0,
  };
}
