import type { ReactNode } from "react";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { backdrop, colors, spacing, typography } from "../theme";

/**
 * The ambient glows behind every screen.
 *
 * These are the designer's own exported blobs rather than CSS gradients —
 * their falloff is hand-tuned and a radial gradient approximation reads
 * flatter. They sit behind everything and never take touches.
 *
 * Each variant places them differently, matching the corner each screen's
 * mockup puts its colour in.
 */
export type Backdrop = "home" | "journal" | "analysis" | "practice";

const LAYOUTS: Record<
  Backdrop,
  { source: number; style: object }[]
> = {
  home: [
    { source: backdrop.blue, style: { top: -80, right: -140, width: 380, height: 380 } },
    { source: backdrop.cyan, style: { top: 40, right: -60, width: 220, height: 220 } },
    { source: backdrop.crescent, style: { bottom: 40, left: -160, width: 420, height: 380 } },
  ],
  journal: [
    { source: backdrop.yellow, style: { top: -70, right: -70, width: 260, height: 260 } },
    { source: backdrop.blue, style: { top: 120, right: -120, width: 340, height: 340 } },
    { source: backdrop.magenta, style: { bottom: 120, left: -130, width: 300, height: 300 } },
  ],
  analysis: [
    { source: backdrop.cyan, style: { top: -60, left: -60, width: 280, height: 280 } },
    { source: backdrop.yellow, style: { bottom: 140, right: -90, width: 300, height: 300 } },
    { source: backdrop.blue, style: { bottom: -80, left: -100, width: 360, height: 360 } },
  ],
  practice: [
    { source: backdrop.blue, style: { top: 60, left: -120, width: 420, height: 300 } },
    { source: backdrop.cyan, style: { top: 100, right: -110, width: 280, height: 280 } },
  ],
};

export function Screen({
  children,
  backdrop: variant = "home",
}: {
  children: ReactNode;
  backdrop?: Backdrop;
}) {
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.fill}>
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        {LAYOUTS[variant].map((glow, i) => (
          <Image
            key={i}
            source={glow.source}
            style={[styles.glow, glow.style]}
            resizeMode="contain"
          />
        ))}
      </View>

      <View style={[styles.content, { paddingTop: insets.top + spacing.sm }]}>
        {children}
      </View>
    </View>
  );
}

/** Screen title, with the back chevron and trailing slot the mockups use. */
export function ScreenHeader({
  title,
  onBack,
  trailing,
  centered = false,
}: {
  title: string;
  onBack?: () => void;
  trailing?: ReactNode;
  centered?: boolean;
}) {
  return (
    <View style={styles.header}>
      {onBack ? (
        <Pressable
          onPress={onBack}
          accessibilityRole="button"
          accessibilityLabel="Go back"
          hitSlop={16}
        >
          <Text style={styles.back}>‹</Text>
        </Pressable>
      ) : null}
      <Text style={[styles.headerTitle, centered && styles.headerTitleCentered]}>
        {title}
      </Text>
      {trailing ? <View style={styles.headerTrailing}>{trailing}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1, backgroundColor: colors.ground },
  glow: { position: "absolute" },
  content: { flex: 1, paddingHorizontal: spacing.lg },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingBottom: spacing.md,
  },
  back: { fontSize: 32, lineHeight: 36, color: colors.ink, marginTop: -4 },
  headerTitle: { ...typography.display, color: colors.ink },
  headerTitleCentered: { flex: 1, textAlign: "center" },
  headerTrailing: { marginLeft: "auto" },
});
