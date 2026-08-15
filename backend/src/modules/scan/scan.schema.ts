import { z } from "zod";
import { SUPPORTED_IMAGE_MIME_TYPES } from "@core/llm/llmClient";

/**
 * Request schemas for /scan/triage and /scan/analyze.
 *
 * Both endpoints take the same content payload — the app hits them back to
 * back with the identical screenshot — so the rules live here rather than
 * being duplicated in each controller, where they would drift apart.
 * Keeping them out of the controllers also makes them directly testable
 * without standing up an HTTP server.
 */

// Clients commonly hand over a full `data:image/png;base64,...` URI, since
// that's what most encoders return. Strip the prefix here instead of making
// every caller remember, and drop the line breaks some base64 encoders
// insert — otherwise both reach Gemini verbatim and come back as an opaque
// 400 from the provider rather than a clear one from us.
const DATA_URI_PREFIX = /^data:[^;,]*;base64,/i;
const BASE64_ONLY = /^[A-Za-z0-9+/]+={0,2}$/;

/** Raw base64 of a screenshot. 20M chars is roughly a 15MB image. */
export const imageBase64Schema = z
  .string()
  .max(20_000_000)
  .transform((v) => v.replace(DATA_URI_PREFIX, "").replace(/\s/g, ""))
  .refine((v) => v.length > 0 && BASE64_ONLY.test(v), {
    message:
      "imageBase64 must be base64-encoded image data (a leading `data:` URI prefix is stripped automatically).",
  });

export const imageMimeTypeSchema = z.enum(SUPPORTED_IMAGE_MIME_TYPES);

/**
 * Text content, trimmed so a whitespace-only string counts as absent.
 * Without the trim it would satisfy `hasContent` below while the prompt
 * builders (which trim too) fall through to "see the attached screenshot",
 * pointing the model at an image that was never sent.
 */
const contentText = (maxLength: number) =>
  z
    .string()
    .max(maxLength)
    .transform((v) => v.trim());

/** Runs after the field transforms, so `text` is already trimmed here. */
function hasContent(v: { text?: string; imageBase64?: string }): boolean {
  return Boolean(v.text || v.imageBase64);
}

const NO_CONTENT_MESSAGE = "Provide either text or imageBase64.";

export const triageRequestSchema = z
  .object({
    text: contentText(10_000).optional(),
    imageBase64: imageBase64Schema.optional(),
    imageMimeType: imageMimeTypeSchema.optional(),
  })
  .refine(hasContent, { message: NO_CONTENT_MESSAGE });

export const analyzeRequestSchema = z
  .object({
    text: contentText(20_000).optional(),
    imageBase64: imageBase64Schema.optional(),
    imageMimeType: imageMimeTypeSchema.optional(),
    sourceUrl: z.string().url().optional(),
  })
  .refine(hasContent, { message: NO_CONTENT_MESSAGE });
