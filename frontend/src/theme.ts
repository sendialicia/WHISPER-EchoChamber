/**
 * Design tokens for EchoBreaker.
 *
 * The palette is dark-first — every mockup sits on the deep navy ground with
 * a magenta glow, so there is no light theme and screens should not try to
 * build one.
 *
 * NOTE: these values are read off the design screenshots by eye. Once the
 * PNG/Figma assets land, correct them HERE and the whole app follows —
 * nothing outside this file should hard-code a colour.
 */

export const colors = {
  /** Deep navy ground, darkest point of the background gradient. */
  ground: "#0A0E27",
  /** Mid stop of the background gradient, where the purple starts. */
  groundMid: "#1A1040",
  /** Lightest stop, the magenta bloom behind the content. */
  groundGlow: "#3D1B5C",

  /** Primary action — the "Done" button and progress bar fills. */
  accent: "#F5308F",
  accentSoft: "#C2298A",

  /** Cards sit as opaque white panels on the gradient. */
  card: "#FFFFFF",
  cardInk: "#14171D",
  cardInkSoft: "#5C6472",

  /** Text on the gradient itself. */
  ink: "#FFFFFF",
  inkSoft: "rgba(255, 255, 255, 0.72)",
  inkFaint: "rgba(255, 255, 255, 0.45)",

  /** Translucent surfaces — the status pills and the floating button. */
  glass: "rgba(12, 16, 46, 0.72)",
  glassBorder: "rgba(255, 255, 255, 0.14)",
  glassRaised: "rgba(255, 255, 255, 0.08)",

  /** Semantic states, kept separate from the magenta accent. */
  positive: "#3DD9A4",
  caution: "#FFB020",
  danger: "#FF5C5C",
} as const;

/** Stops for the full-screen background gradient. */
export const backgroundGradient = [
  colors.ground,
  colors.groundMid,
  colors.groundGlow,
] as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

export const radius = {
  sm: 8,
  md: 16,
  lg: 24,
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
