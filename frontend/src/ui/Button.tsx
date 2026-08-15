import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  type ViewStyle,
} from "react-native";
import { colors, radius, spacing, typography } from "../theme";

/** The blue call to action — "Next", "Play", "Submit", "Done". */
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

/** Button that sits on a dark feature card — "See Full Breakdown". */
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

/** Segmented control — the Breakdown / History switch. */
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
    <>
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
    </>
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
    borderColor: colors.fieldBorder,
  },
  ghostPressed: { backgroundColor: colors.groundSoft },
  ghostLabel: { ...typography.label, color: colors.ink },

  onDark: {
    ...BASE,
    backgroundColor: "rgba(255, 255, 255, 0.18)",
    minHeight: 44,
    paddingVertical: spacing.sm,
  },
  onDarkLabel: { ...typography.label, color: colors.onDark },

  segment: {
    flex: 1,
    borderRadius: radius.pill,
    paddingVertical: spacing.sm,
    alignItems: "center",
  },
  segmentActive: { backgroundColor: colors.primary },
  segmentLabel: { ...typography.label, color: colors.inkSoft },
  segmentLabelActive: { color: colors.onDark },

  inactive: { opacity: 0.5 },
});
