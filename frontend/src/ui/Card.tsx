import type { ReactNode } from "react";
import { StyleSheet, Text, View, type ViewStyle } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { colors, elevation, gradients, radius, spacing, typography } from "../theme";

/** The plain white panel most content sits in. */
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
 * The rich blue-to-purple card that carries the headline number — the Echo
 * Chamber Meter, "Choose A Practice". Text inside must use `onDark` colours.
 */
export function FeatureCard({
  children,
  style,
}: {
  children: ReactNode;
  style?: ViewStyle;
}) {
  return (
    <LinearGradient
      colors={gradients.feature}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.feature, style]}
    >
      {children}
    </LinearGradient>
  );
}

/** Blue callout — "Tip!", "What's this mean?", "Results!". */
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
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    padding: spacing.lg,
    gap: spacing.md,
    ...elevation,
  },
  feature: {
    borderRadius: radius.lg,
    padding: spacing.lg,
    gap: spacing.md,
    ...elevation,
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
