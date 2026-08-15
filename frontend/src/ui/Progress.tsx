import { StyleSheet, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { colors, gradients, radius, spacing, typography } from "../theme";

/**
 * Horizontal share bar — "Side A 72% / Side B 28%" in the breakdown.
 * Rendered on a light surface, unlike the meter arc.
 */
export function ShareBar({ label, value }: { label: string; value: number }) {
  const percent = Math.round(Math.max(0, Math.min(1, value)) * 100);

  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <View style={styles.track}>
        <LinearGradient
          colors={gradients.meter}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[styles.fill, { width: `${percent}%` }]}
        />
      </View>
      <Text style={styles.rowValue}>{percent}%</Text>
    </View>
  );
}

/**
 * The dot rail at the top of a multi-step flow. Steps are a real sequence —
 * challenge, then reflect, then exercise — so the position carries meaning.
 */
export function StepDots({ count, current }: { count: number; current: number }) {
  return (
    <View
      style={styles.dots}
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 1, max: count, now: current + 1 }}
    >
      {Array.from({ length: count }, (_, i) => (
        <View key={i} style={styles.dotSlot}>
          {i > 0 ? <View style={styles.connector} /> : null}
          <View style={[styles.dot, i === current && styles.dotActive]} />
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  rowLabel: { ...typography.caption, color: colors.inkSoft, width: 48 },
  rowValue: {
    ...typography.caption,
    color: colors.inkSoft,
    width: 36,
    textAlign: "right",
  },
  track: {
    flex: 1,
    height: 8,
    borderRadius: radius.pill,
    backgroundColor: colors.track,
    overflow: "hidden",
  },
  fill: { height: "100%", borderRadius: radius.pill },

  dots: { flexDirection: "row", alignItems: "center", paddingVertical: spacing.sm },
  dotSlot: { flexDirection: "row", alignItems: "center", flex: 1 },
  connector: { flex: 1, height: 1, backgroundColor: colors.accentSoft },
  dot: {
    width: 10,
    height: 10,
    borderRadius: radius.pill,
    backgroundColor: colors.accentSoft,
  },
  dotActive: { backgroundColor: colors.accent, width: 12, height: 12 },
});
