import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
  type ViewStyle,
} from "react-native";
import { colors, radius, spacing, typography } from "../theme";

/** The bright blue call to action — "Play", "Next", "Submit", "Done". */
export function PrimaryButton({
  label,
  onPress,
  loading = false,
  disabled = false,
  style,
}: {
  label: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
}) {
  const inactive = disabled || loading;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: inactive, busy: loading }}
      onPress={onPress}
      disabled={inactive}
      style={({ pressed }) => [
        styles.primary,
        pressed && !inactive && styles.primaryPressed,
        inactive && styles.inactive,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={colors.onDark} />
      ) : (
        <Text style={styles.primaryLabel}>{label}</Text>
      )}
    </Pressable>
  );
}

/** Lower-emphasis action — "Skip", "Ignore", secondary navigation. */
export function GhostButton({
  label,
  onPress,
  disabled = false,
  style,
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  style?: ViewStyle;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.ghost,
        pressed && !disabled && styles.ghostPressed,
        disabled && styles.inactive,
        style,
      ]}
    >
      <Text style={styles.ghostLabel}>{label}</Text>
    </Pressable>
  );
}

/** Sits on a deep card — "See Full Breakdown", "Play". */
export function OnDarkButton({
  label,
  onPress,
  style,
}: {
  label: string;
  onPress: () => void;
  style?: ViewStyle;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.onDark, pressed && styles.inactive, style]}
    >
      <Text style={styles.onDarkLabel}>{label}</Text>
    </Pressable>
  );
}

/** The pink "View All" affordance beside a section heading. */
export function LinkButton({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      hitSlop={12}
      style={({ pressed }) => (pressed ? styles.inactive : undefined)}
    >
      <Text style={styles.link}>{label}</Text>
    </Pressable>
  );
}

/**
 * The Breakdown / History switch. The mockup draws these as two separate
 * pills rather than segments inside a shared track, so there is no container.
 */
export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
}: {
  options: readonly T[];
  value: T;
  onChange: (next: T) => void;
}) {
  return (
    <View style={styles.segments}>
      {options.map((option) => {
        const active = option === value;
        return (
          <Pressable
            key={option}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            onPress={() => onChange(option)}
            style={[styles.segment, active && styles.segmentActive]}
          >
            <Text style={[styles.segmentLabel, active && styles.segmentLabelActive]}>
              {option}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const BASE = {
  borderRadius: radius.md,
  paddingVertical: spacing.md,
  paddingHorizontal: spacing.lg,
  alignItems: "center",
  justifyContent: "center",
  minHeight: 52,
} as const;

const styles = StyleSheet.create({
  primary: { ...BASE, backgroundColor: colors.primary },
  primaryPressed: { backgroundColor: colors.primaryPressed },
  primaryLabel: { ...typography.heading, color: colors.onDark },

  ghost: {
    ...BASE,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  ghostPressed: { backgroundColor: colors.track },
  ghostLabel: { ...typography.label, color: colors.ink },

  onDark: {
    ...BASE,
    backgroundColor: colors.primary,
    minHeight: 46,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
  },
  onDarkLabel: { ...typography.heading, color: colors.onDark },

  link: {
    ...typography.label,
    color: colors.accent,
    textDecorationLine: "underline",
  },

  segments: { flexDirection: "row", gap: spacing.md },
  segment: {
    flex: 1,
    borderRadius: radius.pill,
    paddingVertical: spacing.md,
    alignItems: "center",
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  segmentActive: { backgroundColor: colors.deep, borderColor: colors.deep },
  segmentLabel: { ...typography.heading, color: colors.ink },
  segmentLabelActive: { color: colors.onDark },

  inactive: { opacity: 0.6 },
});
