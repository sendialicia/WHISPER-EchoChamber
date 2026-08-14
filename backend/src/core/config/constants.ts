// Tactic labels used across scan/analyze and tone/check so Feature 1 and
// Feature 2 output consistent vocabulary to the user.
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

export const CONTENT_MODE = {
  BOTH_SIDES: "both_sides",
  FACT_CONTEXT: "fact_context",
} as const;

export type ContentMode = (typeof CONTENT_MODE)[keyof typeof CONTENT_MODE];

// Triage threshold — how confident the classifier must be that content is
// controversial/framing-biased before we run full analysis.
export const TRIAGE_CONFIDENCE_THRESHOLD = 0.6;
