import type { ReactNode } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors, gradients, spacing, typography } from "../theme";

/**
 * The ambient wash every screen sits on. Light-only by design — the mockups
 * have no dark variant, so there is nothing to switch on here.
 */
export function Screen({ children }: { children: ReactNode }) {
  const insets = useSafeAreaInsets();

  return (
    <LinearGradient
      colors={gradients.page}
      locations={[0, 0.5, 1]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.fill}
    >
      <View style={[styles.content, { paddingTop: insets.top + spacing.sm }]}>
        {children}
      </View>
    </LinearGradient>
  );
}

/** Screen title with an optional back affordance, as on the sub-screens. */
export function ScreenHeader({
  title,
  onBack,
  trailing,
}: {
  title: string;
  onBack?: () => void;
  trailing?: ReactNode;
}) {
  return (
    <View style={styles.header}>
      {onBack ? (
        <Pressable
          onPress={onBack}
          accessibilityRole="button"
          accessibilityLabel="Go back"
          hitSlop={12}
        >
          <Text style={styles.back}>‹</Text>
        </Pressable>
      ) : null}
      <Text style={styles.headerTitle}>{title}</Text>
      <View style={styles.headerTrailing}>{trailing}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  content: { flex: 1, paddingHorizontal: spacing.lg },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingVertical: spacing.sm,
  },
  back: {
    fontSize: 30,
    lineHeight: 34,
    color: colors.ink,
    paddingRight: spacing.xs,
  },
  headerTitle: { ...typography.title, color: colors.ink },
  headerTrailing: { marginLeft: "auto" },
});
