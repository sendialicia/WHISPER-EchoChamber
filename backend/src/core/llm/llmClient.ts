/**
 * llmClient.ts
 * -------------
 * This is the ONE shared contract between Feature 1 (scan/analyze) and
 * Feature 2 (tone/check). Both should call `llmClient.generate(...)` and
 * never talk to a provider SDK directly — that keeps provider-swapping
 * to a one-file change in `providers/`.
 *
 * Agree on this interface together before splitting up work — Person B can
 * build dashboard/practice against a mocked version of this while Person A
 * is still tuning prompts.
 */

import { generateWithGemini } from "./providers/gemini.provider";

export type LlmSpeed = "fast" | "deep";
// "fast"  -> cheap/low-latency model (triage, tone check)
// "deep"  -> stronger reasoning model (full analysis, steelmanning)

export interface LlmGenerateOptions {
  /** The user-facing task prompt (already includes the content to analyze). */
  prompt: string;
  /** System/instruction prompt — persona + output format rules. */
  system?: string;
  /** Which tier of model to use. Defaults to "fast". */
  speed?: LlmSpeed;
  /** If true, asks the provider to return parsed JSON matching this shape. */
  expectJson?: boolean;
  /** Max tokens for the response. */
  maxTokens?: number;
}

export interface LlmGenerateResult {
  /** Raw text response. */
  text: string;
  /** Parsed JSON, if expectJson was true and parsing succeeded. */
  json?: unknown;
  /** Which provider/model actually served this request. */
  model: string;
}

export interface LlmClient {
  generate(options: LlmGenerateOptions): Promise<LlmGenerateResult>;
}

function safeParseJson(text: string): unknown | undefined {
  try {
    // Strip common ```json fences before parsing.
    const cleaned = text.replace(/```json|```/g, "").trim();
    return JSON.parse(cleaned);
  } catch {
    return undefined;
  }
}

class DefaultLlmClient implements LlmClient {
  async generate(options: LlmGenerateOptions): Promise<LlmGenerateResult> {
    const raw = await generateWithGemini(options);

    return {
      text: raw.text,
      model: raw.model,
      json: options.expectJson ? safeParseJson(raw.text) : undefined,
    };
  }
}

export const llmClient: LlmClient = new DefaultLlmClient();
