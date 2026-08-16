/**
 * Mirrors the backend's request/response shapes.
 *
 * Keep in sync with:
 *   backend/src/modules/scan/scan.types.ts
 *   backend/src/modules/tone/tone.types.ts
 *   backend/src/modules/dashboard/dashboard.types.ts
 *   backend/src/modules/practice/practice.types.ts
 *   backend/src/core/config/constants.ts
 */

// ---------------------------------------------------------------- constants

export const FRAMING_TACTICS = [
  "emotional_loading",
  "cherry_picking",
  "false_dichotomy",
  "strawman",
  "loaded_language",
  "whataboutism",
  "appeal_to_fear",
  "false_balance",
  "ad_hominem",
] as const;

export type FramingTactic = (typeof FRAMING_TACTICS)[number];

export type ContentMode = "both_sides" | "fact_context";

/** Image formats the backend's vision path accepts. */
export type SupportedImageMimeType = "image/png" | "image/jpeg" | "image/webp";

/** Below this the backend treats content as not worth a full analysis. */
export const TRIAGE_CONFIDENCE_THRESHOLD = 0.6;

// --------------------------------------------------------------------- scan

/**
 * Content for a scan. `text` comes from the accessibility tree when we can
 * read the screen directly; `imageBase64` is the screenshot fallback for
 * apps that don't expose their text. One of the two is required — sending
 * neither is a 400.
 */
export interface ScanContent {
  text?: string;
  /** Raw base64, no `data:` prefix (the backend strips one if present). */
  imageBase64?: string;
  imageMimeType?: SupportedImageMimeType;
}

export type TriageRequest = ScanContent;

export interface TriageResult {
  is_controversial: boolean;
  confidence: number;
}

export interface AnalyzeRequest extends ScanContent {
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
  /** snake_case slug for the underlying debate; groups dashboard history. */
  topic: string | null;
  /** Which side the scanned content argued — what the meter measures. */
  side_shown: "a" | "b" | null;
}

/** A logged scan, as the history lists render it. */
export interface ScanLogEntry {
  id: string;
  userId: string;
  createdAt: string;
  sourceText: string;
  sourceUrl?: string;
  mode: ContentMode;
  tactic: string | null;
  topic?: string;
  sideShown?: "a" | "b";
}

export interface ScanLogRequest {
  sourceText: string;
  sourceUrl?: string;
  mode: ContentMode;
  tactic: string | null;
  topic?: string;
  sideShown?: "a" | "b";
}

// --------------------------------------------------------------------- tone

export interface ToneCheckRequest {
  draft: string;
}

export interface ToneCheckResult {
  flagged: boolean;
  tactic: string | null;
  suggested_rewrite: string | null;
}

// ---------------------------------------------------------------- dashboard

export interface EchoChamberMeterResult {
  /** 0 = perfectly balanced exposure, 1 = fully one-sided. */
  skewScore: number;
  dominantSide: string | null;
  topicsCovered: number;
}

export interface SourceDiversityNudge {
  topic: string;
  reason: string;
  suggestedReadingTitle: string;
  suggestedReadingUrl: string;
}

export interface ReflectionJournalEntry {
  topic: string;
  occurrences: number;
  lastTriggeredAt: string;
}

// ----------------------------------------------------------------- practice

export interface PracticeTopic {
  id: string;
  topic: string;
  position: string;
  source: "scan_history" | "curated_bank";
}

export type PracticeExerciseType =
  | "identify_framing"
  | "fact_vs_opinion"
  | "spot_fallacy"
  | "evaluate_evidence";

export interface PracticeExercise {
  id: string;
  type: PracticeExerciseType;
  prompt: string;
  options: string[];
  correctOptionIndex: number;
  explanation: string;
}

export interface CompareRequest {
  topic: string;
  position: string;
  userSteelman?: string;
}

export interface CompareResult {
  userSteelman: string | null;
  aiSteelman: string;
}
