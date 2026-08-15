import { StyleSheet, Text, View } from "react-native";
import Svg, { Defs, LinearGradient, Path, Stop } from "react-native-svg";
import { colors, gradients, spacing, typography } from "../theme";

/**
 * The Echo Chamber Meter arc.
 *
 * A 250° sweep with the gap at the bottom, filled clockwise in proportion to
 * how one-sided the user's reading has been. 0 is balanced, 1 is entirely one
 * perspective — a *fuller* arc is the worse result, which is why the gradient
 * runs from the cool end toward the accent rather than the other way round.
 */

const SIZE = 230;
const STROKE = 18;
const RADIUS = (SIZE - STROKE) / 2;
const CENTER = SIZE / 2;

/** Degrees of arc drawn; the remaining 110° is the gap under the readout. */
const SWEEP = 250;
/**
 * 145°, measured clockwise from 3 o'clock — the lower-left tip. Half the gap
 * past straight-down (90°) on each side leaves the opening centred at the
 * bottom, so both tips land at the same height.
 */
const START_ANGLE = 90 + (360 - SWEEP) / 2;

const ARC_LENGTH = (SWEEP / 360) * 2 * Math.PI * RADIUS;

function pointAt(angleDeg: number) {
  const rad = (angleDeg * Math.PI) / 180;
  return {
    x: CENTER + RADIUS * Math.cos(rad),
    y: CENTER + RADIUS * Math.sin(rad),
  };
}

const start = pointAt(START_ANGLE);
const end = pointAt(START_ANGLE + SWEEP);
// large-arc=1 because the sweep exceeds 180°, sweep-flag=1 for clockwise.
const ARC_PATH = `M ${start.x} ${start.y} A ${RADIUS} ${RADIUS} 0 1 1 ${end.x} ${end.y}`;

export function Meter({ score, caption }: { score: number; caption?: string }) {
  const clamped = Math.max(0, Math.min(1, score));
  const percent = Math.round(clamped * 100);

  return (
    <View
      style={styles.wrap}
      accessibilityRole="progressbar"
      accessibilityLabel="Echo chamber meter"
      accessibilityValue={{ min: 0, max: 100, now: percent }}
    >
      <Svg width={SIZE} height={SIZE} style={styles.svg}>
        <Defs>
          <LinearGradient id="meterFill" x1="0" y1="1" x2="1" y2="0">
            <Stop offset="0" stopColor={gradients.meter[0]} />
            <Stop offset="0.55" stopColor={gradients.meter[1]} />
            <Stop offset="1" stopColor={gradients.meter[2]} />
          </LinearGradient>
        </Defs>

        <Path
          d={ARC_PATH}
          stroke={colors.deepPressed}
          strokeWidth={STROKE}
          strokeLinecap="round"
          fill="none"
        />
        <Path
          d={ARC_PATH}
          stroke="url(#meterFill)"
          strokeWidth={STROKE}
          strokeLinecap="round"
          fill="none"
          strokeDasharray={`${ARC_LENGTH} ${ARC_LENGTH}`}
          strokeDashoffset={ARC_LENGTH * (1 - clamped)}
        />
      </Svg>

      <View style={styles.readout} pointerEvents="none">
        <Text style={styles.percent}>{percent}%</Text>
        <Text style={styles.label}>One sided</Text>
      </View>

      {caption ? <Text style={styles.caption}>{caption}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: "center", gap: spacing.sm },
  svg: { marginBottom: -spacing.xl },
  readout: {
    position: "absolute",
    top: 0,
    height: SIZE,
    alignItems: "center",
    justifyContent: "center",
  },
  percent: { ...typography.hero, color: colors.onDark },
  label: { ...typography.heading, color: colors.onDark },
  caption: {
    ...typography.caption,
    color: colors.onDarkSoft,
    textAlign: "center",
    lineHeight: 18,
    paddingHorizontal: spacing.md,
  },
});
