/**
 * Design tokens for GEMA.
 *
 * Every value here was sampled pixel-by-pixel from the Figma exports in
 * `design/`, so these are the design's actual colours rather than an
 * approximation. Nothing outside this file hard-codes a colour — correcting a
 * token here updates the whole app.
 *
 * Light-only: white-blue grounds with soft coloured glows, and deep indigo
 * cards carrying the headline numbers. There is no dark variant.
 */

export const colors = {
  /** Page ground. Cards sit only a shade above it, so depth comes from shadow. */
  ground: "#F5F8FF",
  card: "#F9FBFF",
  cardBorder: "#FFFFFF",

  /** Deep indigo — feature cards, the active tab pill, segmented selection. */
  deep: "#1026A2",
  deepPressed: "#0C1D80",

  /** Bright blue — "Play", "See Full Breakdown", primary actions. */
  primary: "#4488FF",
  primaryPressed: "#358AFF",
  primarySoft: "#5BA6FF",

  /** Accent — "View All", the hot end of the meter, bookmarks. */
  accent: "#FF359A",

  /** The meter's cool end, and the streak flame. */
  cyan: "#3ACBDF",
  cyanMuted: "#5CB1D3",

  /** Muted indigo used for placeholder blocks inside feature cards. */
  lavender: "#828FD1",

  /** Text. The design uses true black for headings, not a soft grey. */
  ink: "#000000",
  inkSoft: "#5C5D60",
  inkFaint: "#8E9099",

  /** Text on deep/primary surfaces. */
  onDark: "#FFFFFF",
  onDarkSoft: "rgba(255, 255, 255, 0.82)",

  /** Frosted circles in the tab bar, and inert tracks. */
  frost: "rgba(137, 167, 209, 0.28)",
  frostBorder: "rgba(255, 255, 255, 0.65)",
  track: "#E4EBF8",

  /** Semantic states, deliberately separate from the pink accent. */
  positive: "#12B76A",
  caution: "#F79009",
  danger: "#E4405F",
} as const;

export const gradients = {
  /** The meter arc and the perspective bars: cool → indigo → hot. */
  meter: [colors.cyanMuted, colors.primary, colors.accent],
  /** Informational callouts — "What's this mean?", "Tip!", "Results!". */
  info: ["#4488FF", "#5BA6FF"],
  /** Emotional-history chips in the journal. */
  chip: ["#4488FF", "#BB54BF"],
  /** The opposing view, and quoted content under analysis. */
  opposite: ["#F7D9EE", "#E3C6F4"],
} as const;

/** Decorative glows layered behind screen content. */
export const backdrop = {
  blue: require("../assets/backdrop/glow-blue.png"),
  cyan: require("../assets/backdrop/glow-cyan.png"),
  yellow: require("../assets/backdrop/glow-yellow.png"),
  magenta: require("../assets/backdrop/glow-magenta.png"),
  crescent: require("../assets/backdrop/glow-crescent.png"),
} as const;

/** Screen padding is 24 in the mockups; the rest of the scale follows it. */
export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

export const radius = {
  sm: 12,
  md: 20,
  lg: 28,
  pill: 999,
} as const;

export const typography = {
  hero: { fontSize: 44, fontWeight: "800" },
  display: { fontSize: 26, fontWeight: "800" },
  title: { fontSize: 21, fontWeight: "800" },
  heading: { fontSize: 17, fontWeight: "700" },
  body: { fontSize: 15, fontWeight: "400" },
  label: { fontSize: 14, fontWeight: "700" },
  caption: { fontSize: 12, fontWeight: "500" },
} as const;

/** Cards read as barely-raised glass, so the shadow does the separating. */
export const elevation = {
  shadowColor: "#1026A2",
  shadowOpacity: 0.1,
  shadowRadius: 14,
  shadowOffset: { width: 0, height: 6 },
  elevation: 3,
} as const;
