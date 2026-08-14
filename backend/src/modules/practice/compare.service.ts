import { llmClient } from "@core/llm/llmClient";
import { STEELMAN_SYSTEM_PROMPT, buildSteelmanPrompt } from "@core/llm/prompts/steelman.prompt";
import type { CompareRequest, CompareResult } from "./practice.types";

/**
 * Feature 4 — "Compare & Reflect".
 * Deliberately does NOT reuse scan/analyze.service.ts directly, since that
 * service expects raw content + returns a full two-sided card. Instead it
 * shares the same llmClient + a dedicated steelman prompt, keeping this
 * module decoupled from Feature 1's internals while still avoiding
 * duplicate provider-calling logic.
 *
 * No scoring / "correct answer" — per spec this just returns both
 * versions for the user to compare themselves.
 */
export async function generateComparison(req: CompareRequest): Promise<CompareResult> {
  const result = await llmClient.generate({
    system: STEELMAN_SYSTEM_PROMPT,
    prompt: buildSteelmanPrompt(req.topic, req.position),
    speed: "deep",
    expectJson: true,
    maxTokens: 512,
  });

  const json = result.json as { steelman?: string } | undefined;

  return {
    userSteelman: req.userSteelman ?? null,
    aiSteelman: json?.steelman ?? "Unable to generate a comparison right now.",
  };
}
