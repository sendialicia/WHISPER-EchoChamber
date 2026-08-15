import Svg, { Defs, LinearGradient, Path, Stop } from "react-native-svg";
import { colors } from "../theme";

/**
 * The few glyphs the design draws rather than borrows. Emoji were standing in
 * for these, which put the system's own colours on screen — the streak flame
 * is blue in the mockups, not orange.
 */

export function Flame({ size = 64 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 64 64">
      <Defs>
        <LinearGradient id="flameOuter" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={colors.primarySoft} />
          <Stop offset="1" stopColor={colors.deep} />
        </LinearGradient>
        <LinearGradient id="flameInner" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#8BE4F2" />
          <Stop offset="1" stopColor={colors.cyan} />
        </LinearGradient>
      </Defs>
      {/* Body: a wide base tapering to a leaning tip, with a curl at the
          shoulder. A single symmetrical curve just reads as a teardrop. */}
      <Path
        d="M34 3c-1 8-5 13-11 18-7 6-12 12-12 21 0 12 10 21 22 21s22-9 22-21c0-7-3-12-8-17-1 4-3 6-6 7 2-11-2-21-7-29z"
        fill="url(#flameOuter)"
      />
      <Path
        d="M33 28c-1 6-4 9-7 13s-4 8-1 12 11 4 14-1c3-6 0-10-2-14s-4-6-4-10z"
        fill="url(#flameInner)"
      />
    </Svg>
  );
}

export function Bookmark({
  size = 22,
  filled = false,
}: {
  size?: number;
  filled?: boolean;
}) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path
        d="M6.5 3.5h11a1 1 0 0 1 1 1v16l-6.5-4.2L5.5 20.5v-16a1 1 0 0 1 1-1z"
        fill={filled ? colors.accent : "none"}
        stroke={filled ? colors.accent : colors.ink}
        strokeWidth={1.8}
        strokeLinejoin="round"
      />
    </Svg>
  );
}
