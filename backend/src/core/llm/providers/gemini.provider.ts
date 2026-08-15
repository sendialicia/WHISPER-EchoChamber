import { env } from "@core/config/env";
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
 */
export async function generateWithGemini(
  options: LlmGenerateOptions
): Promise<ProviderResult> {
  if (!env.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY is not set. Add it to your .env file.");
  }

  const model =
    options.speed === "deep" ? env.GEMINI_DEEP_MODEL : env.GEMINI_FAST_MODEL;

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
    const errText = await res.text();
    throw new Error(`Gemini API error (${res.status}): ${errText}`);
  }

  const data = (await res.json()) as any;
  const text: string =
    data?.candidates?.[0]?.content?.parts?.map((p: any) => p.text).join("\n") ?? "";

  return { text, model };
}
