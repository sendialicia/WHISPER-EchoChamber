import { env } from "@core/config/env";
import { logger } from "@core/utils/logger";
import { LlmUnavailableError, isRetryableStatus } from "../llmErrors";
import type { LlmGenerateOptions } from "../llmClient";

interface ProviderResult {
  text: string;
  model: string;
}

// Gemini's REST body is camelCase (inlineData/mimeType), unlike the
// snake_case used in some of Google's other client libraries.
type GeminiPart =
  | { text: string }
  | { inlineData: { mimeType: string; data: string } };

/**
 * Thin wrapper around Gemini's generateContent endpoint.
 * "fast" -> Flash-Lite (triage, tone check — high volume, low latency)
 * "deep" -> Flash/Pro (full analysis, steelmanning — needs stronger reasoning)
 *
 * Overload is retried, then the request is tried once against a second model.
 * Gemini answers 503 whenever a model is briefly in heavy demand, and without
 * this a spike lasting seconds takes the whole feature down — the user just
 * sees the analysis fail with nothing to do about it.
 */
export async function generateWithGemini(
  options: LlmGenerateOptions
): Promise<ProviderResult> {
  if (!env.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY is not set. Add it to your .env file.");
  }

  const primary =
    options.speed === "deep" ? env.GEMINI_DEEP_MODEL : env.GEMINI_FAST_MODEL;
  const fallback =
    options.speed === "deep" ? env.GEMINI_DEEP_FALLBACK_MODEL : env.GEMINI_FAST_FALLBACK_MODEL;

  try {
    return await callWithRetries(primary, options);
  } catch (err) {
    if (!(err instanceof LlmUnavailableError) || fallback === primary) throw err;

    // Demand spikes hit one model at a time, so a different one is usually
    // answering fine — worth a single try before giving up on the request.
    logger.warn(`${primary} unavailable, retrying once on ${fallback}`);
    return callWithRetries(fallback, options, MAX_ATTEMPTS_FALLBACK);
  }
}

/** Attempts against one model, backing off between transient failures. */
async function callWithRetries(
  model: string,
  options: LlmGenerateOptions,
  maxAttempts = MAX_ATTEMPTS
): Promise<ProviderResult> {
  let lastStatus = 0;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    const result = await callGemini(model, options);
    if ("text" in result) return result;

    lastStatus = result.status;
    if (!isRetryableStatus(result.status)) {
      throw new Error(`Gemini API error (${result.status}): ${result.body}`);
    }

    if (attempt < maxAttempts) {
      const wait = BASE_BACKOFF_MS * 2 ** (attempt - 1);
      logger.warn(
        `${model} returned ${result.status}, retrying in ${wait}ms (attempt ${attempt}/${maxAttempts})`
      );
      await delay(wait);
    }
  }

  throw new LlmUnavailableError(lastStatus);
}

/** One call. Returns the result, or the status and body when it failed. */
async function callGemini(
  model: string,
  options: LlmGenerateOptions
): Promise<ProviderResult | { status: number; body: string }> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${env.GEMINI_API_KEY}`;

  const parts: GeminiPart[] = [];
  if (options.image) {
    parts.push({
      inlineData: {
        mimeType: options.image.mimeType ?? "image/png",
        data: options.image.base64,
      },
    });
  }
  parts.push({ text: options.prompt });

  const contents = [
    ...(options.system
      ? [{ role: "user", parts: [{ text: `[SYSTEM INSTRUCTIONS]\n${options.system}` }] }]
      : []),
    { role: "user", parts },
  ];

  const body = {
    contents,
    generationConfig: {
      maxOutputTokens: options.maxTokens ?? 1024,
      responseMimeType: options.expectJson ? "application/json" : "text/plain",
    },
  };

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    return { status: res.status, body: await res.text() };
  }

  const data = (await res.json()) as any;
  const text: string =
    data?.candidates?.[0]?.content?.parts?.map((p: any) => p.text).join("\n") ?? "";

  return { text, model };
}

/** Two retries on the same model is enough for a spike measured in seconds. */
const MAX_ATTEMPTS = 3;
/** The fallback gets one attempt — by then the user has waited long enough. */
const MAX_ATTEMPTS_FALLBACK = 1;
const BASE_BACKOFF_MS = 600;

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
