import { StyleSheet, Text, View } from "react-native";
import Svg, { Defs, LinearGradient, Path, Stop } from "react-native-svg";
import { colors, gradients, spacing, typography } from "../theme";

/**
 * The Echo Chamber Meter arc.
 *
 * A semicircle from left to right, filled clockwise in proportion to how
 * one-sided the user's reading has been. 0 is balanced, 1 is entirely one
 * perspective — so a *fuller* arc is the worse outcome, which is why the
 * gradient runs from cool to the accent rather than the other way round.
 */

const SIZE = 200;
const STROKE = 16;
const RADIUS = (SIZE - STROKE) / 2;
const CENTER = SIZE / 2;

/** Half the circumference — the arc only covers 180°. */
const ARC_LENGTH = Math.PI * RADIUS;

/** Left edge to right edge, bulging upward. */
const ARC_PATH = `M ${STROKE / 2} ${CENTER} A ${RADIUS} ${RADIUS} 0 0 1 ${SIZE - STROKE / 2} ${CENTER}`;

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
      <Svg width={SIZE} height={CENTER + STROKE / 2}>
        <Defs>
          <LinearGradient id="meterFill" x1="0" y1="0" x2="1" y2="0">
            <Stop offset="0" stopColor={gradients.meter[0]} />
            <Stop offset="0.5" stopColor={gradients.meter[1]} />
            <Stop offset="1" stopColor={gradients.meter[2]} />
          </LinearGradient>
        </Defs>

        <Path
          d={ARC_PATH}
          stroke="rgba(255, 255, 255, 0.18)"
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

      <View style={styles.readout}>
        <Text style={styles.percent}>{percent}%</Text>
        <Text style={styles.label}>One sided</Text>
      </View>

      {caption ? <Text style={styles.caption}>{caption}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: "center", gap: spacing.sm },
  readout: { alignItems: "center", marginTop: -spacing.xl - spacing.xs },
  percent: { fontSize: 40, fontWeight: "700", color: colors.onDark },
  label: { ...typography.label, color: colors.onDarkSoft },
  caption: {
    ...typography.caption,
    color: colors.onDarkSoft,
    textAlign: "center",
    lineHeight: 18,
  },
});
