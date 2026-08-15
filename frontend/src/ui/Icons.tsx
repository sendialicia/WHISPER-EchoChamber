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
      <Path
        d="M33 3c1 9-4 13-9 18S14 32 15 41c1 10 9 20 19 20s18-9 19-19c1-11-6-16-11-22-4-5-7-11-9-17z"
        fill="url(#flameOuter)"
      />
      <Path
        d="M32 30c1 5-2 7-4 10s-2 8 1 11 8 2 10-2c2-5-1-8-3-11s-4-5-4-8z"
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
