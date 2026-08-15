import { StyleSheet, Text, View } from "react-native";
import { colors, elevation, radius, spacing, typography } from "../theme";

/** Status pill — "No Significant Framing Detected", "Likely Framing Detected". */
export function Pill({
  label,
  icon,
  tone = "neutral",
}: {
  label: string;
  icon?: string;
  tone?: "neutral" | "positive" | "caution";
}) {
  return (
    <View style={styles.pill}>
      {icon ? <Text style={[styles.icon, styles[tone]]}>{icon}</Text> : null}
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

/** Small inline tag — a streak count, a tactic name, a topic. */
export function Tag({ label }: { label: string }) {
  return (
    <View style={styles.tag}>
      <Text style={styles.tagLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "center",
    gap: spacing.sm,
    backgroundColor: colors.card,
    borderColor: colors.cardBorder,
    borderWidth: 1,
    borderRadius: radius.pill,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    ...elevation,
  },
  icon: { fontSize: 15 },
  label: { ...typography.label, color: colors.ink },
  neutral: { color: colors.inkSoft },
  positive: { color: colors.positive },
  caution: { color: colors.caution },

  tag: {
    alignSelf: "flex-start",
    backgroundColor: colors.track,
    borderRadius: radius.pill,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
  },
  tagLabel: { ...typography.caption, color: colors.accent },
});
