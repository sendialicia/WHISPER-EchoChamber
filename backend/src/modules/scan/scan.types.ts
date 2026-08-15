import type { ContentMode, FramingTactic } from "@core/config/constants";
import type { SupportedImageMimeType } from "@core/llm/llmClient";

export interface TriageRequest {
  /** Plain text content (optional when an image is provided). */
  text?: string;
  /** Raw base64 of a screenshot (no `data:` URI prefix). */
  imageBase64?: string;
  /** MIME type of the image. Defaults to "image/png". */
  imageMimeType?: SupportedImageMimeType;
}

export interface TriageResult {
  is_controversial: boolean;
  confidence: number;
}

export interface AnalyzeRequest {
  /** Plain text content (optional when an image is provided). */
  text?: string;
  /** Raw base64 of a screenshot (no `data:` URI prefix). */
  imageBase64?: string;
  /** MIME type of the image. Defaults to "image/png". */
  imageMimeType?: SupportedImageMimeType;
  sourceUrl?: string;
}

export interface SideArgument {
  label: string;
  steelman: string;
}

export interface AnalyzeResult {
  mode: ContentMode;
  tactic: FramingTactic | null;
  side_a: SideArgument | null;
  side_b: SideArgument | null;
  fact_summary: string | null;
  common_ground: string | null;
  context_note: string | null;
}
