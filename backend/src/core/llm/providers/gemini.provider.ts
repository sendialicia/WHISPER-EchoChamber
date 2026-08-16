import { env } from "@core/config/env";
import { logger } from "@core/utils/logger";
import {
  LlmUnavailableError,
  isDailyQuotaExhausted,
  isRetryableStatus,
} from "../llmErrors";
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
 * Overload is retried, then the request walks a chain of other models.
 * Gemini answers 503 whenever a model is briefly in heavy demand, and without
 * this a spike lasting seconds takes the whole feature down — the user just
 * sees the analysis fail with nothing to do about it.
 *
 * The chain matters more than the retries. A spike hits one model at a time,
 * and the newest models are the most contended, so an older one is usually
 * answering normally while the newest is refusing everyone.
 */
export async function generateWithGemini(
  options: LlmGenerateOptions
): Promise<ProviderResult> {
  if (!env.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY is not set. Add it to your .env file.");
  }

  const chain = modelChain(options.speed);
  let lastError: unknown;

  for (const [index, model] of chain.entries()) {
    const isPrimary = index === 0;
    try {
      if (!isPrimary) logger.warn(`Falling back to ${model}`);
      // Only the primary is worth waiting on: once we know a spike is
      // happening, moving to a quieter model beats retrying a busy one.
      return await callWithRetries(model, options, isPrimary ? MAX_ATTEMPTS : 1);
    } catch (err) {
      // Anything other than overload is the request's own fault and will fail
      // identically everywhere, so there is nothing to fall back to.
      if (!(err instanceof LlmUnavailableError)) throw err;
      lastError = err;
    }
  }

  throw lastError ?? new LlmUnavailableError(503);
}

/** The primary followed by its fallbacks, de-duplicated, in order. */
function modelChain(speed: LlmGenerateOptions["speed"]): string[] {
  const primary = speed === "deep" ? env.GEMINI_DEEP_MODEL : env.GEMINI_FAST_MODEL;
  const fallbacks =
    speed === "deep" ? env.GEMINI_DEEP_FALLBACK_MODELS : env.GEMINI_FAST_FALLBACK_MODELS;

  const chain = [primary, ...fallbacks.split(",").map((m) => m.trim())];
  return [...new Set(chain.filter(Boolean))];
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

    // A model the key cannot reach is a configuration problem with that entry
    // in the chain, not with the request — the next model may be fine, so it
    // is skipped rather than allowed to end the whole attempt.
    if (result.status === 404) {
      logger.error(`${model} is not available to this API key — skipping it`);
      throw new LlmUnavailableError(result.status, `Model ${model} is not available.`);
    }

    if (!isRetryableStatus(result.status)) {
      throw new Error(`Gemini API error (${result.status}): ${result.body}`);
    }

    // Out of requests for the day on this model. Retrying cannot help, and
    // the next model in the chain has its own daily budget.
    if (result.status === 429 && isDailyQuotaExhausted(result.body)) {
      logger.warn(`${model} is out of quota for today, moving on`);
      throw new LlmUnavailableError(result.status);
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
      // Current Gemini models spend part of this budget on internal reasoning
      // before writing anything, so a ceiling sized for the visible answer
      // alone gets consumed before the answer starts.
      maxOutputTokens: options.maxTokens ?? 2048,
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
  const candidate = data?.candidates?.[0];
  const text: string =
    candidate?.content?.parts?.map((p: any) => p.text).join("\n") ?? "";

  // Running out of budget mid-answer yields truncated JSON, which parses to
  // nothing and surfaces as "analysis unavailable" with no clue why. Saying so
  // here is the difference between a five-minute fix and an afternoon.
  if (candidate?.finishReason === "MAX_TOKENS") {
    logger.warn(
      `${model} hit its token ceiling — the reply is truncated and will not parse. ` +
        `Raise maxTokens for this call (used ${data?.usageMetadata?.totalTokenCount} total).`
    );
  }

  return { text, model };
}

/**
 * Attempts on the primary before moving down the chain. Kept low: waiting out
 * a spike is slower and less likely to work than asking a quieter model.
 */
const MAX_ATTEMPTS = 2;
const BASE_BACKOFF_MS = 600;

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
