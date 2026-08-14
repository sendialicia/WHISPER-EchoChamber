import { llmClient } from "@core/llm/llmClient";
import { TONE_SYSTEM_PROMPT, buildTonePrompt } from "@core/llm/prompts/tone.prompt";
import type { ToneCheckRequest, ToneCheckResult } from "./tone.types";

/**
 * Feature 2 — runs right before "Send" is tapped, so this needs to be
 * low-latency. Always use the "fast" model tier here.
 */
export async function checkTone(req: ToneCheckRequest): Promise<ToneCheckResult> {
  const result = await llmClient.generate({
    system: TONE_SYSTEM_PROMPT,
    prompt: buildTonePrompt(req.draft),
    speed: "fast",
    expectJson: true,
    maxTokens: 256,
  });

  const json = result.json as Partial<ToneCheckResult> | undefined;

  return {
    flagged: json?.flagged ?? false,
    tactic: json?.tactic ?? null,
    suggested_rewrite: json?.suggested_rewrite ?? null,
  };
}
