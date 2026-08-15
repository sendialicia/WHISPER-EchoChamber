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

/**
 * Only the three Ellipse exports are used here. The other two glows have an
 * opaque near-white centre — they were drawn to sit behind a whole screen, and
 * floating one over this ground renders its centre as a hard pale disc rather
 * than a glow.
 */
const LAYOUTS: Record<
  Backdrop,
  { source: number; style: object; opacity?: number }[]
> = {
  home: [
    { source: backdrop.cyan, style: { top: -90, right: -90, width: 300, height: 300 } },
    { source: backdrop.magenta, style: { top: 180, left: -140, width: 300, height: 300 }, opacity: 0.5 },
    { source: backdrop.cyan, style: { bottom: 60, right: -130, width: 320, height: 320 }, opacity: 0.6 },
  ],
  journal: [
    { source: backdrop.yellow, style: { top: -80, right: -70, width: 260, height: 260 }, opacity: 0.7 },
    { source: backdrop.magenta, style: { top: 220, right: -140, width: 320, height: 320 }, opacity: 0.45 },
    { source: backdrop.cyan, style: { bottom: 100, left: -140, width: 300, height: 300 }, opacity: 0.55 },
  ],
  analysis: [
    { source: backdrop.cyan, style: { top: -70, left: -80, width: 280, height: 280 }, opacity: 0.7 },
    { source: backdrop.yellow, style: { bottom: 160, right: -110, width: 300, height: 300 }, opacity: 0.6 },
    { source: backdrop.magenta, style: { bottom: -90, left: -110, width: 320, height: 320 }, opacity: 0.45 },
  ],
  practice: [
    { source: backdrop.cyan, style: { top: -40, right: -110, width: 300, height: 300 }, opacity: 0.7 },
    { source: backdrop.magenta, style: { top: 120, left: -150, width: 300, height: 300 }, opacity: 0.4 },
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
            style={[styles.glow, glow.style, { opacity: glow.opacity ?? 0.8 }]}
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
