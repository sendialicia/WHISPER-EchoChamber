/**
 * Design tokens for EchoBreaker.
 *
 * Light-first: the mockups are white with pastel gradient washes, and rich
 * blue-to-purple cards carrying the important numbers. There is no dark
 * variant — screens should not try to build one.
 *
 * NOTE: these values are read off the design screenshots by eye. When the
 * Figma or final PNGs land, correct them HERE and the whole app follows —
 * nothing outside this file should hard-code a colour.
 */

export const colors = {
  /** Page ground. Slightly cool so the pastel washes sit on something. */
  ground: "#FFFFFF",
  groundSoft: "#F6F7FC",

  /** Primary action — "Next", "Play", "Submit", the active tab pill. */
  primary: "#1F31D1",
  primaryPressed: "#1829A8",
  /** The deep navy anchoring the feature cards. */
  primaryDeep: "#16207A",

  /** Accent — bookmarks, the meter arc, progress dots, destructive-ish flags. */
  accent: "#FF2D8E",
  accentSoft: "#FFD3E8",

  /** White panels on the ground. */
  card: "#FFFFFF",
  cardBorder: "#EDEFF7",

  /** Text on light surfaces. */
  ink: "#14161F",
  inkSoft: "#6B7280",
  inkFaint: "#9CA3AF",

  /** Text on the blue/purple cards. */
  onDark: "#FFFFFF",
  onDarkSoft: "rgba(255, 255, 255, 0.78)",

  /** Inputs and inert tracks. */
  field: "#FFFFFF",
  fieldBorder: "#E3E6F2",
  track: "#EDEFF7",

  /** Semantic states, deliberately separate from the pink accent. */
  positive: "#12B76A",
  caution: "#F79009",
  danger: "#E4405F",
} as const;

/**
 * Gradients, as tuples LinearGradient can take directly.
 * Named for the role they play, not the hues they contain.
 */
export const gradients = {
  /** Ambient wash behind a whole screen. */
  page: ["#FFFFFF", "#F7F5FE", "#EFF3FE"],
  /** The hero card — Echo Chamber Meter, "Choose A Practice". */
  feature: ["#1E2A78", "#37299A", "#5B2E9E"],
  /** Informational callouts — "Tip!", "What's this mean?", "Results!". */
  info: ["#2B49E0", "#4269F2"],
  /** The opposing view, and quoted content under analysis. */
  opposite: ["#FBDCEF", "#E7C6F2"],
  /** The meter arc: cool through to accent as the skew climbs. */
  meter: ["#3DD9D0", "#4A6CF7", "#FF2D8E"],
  /** Emotional-history chips in the journal. */
  chip: ["#5B6BF0", "#B24BD6"],
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

export const radius = {
  sm: 10,
  md: 16,
  lg: 24,
  xl: 32,
  pill: 999,
} as const;

export const typography = {
  display: { fontSize: 30, fontWeight: "700" },
  title: { fontSize: 22, fontWeight: "700" },
  heading: { fontSize: 17, fontWeight: "600" },
  body: { fontSize: 15, fontWeight: "400" },
  label: { fontSize: 13, fontWeight: "600" },
  caption: { fontSize: 12, fontWeight: "500" },
} as const;

/** Soft lift used on white cards. Kept in one place so it stays consistent. */
export const elevation = {
  shadowColor: "#1B2559",
  shadowOpacity: 0.06,
  shadowRadius: 16,
  shadowOffset: { width: 0, height: 6 },
  elevation: 2,
} as const;
