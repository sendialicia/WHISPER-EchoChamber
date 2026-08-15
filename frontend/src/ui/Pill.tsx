import { StyleSheet, Text, View } from "react-native";
import { colors, radius, spacing, typography } from "../theme";

/**
 * The glass status pill from the triage states — "No Significant Framing
 * Detected", "Likely Framing Detected".
 */
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

const styles = StyleSheet.create({
  pill: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "center",
    gap: spacing.sm,
    backgroundColor: colors.glass,
    borderColor: colors.glassBorder,
    borderWidth: 1,
    borderRadius: radius.pill,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  icon: { fontSize: 15 },
  label: {
    ...typography.label,
    color: colors.ink,
  },
  neutral: { color: colors.inkSoft },
  positive: { color: colors.positive },
  caution: { color: colors.caution },
});
