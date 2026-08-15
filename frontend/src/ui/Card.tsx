import type { ReactNode } from "react";
import { Image, StyleSheet, Text, View, type ViewStyle } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import {
  backdrop,
  colors,
  elevation,
  gradients,
  radius,
  spacing,
  typography,
} from "../theme";

/**
 * The pale glass panel most content sits in. It is barely lighter than the
 * ground, so the shadow rather than the fill is what separates it.
 */
export function Card({
  title,
  children,
  style,
}: {
  title?: string;
  children: ReactNode;
  style?: ViewStyle;
}) {
  return (
    <View style={[styles.card, style]}>
      {title ? <Text style={styles.title}>{title}</Text> : null}
      {children}
    </View>
  );
}

/**
 * The deep indigo card carrying a headline — the Echo Chamber Meter, "Choose
 * A Practice". The design fills these with soft concentric glows, so one is
 * layered in behind the content. Text inside must use `onDark` colours.
 */
export function FeatureCard({
  children,
  style,
}: {
  children: ReactNode;
  style?: ViewStyle;
}) {
  return (
    <View style={[styles.feature, style]}>
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <Image source={backdrop.crescent} style={styles.featureGlow} resizeMode="cover" />
      </View>
      {children}
    </View>
  );
}

/** Blue callout — "What's this mean?", "Tip!", "Results!". */
export function InfoCard({ title, body }: { title: string; body: string }) {
  return (
    <LinearGradient
      colors={gradients.info}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.info}
    >
      <Text style={styles.infoTitle}>{title}</Text>
      <Text style={styles.infoBody}>{body}</Text>
    </LinearGradient>
  );
}

/** Pastel card used for the opposing view and for quoted content. */
export function OppositeCard({
  children,
  style,
}: {
  children: ReactNode;
  style?: ViewStyle;
}) {
  return (
    <LinearGradient
      colors={gradients.opposite}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.opposite, style]}
    >
      {children}
    </LinearGradient>
  );
}

/** A labelled block inside a card — "Side A", "Common ground", and so on. */
export function CardSection({
  label,
  body,
  icon,
}: {
  label: string;
  body: string;
  icon?: string;
}) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionLabel}>
        {icon ? `${icon}  ` : ""}
        {label}
      </Text>
      <Text style={styles.sectionBody}>{body}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    padding: spacing.md,
    gap: spacing.sm,
    ...elevation,
  },
  feature: {
    backgroundColor: colors.deep,
    borderRadius: radius.lg,
    padding: spacing.lg,
    gap: spacing.md,
    overflow: "hidden",
    ...elevation,
  },
  featureGlow: {
    position: "absolute",
    right: -90,
    bottom: -110,
    width: 340,
    height: 340,
    opacity: 0.5,
  },
  info: {
    borderRadius: radius.md,
    padding: spacing.md,
    gap: spacing.xs,
  },
  infoTitle: { ...typography.label, color: colors.onDark },
  infoBody: { ...typography.caption, color: colors.onDarkSoft, lineHeight: 18 },
  opposite: {
    borderRadius: radius.md,
    padding: spacing.md,
    gap: spacing.sm,
  },
  title: { ...typography.heading, color: colors.ink },
  section: { gap: spacing.xs },
  sectionLabel: { ...typography.label, color: colors.ink },
  sectionBody: { ...typography.body, color: colors.inkSoft, lineHeight: 21 },
});
